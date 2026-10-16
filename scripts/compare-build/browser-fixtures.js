// Browser comparison of a build against a baseline build on fixed bot content, for every template.
// The page embeds the widget with the customer snippet. Playwright answers the remote config and Direct Line
// requests (fixtures/content.js), so both builds get the same conversation: markdown, suggested actions,
// an adaptive card with inputs, a hero card carousel, thumbnail and receipt cards, an image, source links
// opening the sweetalert2 dialog, a file upload and the persistent menu (v2 templates only).
// For every step, the screenshots of both builds must match, and the activities the widget sent to the bot must
// be the same. Page errors fail the test.
//
// Serve both builds with the dev server (npm run dev), e.g. the baseline from a worktree on PORT=1301:
//   node scripts/compare-build/browser-fixtures.js http://localhost:1301 http://localhost:1234 <output dir> [--browsers=chrome,firefox] [template ...]
// Templates are named as in the remote config. See browserTools.js for the Playwright setup.
const fs = require('fs');
const path = require('path');
const util = require('util');
const { parseArgs, launchBrowser, newPage, waitForStableCount, screenshot, compareScreenshots } = require('./browserTools');
const { FIXTURE_ORIGIN, HOSTING_ID, BOT, TIMESTAMP, TEMPLATES, remoteConfig, MESSAGES, imageForName } = require('./fixtures/content');

const DIRECT_LINE = 'https://directline.botframework.com/v3/directline';
const CONVERSATION_ID = 'fixture-conversation';
const PAGE_PATH = '/__compare-build-fixture__';
const MASKED_SELECTORS = ['.wc-time'];
const TIMEOUT = 15000;

// The customer snippet, as in scripts/dev-server/pages.js.
const PAGE_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Fixture</title>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
  </head>
  <body>
    <link href="/botchat.css" rel="stylesheet" />
    <script type="text/javascript">
      (function (f,y,b,o,t,s){(t = y.createElement(b)), (s = y.getElementsByTagName(b)[0]);t.async = 1;t.src = "/botchat-es5.js";t.onload=function(){BotChat.App({
        bot: { id: ${JSON.stringify(HOSTING_ID)} },
        channel: { id: "fixture" }
      })};s.parentNode.insertBefore(t, s);})(window, document, "script");
    </script>
  </body>
