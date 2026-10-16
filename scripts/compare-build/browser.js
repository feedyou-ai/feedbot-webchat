// Browser acceptance test of a build against a baseline build, on every test channel (test_channels.js):
// - screenshots of the widget collapsed and expanded must match the baseline (pixel comparison),
// - the page must not throw, and a message sent in the new build must get a bot reply (smoke test).
//
// Serve both builds with the dev server (npm run dev), e.g. the baseline from a worktree on PORT=1301:
//   node scripts/compare-build/browser.js http://localhost:1301 http://localhost:1234 <output dir> [--browsers=chrome,firefox] [/botId/channelId ...]
// See browserTools.js for the Playwright setup. The output directory gets a folder per browser with the screenshots
// and, for those that differ, an image with the differences in red.
// Bot messages can differ between two page loads, so message contents and timestamps are masked (magenta).
// Some bots rate-limit page loads (HTTP 429). The channel is then retried after RATE_LIMIT_WAIT_MS.
const fs = require('fs');
const path = require('path');
const { loadTestChannels } = require('../dev-server/loadTestChannels');
const { parseArgs, launchBrowser, newPage, waitForStableCount, screenshot, compareScreenshots } = require('./browserTools');

const MASKED_SELECTORS = ['.wc-message-content', '.wc-message-from', '.wc-time', '.feedbot-popup-message'];
const RATE_LIMIT_WAIT_MS = 330000;
const RATE_LIMIT_RETRIES = 3;

async function openChannel(browser, baseUrl, problems, rateLimited) {
	const page = await newPage(browser);
	page.on('pageerror', error => problems.push(`page error: ${error.message}`));
	page.on('response', response => {
		if (response.status() === 429) {
			rateLimited.push(response.url());
		} else if (response.status() >= 400 && response.url().startsWith(baseUrl)) {
			problems.push(`HTTP ${response.status()} ${response.url()}`);
		}
	});
	return page;
}

// Bot messages arrive with delays.
function waitForStableMessages(page) {
	return waitForStableCount(page, '.wc-message-wrapper');
}

async function loadChannel(page, baseUrl, channelPath) {
	await page.goto(baseUrl + channelPath, { waitUntil: 'load' });
	await page.waitForSelector('.feedbot-wrapper', { timeout: 20000 });
	await waitForStableMessages(page);
}

async function expand(page) {
	const collapsedHeader = page.locator('.feedbot-wrapper.collapsed .feedbot-header');
	if (await collapsedHeader.count()) {
		await collapsedHeader.first().click();
	}
	await page.getByRole('textbox').first().waitFor({ state: 'visible', timeout: 20000 });
	await waitForStableMessages(page);
}

async function sendMessage(page) {
	const countBotMessages = () =>
		page.evaluate(
			() =>
				Array.prototype.filter.call(document.querySelectorAll('.wc-message-from-bot'), element =>
					element.innerText.trim()
				).length
		);
	const before = await countBotMessages();
	const input = page.getByRole('textbox').first();
	await input.fill('Ahoj');
	await input.press('Enter');
	await page.locator('.wc-message-from-me').filter({ hasText: 'Ahoj' }).first().waitFor({ timeout: 20000 });
	await page.waitForFunction(
		count =>
			Array.prototype.filter.call(document.querySelectorAll('.wc-message-from-bot'), element =>
				element.innerText.trim()
			).length > count,
		before,
		{ timeout: 60000 }
	);
}

// Loads the channel in both builds and returns the problems found, or null when the bot rate-limited a page load.
async function testChannel(browser, comparisonPage, baselineUrl, newUrl, channelPath, outDir) {
	const name = channelPath.slice(1).replace('/', '_');
	const problems = [];
	for (const [build, baseUrl] of [['baseline', baselineUrl], ['new', newUrl]]) {
		const buildProblems = [];
		const rateLimited = [];
		const page = await openChannel(browser, baseUrl, buildProblems, rateLimited);
		try {
			await loadChannel(page, baseUrl, channelPath);
			await screenshot(page, path.join(outDir, `${name}.collapsed.${build}.png`), MASKED_SELECTORS);
			await expand(page);
			await screenshot(page, path.join(outDir, `${name}.expanded.${build}.png`), MASKED_SELECTORS);
			if (build === 'new') {
				await sendMessage(page);
			}
		} catch (error) {
			buildProblems.unshift(error.message.split('\n')[0]);
		}
		await page.close();
		if (rateLimited.length) {
			console.log(`  ${channelPath}: HTTP 429 from ${rateLimited[0]}`);
			return null;
		}
		buildProblems.forEach(problem => problems.push(`${build}: ${problem}`));
	}
	for (const state of ['collapsed', 'expanded']) {
		const problem = await compareScreenshots(comparisonPage, path.join(outDir, `${name}.${state}`), `${channelPath} ${state}`);
		if (problem) {
			problems.push(problem.message);
		}
	}
	return problems;
}

async function main() {
	const { positional, browsers } = parseArgs(process.argv.slice(2));
	const [baselineUrl, newUrl, outDir, ...onlyChannels] = positional;
	if (!baselineUrl || !newUrl || !outDir) {
		console.error(
			'Usage: node scripts/compare-build/browser.js <baseline url> <new url> <output dir> [--browsers=chrome,firefox,webkit] [/botId/channelId ...]'
		);
		process.exit(2);
	}
	const channelPaths = [];
	loadTestChannels().forEach(bot => bot.channelIds.forEach(id => channelPaths.push(`/${bot.botId}/${id}`)));
	const selectedChannelPaths = onlyChannels.length ? channelPaths.filter(p => onlyChannels.indexOf(p) !== -1) : channelPaths;

	let failures = 0;
	for (const browserName of browsers) {
		console.log(`${browserName}:`);
		const browserOutDir = path.join(outDir, browserName);
		fs.mkdirSync(browserOutDir, { recursive: true });
		const browser = await launchBrowser(browserName);
		const comparisonPage = await browser.newPage();
		for (const channelPath of selectedChannelPaths) {
			let problems = null;
			for (let attempt = 0; problems === null; attempt++) {
				if (attempt > RATE_LIMIT_RETRIES) {
					problems = [`still rate-limited (HTTP 429) after ${RATE_LIMIT_RETRIES} retries`];
					break;
				}
				if (attempt > 0) {
					console.log(`  ${channelPath}: waiting ${RATE_LIMIT_WAIT_MS / 60000} minutes for the bot's rate limit`);
					await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WAIT_MS));
				}
				problems = await testChannel(browser, comparisonPage, baselineUrl, newUrl, channelPath, browserOutDir);
			}
			if (problems.length) {
				failures++;
				console.error(`✗ ${browserName} ${channelPath}\n    ${problems.join('\n    ')}`);
			} else {
				console.log(`✓ ${browserName} ${channelPath}`);
			}
		}
		await browser.close();
	}
	process.exit(failures ? 1 : 0);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
