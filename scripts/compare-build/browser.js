// Browser acceptance test of a build against a baseline build, on every test channel (test_channels.js):
// - screenshots of the widget collapsed and expanded must match the baseline (pixel comparison),
// - the page must not throw, and a message sent in the new build must get a bot reply (smoke test).
//
// Serve both builds with the dev server (npm run dev), e.g. the baseline from a worktree on PORT=1301:
//   node scripts/compare-build/browser.js http://localhost:1301 http://localhost:1234 <output dir> [/botId/channelId ...]
// Needs the `playwright` package, which is not a dependency: npm install --no-save playwright
// The output directory gets the screenshots and, for those that differ, an image with the differences in red.
// Bot messages can differ between two page loads, so message contents and timestamps are masked (magenta)
// and pixels masked in either screenshot are not compared.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { loadTestChannels } = require('../dev-server/loadTestChannels');

const VIEWPORT = { width: 1280, height: 800 };
// A pixel differs when a color channel differs by more than this; a screenshot differs when more than
// MAX_DIFFERENT_PIXELS pixels do (anti-aliasing noise).
const CHANNEL_TOLERANCE = 16;
const MAX_DIFFERENT_PIXELS = 50;
const MASKED_SELECTORS = ['.wc-message-content', '.wc-message-from', '.wc-time', '.feedbot-popup-message'];

async function openChannel(browser, baseUrl, problems) {
	const page = await browser.newPage({ viewport: VIEWPORT, reducedMotion: 'reduce' });
	page.on('pageerror', error => problems.push(`page error: ${error.message}`));
	page.on('response', response => {
		if (response.status() === 429) {
			problems.push(`HTTP 429 ${response.url()}: the bot rate-limits page loads, retry in about 5 minutes`);
		} else if (response.status() >= 400 && response.url().startsWith(baseUrl)) {
			problems.push(`HTTP ${response.status()} ${response.url()}`);
		}
	});
	return page;
}

async function loadChannel(page, baseUrl, channelPath) {
	await page.goto(baseUrl + channelPath, { waitUntil: 'load' });
	await page.waitForSelector('.feedbot-wrapper', { timeout: 20000 });
	await waitForStableMessages(page);
}

// Bot messages arrive with delays. Waits until no message was added for 3 seconds.
async function waitForStableMessages(page) {
	let count = -1;
	for (let stableChecks = 0, attempts = 0; stableChecks < 3 && attempts < 30; attempts++) {
		const current = await page.locator('.wc-message-wrapper').count();
		stableChecks = current === count ? stableChecks + 1 : 0;
		count = current;
		await page.waitForTimeout(1000);
	}
}