</html>
`;

const PREVIEW_HTML = '<!DOCTYPE html><html><body style="font-family: sans-serif"><h1>Dokument</h1><p>Náhled zdroje.</p></body></html>';

function corsHeaders(request) {
	return {
		'access-control-allow-origin': '*',
		'access-control-allow-methods': 'GET, POST, OPTIONS',
		'access-control-allow-headers': request.headers()['access-control-request-headers'] || '*'
	};
}

function fulfillJson(route, status, body) {
	return route.fulfill({
		status,
		contentType: 'application/json',
		headers: corsHeaders(route.request()),
		body: JSON.stringify(body)
	});
}

// Reads the activity and file names from a Direct Line upload (multipart/form-data).
function parseUpload(request) {
	const boundary = /boundary=(.+)$/.exec(request.headers()['content-type'] || '')[1];
	const parts = request
		.postDataBuffer()
		.toString('latin1')
		.split('--' + boundary)
		.slice(1, -1);
	let activity = null;
	const files = [];
	parts.forEach(part => {
		const [headers, ...body] = part.replace(/^\r\n/, '').split('\r\n\r\n');
		const content = body.join('\r\n\r\n').replace(/\r\n$/, '');
		if (/name="activity"/.test(headers)) {
			activity = JSON.parse(Buffer.from(content, 'latin1').toString('utf8'));
		} else {
			const name = /filename="([^"]*)"/.exec(headers);
			const type = /content-type: *(.+)/i.exec(headers);
			files.push({ name: name && name[1], contentType: type && type[1].trim(), size: Buffer.byteLength(content, 'latin1') });
		}
	});
	return { activity, files };
}

// The bot side of the Direct Line conversation. Echoes the activities the widget posts, as Direct Line does.
class FixtureBot {
	constructor() {
		this.posted = [];
		this.problems = [];
		this.watermark = 0;
		this.socket = new Promise(resolve => (this.onSocket = resolve));
	}

	// The widget connects to Direct Line when it is first expanded.
	async send(activity) {
		const socket = await Promise.race([
			this.socket,
			new Promise((resolve, reject) => setTimeout(() => reject(new Error('the widget did not open the Direct Line WebSocket')), TIMEOUT))
		]);
		this.watermark++;
		const id = `${CONVERSATION_ID}|${this.watermark}`;
		socket.send(JSON.stringify({ activities: [{ ...activity, id, conversation: { id: CONVERSATION_ID } }], watermark: String(this.watermark) }));
		return id;
	}

	say(activity) {
		return this.send({ ...activity, from: BOT, timestamp: TIMESTAMP });
	}

	// Stores an activity the widget posted and echoes it back.
	receive(activity, echo = activity) {
		this.posted.push(activity);
		this.send({ ...echo, timestamp: TIMESTAMP }).catch(error => this.problems.push(`echo failed: ${error.message}`));
		return `posted-${this.posted.length}`;
	}

	async waitForPosted(description, predicate) {
		for (const start = Date.now(); Date.now() - start < TIMEOUT; ) {
			if (this.posted.some(predicate)) {
				return;
			}
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		throw new Error(`the widget did not send ${description}`);
	}

	async route(page, baseUrl, templateType) {
		await page.route(baseUrl + PAGE_PATH, route => route.fulfill({ contentType: 'text/html', body: PAGE_HTML }));
		await page.route(/^https:\/\/[^/]+\.azurewebsites\.net\//, route => {
			const request = route.request();
			if (request.method() === 'OPTIONS') {
				return route.fulfill({ status: 204, headers: corsHeaders(request) });
			}
			if (new URL(request.url()).pathname === '/webchat/config') {
				return fulfillJson(route, 200, remoteConfig(templateType));
			}
			this.problems.push(`unexpected request ${request.method()} ${request.url()}`);
			return fulfillJson(route, 404, {});
		});
		await page.route(url => url.href.startsWith(FIXTURE_ORIGIN + '/'), route => {
			const { pathname } = new URL(route.request().url());
			const image = /^\/(?:images|attachments)\/(.+)\.png$/.exec(pathname);
			if (image) {
				return route.fulfill({ contentType: 'image/png', headers: corsHeaders(route.request()), body: imageForName(image[1]) });
			}
			return route.fulfill({ contentType: 'text/html; charset=utf-8', body: PREVIEW_HTML });
		});
		await page.route(url => url.href.startsWith(DIRECT_LINE + '/'), route => {
			const request = route.request();
			if (request.method() === 'OPTIONS') {
				return route.fulfill({ status: 204, headers: corsHeaders(request) });
			}
			const endpoint = `${request.method()} ${new URL(request.url()).pathname.slice('/v3/directline'.length)}`;
			const conversation = {
				conversationId: CONVERSATION_ID,
				token: 'fixture-token',
				expires_in: 3600,
				streamUrl: `wss://directline.botframework.com/v3/directline/conversations/${CONVERSATION_ID}/stream?t=fixture`
			};
			if (endpoint === 'POST /conversations' || endpoint === 'POST /tokens/refresh') {
				return fulfillJson(route, 201, conversation);
			}
			if (endpoint === `POST /conversations/${CONVERSATION_ID}/activities`) {
				return fulfillJson(route, 200, { id: this.receive(request.postDataJSON()) });
			}
			if (endpoint === `POST /conversations/${CONVERSATION_ID}/upload`) {
				const { activity, files } = parseUpload(request);
				const attachments = files.map((file, index) => ({
					contentType: file.contentType,
					contentUrl: `${FIXTURE_ORIGIN}/attachments/upload-${index}.png`,
					name: file.name
				}));
				return fulfillJson(route, 200, { id: this.receive({ upload: files, activity }, { ...activity, attachments }) });
			}
			this.problems.push(`unexpected request ${request.method()} ${request.url()}`);
			return fulfillJson(route, 404, {});
		});
		await page.routeWebSocket(/^wss:\/\/directline\.botframework\.com\//, socket => {
			// The widget pings with empty messages, there is nothing to answer.
			socket.onMessage(() => {});
			this.onSocket(socket);
		});
	}
}