async function screenshot(page, file) {
	await page.screenshot({
		path: file,
		animations: 'disabled',
		mask: MASKED_SELECTORS.map(selector => page.locator(selector)),
		maskColor: '#ff00ff'
	});
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

// Compares two PNG screenshots in the browser, so no image library is needed. Writes a diff image if they differ.
async function compareImages(page, baselineFile, newFile, diffFile) {
	const result = await page.evaluate(
		async ({ baselineData, newData, tolerance }) => {
			const load = data =>
				new Promise((resolve, reject) => {
					const image = new Image();
					image.onload = () => resolve(image);
					image.onerror = reject;
					image.src = 'data:image/png;base64,' + data;
				});
			const [baselineImage, newImage] = await Promise.all([load(baselineData), load(newData)]);
			if (baselineImage.width !== newImage.width || baselineImage.height !== newImage.height) {
				return { sizeMismatch: true, differentPixels: Infinity };
			}
			const canvas = document.createElement('canvas');
			canvas.width = baselineImage.width;
			canvas.height = baselineImage.height;
			const context = canvas.getContext('2d');
			const readPixels = image => {
				context.drawImage(image, 0, 0);
				return context.getImageData(0, 0, canvas.width, canvas.height);
			};
			const baselinePixels = readPixels(baselineImage).data;
			const diff = readPixels(newImage);
			let differentPixels = 0;
			const isMasked = (pixels, i) => pixels[i] === 255 && pixels[i + 1] === 0 && pixels[i + 2] === 255;
			for (let i = 0; i < baselinePixels.length; i += 4) {
				// Masked content (bot messages) can differ in size between page loads, so masked pixels are skipped.
				const differs = !isMasked(baselinePixels, i) && !isMasked(diff.data, i) && [0, 1, 2, 3].some(
					channel => Math.abs(baselinePixels[i + channel] - diff.data[i + channel]) > tolerance
				);
				if (differs) {
					differentPixels++;
					diff.data.set([255, 0, 0, 255], i);
				} else {
					diff.data[i + 3] = 60;
				}
			}
			context.putImageData(diff, 0, 0);
			return { differentPixels, diffData: canvas.toDataURL('image/png').split(',')[1] };
		},
		{
			baselineData: fs.readFileSync(baselineFile, 'base64'),
			newData: fs.readFileSync(newFile, 'base64'),
			tolerance: CHANNEL_TOLERANCE
		}
	);
	if (result.differentPixels > 0 && result.diffData) {
		fs.writeFileSync(diffFile, Buffer.from(result.diffData, 'base64'));
	}
	return result;
}

async function main() {
	const [baselineUrl, newUrl, outDir, ...onlyChannels] = process.argv.slice(2);
	if (!baselineUrl || !newUrl || !outDir) {
		console.error('Usage: node scripts/compare-build/browser.js <baseline url> <new url> <output dir> [/botId/channelId ...]');
		process.exit(2);
	}
	fs.mkdirSync(outDir, { recursive: true });
	const channelPaths = [];
	loadTestChannels().forEach(bot => bot.channelIds.forEach(id => channelPaths.push(`/${bot.botId}/${id}`)));
	const selectedChannelPaths = onlyChannels.length ? channelPaths.filter(p => onlyChannels.indexOf(p) !== -1) : channelPaths;

	const browser = await chromium.launch({ channel: 'chrome', headless: true });
	const comparisonPage = await browser.newPage();
	let failures = 0;
	for (const channelPath of selectedChannelPaths) {
		const name = channelPath.slice(1).replace('/', '_');
		const problems = [];
		for (const [build, baseUrl] of [['baseline', baselineUrl], ['new', newUrl]]) {
			const buildProblems = [];
			const page = await openChannel(browser, baseUrl, buildProblems);
			try {
				await loadChannel(page, baseUrl, channelPath);
				await screenshot(page, path.join(outDir, `${name}.collapsed.${build}.png`));
				await expand(page);
				await screenshot(page, path.join(outDir, `${name}.expanded.${build}.png`));
				if (build === 'new') {
					await sendMessage(page);
				}
			} catch (error) {
				buildProblems.unshift(error.message.split('\n')[0]);
			}
			buildProblems.forEach(problem => problems.push(`${build}: ${problem}`));
			await page.close();
		}
		for (const state of ['collapsed', 'expanded']) {
			const file = build => path.join(outDir, `${name}.${state}.${build}.png`);
			if (!fs.existsSync(file('baseline')) || !fs.existsSync(file('new'))) {
				continue;
			}
			const result = await compareImages(comparisonPage, file('baseline'), file('new'), file('diff'));
			if (result.differentPixels > MAX_DIFFERENT_PIXELS) {
				problems.push(`${state} screenshot differs in ${result.differentPixels} pixels, see ${file('diff')}`);
			} else {
				console.log(`  ${channelPath} ${state}: ${result.differentPixels} different pixels`);
			}
		}
		if (problems.length) {
			failures++;
			console.error(`✗ ${channelPath}\n    ${problems.join('\n    ')}`);
		} else {
			console.log(`✓ ${channelPath}`);
		}
	}
	await browser.close();
	process.exit(failures ? 1 : 0);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