async function settle(page) {
	await waitForStableCount(page, '.wc-message-wrapper, .wc-card, .swal2-popup', { stableChecks: 2, interval: 400 });
	await page
		.waitForFunction(() => Array.prototype.every.call(document.images, image => image.complete), null, { timeout: TIMEOUT })
		.catch(() => {});
	// A font subset (e.g. latin-ext for Czech letters) is otherwise loaded only when a page first uses it,
	// which can be after the screenshot.
	await page.evaluate(() =>
		Promise.all(Array.from(document.fonts).map(font => font.load().catch(() => undefined))).then(() => document.fonts.ready).then(() => undefined)
	);
	await page.waitForTimeout(300);
}

async function botSays(page, bot, message) {
	const id = await bot.say(message);
	await page.locator(`.wc-message-wrapper[data-activity-id="${id}"]`).waitFor({ timeout: TIMEOUT });
}

// Throws Skip when an element the step needs is not in this template, so both builds must skip the same steps.
class Skip extends Error {}
async function visible(locator, description) {
	try {
		await locator.first().waitFor({ state: 'visible', timeout: 3000 });
	} catch (error) {
		throw new Skip(`no ${description}`);
	}
	return locator.first();
}

// Each step runs, then the page settles and is screenshotted.
const STEPS = [
	['collapsed', async () => {}],
	[
		'expanded',
		async ({ page, bot }) => {
			const collapsedHeader = page.locator('.feedbot-wrapper.collapsed .feedbot-header');
			if (await collapsedHeader.count()) {
				await collapsedHeader.first().click();
			}
			// The assistant template starts the conversation with the first question, e.g. an example query.
			const exampleQuery = page.locator('.example-query').first();
			if (await exampleQuery.count()) {
				const query = await exampleQuery.innerText();
				await exampleQuery.click();
				await page.locator('#chat-input').press('Enter');
				await bot.waitForPosted('the example query', activity => activity.text === query);
			}
			await page.getByRole('textbox').first().waitFor({ state: 'visible', timeout: TIMEOUT });
		}
	],
	['welcome', ({ page, bot }) => botSays(page, bot, MESSAGES.welcome)],
	[
		'suggested-action',
		async ({ page, bot }) => {
			await (await visible(page.locator('.wc-suggested-actions button', { hasText: 'Ano' }), 'suggested action')).click();
			await bot.waitForPosted('the suggested action', activity => activity.text === 'Ano');
		}
	],
	['typed-message', async ({ page, bot }) => {
		const input = page.getByRole('textbox').first();
		await input.fill('Zpráva z klávesnice');
		await input.press('Enter');
		await bot.waitForPosted('the typed message', activity => activity.text === 'Zpráva z klávesnice');
	}],
	['adaptive-card', ({ page, bot }) => botSays(page, bot, MESSAGES.adaptiveCard)],
	[
		'adaptive-card-submitted',
		async ({ page, bot }) => {
			const card = page.locator('.wc-adaptive-card').last();
			await (await visible(card.getByPlaceholder('Jméno'), 'adaptive card text input')).fill('Jan Novák');
			await card.getByText('Malý').click();
			await card.getByText('Souhlasím').click();
			await card.getByRole('button', { name: 'Odeslat' }).click();
			await bot.waitForPosted('the adaptive card values', activity => activity.value && activity.value.action === 'submit');
		}
	],
	['carousel', ({ page, bot }) => botSays(page, bot, MESSAGES.carousel)],
	[
		'carousel-scrolled',
		async ({ page }) => {
			await (await visible(page.locator('.wc-carousel button.scroll.next'), 'carousel scroll button')).click();
			await page.waitForTimeout(1000);
		}
	],
	[
		'card-button',
		async ({ page, bot }) => {
			await (await visible(page.locator('.wc-carousel button', { hasText: 'Vybrat' }), 'hero card button')).click();
			await bot.waitForPosted('the hero card button value', activity => /^Produkt \d$/.test(activity.text || ''));
		}
	],
	['list', ({ page, bot }) => botSays(page, bot, MESSAGES.list)],
	['sources', ({ page, bot }) => botSays(page, bot, MESSAGES.sources)],
	[
		'dialog',
		async ({ page }) => {
			await (await visible(page.locator('a.source-link-chip'), 'source link')).click();
			await page.locator('.swal2-popup').waitFor({ state: 'visible', timeout: TIMEOUT });
			await page.frameLocator('.swal2-popup iframe').getByText('Dokument').waitFor({ timeout: TIMEOUT });
		}
	],
	[
		'dialog-closed',
		async ({ page }) => {
			await page.locator('.swal2-close').click();
			await page.locator('.swal2-popup').waitFor({ state: 'detached', timeout: TIMEOUT });
		}
	],
	['upload-request', ({ page, bot }) => botSays(page, bot, MESSAGES.uploadRequest)],
	[
		'upload',
		async ({ page, bot }) => {
			await visible(page.locator('label.wc-upload'), 'upload button');
			await page.setInputFiles('#wc-upload-input', { name: 'upload.png', mimeType: 'image/png', buffer: imageForName('upload') });
			await bot.waitForPosted('the uploaded file', activity => !!activity.upload);
		}
	],
	[
		'menu',
		async ({ page }) => {
			await (await visible(page.locator('.feedbot-persistent-menu-toggle'), 'persistent menu')).hover();
			await page.locator('.feedbot-persistent-menu-links a', { hasText: 'Kontakt' }).waitFor({ state: 'visible', timeout: TIMEOUT });
		}
	],
	[
		'menu-item',
		async ({ page, bot }) => {
			await (await visible(page.locator('.feedbot-persistent-menu-links a', { hasText: 'Kontakt' }), 'persistent menu item')).click();
			await bot.waitForPosted('the persistent menu dialog', activity => JSON.stringify(activity).indexOf('fixture-contact-dialog') !== -1);
		}
	]
];

// Replaces the values that differ between page loads: generated ids, times and the page origin.
function normalize(value, baseUrl) {
	const json = JSON.stringify(value, (key, item) => {
		if (['id', 'timestamp', 'localTimestamp', 'clientActivityId'].indexOf(key) !== -1 && typeof item === 'string') {
			return `<${key}>`;
		}
		return item;
	});
	return JSON.parse(json.split(baseUrl).join('<base url>'));
}

async function runBuild(browser, baseUrl, templateType, prefix, build) {
	const page = await newPage(browser);
	const bot = new FixtureBot();
	const result = { problems: [], skipped: [], consoleErrors: [], externalHosts: new Set() };
	if (process.env.DEBUG_FIXTURES) {
		page.on('console', message => console.log(`    [${build} console] ${message.text().slice(0, 300)}`));
		page.on('request', request => console.log(`    [${build} request] ${request.method()} ${request.url().slice(0, 150)}`));
	}
	page.on('pageerror', error => result.problems.push(`page error: ${error.message}`));
	page.on('console', message => message.type() === 'error' && result.consoleErrors.push(message.text().split(baseUrl).join('<base url>')));
	page.on('request', request => {
		const { origin } = new URL(request.url());
		if (origin !== baseUrl && origin !== FIXTURE_ORIGIN && !/azurewebsites\.net$|botframework\.com$/.test(new URL(origin).hostname)) {
			result.externalHosts.add(origin);
		}
	});
	page.on('response', response => {
		if (response.status() >= 400 && response.url().startsWith(baseUrl)) {
			result.problems.push(`HTTP ${response.status()} ${response.url()}`);
		}
	});
	await bot.route(page, baseUrl, templateType);
	try {
		await page.goto(baseUrl + PAGE_PATH, { waitUntil: 'load' });
		await page.waitForSelector('.feedbot-wrapper', { timeout: TIMEOUT });
		for (const [index, [step, run]] of STEPS.entries()) {
			try {
				await run({ page, bot });
			} catch (error) {
				if (error instanceof Skip) {
					result.skipped.push(`${step} (${error.message})`);
					continue;
				}
				throw new Error(`step ${step}: ${error.message.split('\n')[0]}`);
			}
			await settle(page);
			await screenshot(page, `${prefix}.${String(index).padStart(2, '0')}-${step}.${build}.png`, MASKED_SELECTORS);
		}
	} catch (error) {
		result.problems.unshift(error.message.split('\n')[0]);
	}
	result.posted = normalize(bot.posted, baseUrl);
	result.problems.push(...bot.problems);
	await page.close();
	return result;
}

async function testTemplate(browser, comparisonPage, baselineUrl, newUrl, templateType, outDir) {
	const prefix = path.join(outDir, templateType);
	fs.readdirSync(outDir)
		.filter(file => file.startsWith(templateType + '.'))
		.forEach(file => fs.unlinkSync(path.join(outDir, file)));
	const results = {};
	for (const [build, baseUrl] of [['baseline', baselineUrl], ['new', newUrl]]) {
		results[build] = await runBuild(browser, baseUrl, templateType, prefix, build);
	}
	const problems = [];
	const pixelProblems = [];
	['baseline', 'new'].forEach(build => results[build].problems.forEach(problem => problems.push(`${build}: ${problem}`)));
	if (results.baseline.skipped.join() !== results.new.skipped.join()) {
		problems.push(`skipped steps differ: baseline [${results.baseline.skipped.join(', ')}], new [${results.new.skipped.join(', ')}]`);
	}
	if (!util.isDeepStrictEqual(results.baseline.posted, results.new.posted)) {
		const file = build => `${prefix}.posted.${build}.json`;
		['baseline', 'new'].forEach(build => fs.writeFileSync(file(build), JSON.stringify(results[build].posted, null, 2)));
		problems.push(`the widget sent different activities, compare ${file('baseline')} and ${file('new')}`);
	}
	if (results.baseline.consoleErrors.join('\n') !== results.new.consoleErrors.join('\n')) {
		problems.push(`console errors differ:\n      baseline: ${results.baseline.consoleErrors.join('\n                ')}\n      new: ${results.new.consoleErrors.join('\n           ')}`);
	}
	for (const [index, [step]] of STEPS.entries()) {
		const stepPrefix = `${prefix}.${String(index).padStart(2, '0')}-${step}`;
		if (fs.existsSync(`${stepPrefix}.baseline.png`) || fs.existsSync(`${stepPrefix}.new.png`)) {
			const problem = await compareScreenshots(comparisonPage, stepPrefix, `${templateType} ${step}`);
			if (problem) {
				(problem.pixelsOnly ? pixelProblems : problems).push(problem.message);
			}
		}
	}
	const info = [
		`${results.new.posted.length} activities sent`,
		results.new.skipped.length && `skipped ${results.new.skipped.join(', ')}`,
		results.new.externalHosts.size && `external requests to ${Array.from(results.new.externalHosts).join(', ')}`
	].filter(Boolean);
	console.log(`  ${templateType}: ${info.join('; ')}`);
	return { problems, pixelProblems };
}

async function main() {
	const { positional, browsers } = parseArgs(process.argv.slice(2));
	const [baselineUrl, newUrl, outDir, ...onlyTemplates] = positional;
	if (!baselineUrl || !newUrl || !outDir) {
		console.error(
			'Usage: node scripts/compare-build/browser-fixtures.js <baseline url> <new url> <output dir> [--browsers=chrome,firefox,webkit] [template ...]'
		);
		process.exit(2);
	}
	const templates = onlyTemplates.length ? TEMPLATES.filter(type => onlyTemplates.indexOf(type) !== -1) : TEMPLATES;

	let failures = 0;
	for (const browserName of browsers) {
		console.log(`${browserName}:`);
		const browserOutDir = path.join(outDir, browserName);
		fs.mkdirSync(browserOutDir, { recursive: true });
		const browser = await launchBrowser(browserName);
		const comparisonPage = await browser.newPage();
		for (const templateType of templates) {
			let result = await testTemplate(browser, comparisonPage, baselineUrl, newUrl, templateType, browserOutDir);
			// Firefox occasionally rasterizes a few glyphs differently between page loads (a dozen pixels of a
			// háček), also when both pages load the same build. A template whose only problems are screenshots
			// differing in pixels is therefore run once more, into the retry folder, so the screenshots of the
			// first run are kept. Any other problem fails right away: retrying could hide an intermittent bug.
			if (!result.problems.length && result.pixelProblems.length) {
				console.log(`  ${templateType}: retrying after\n    ${result.pixelProblems.join('\n    ')}`);
				const retryOutDir = path.join(browserOutDir, 'retry');
				fs.mkdirSync(retryOutDir, { recursive: true });
				result = await testTemplate(browser, comparisonPage, baselineUrl, newUrl, templateType, retryOutDir);
			}
			const problems = result.problems.concat(result.pixelProblems);
			if (problems.length) {
				failures++;
				console.error(`✗ ${browserName} ${templateType}\n    ${problems.join('\n    ')}`);
			} else {
				console.log(`✓ ${browserName} ${templateType}`);
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
