// Helpers shared by the browser comparisons (browser.js, browser-fixtures.js).
// Needs the `playwright` package, which is not a dependency: npm install --no-save playwright
// Firefox and WebKit also need their browser builds: npx playwright install firefox webkit
const fs = require('fs');
const playwright = require('playwright');

const VIEWPORT = { width: 1280, height: 800 };
// A pixel differs when a color channel differs by more than this; a screenshot differs when more than
// MAX_DIFFERENT_PIXELS pixels do (anti-aliasing noise).
const CHANNEL_TOLERANCE = 16;
const MAX_DIFFERENT_PIXELS = 50;
const MASK_COLOR = '#ff00ff';
const BROWSERS = ['chrome', 'firefox', 'webkit'];

// Splits `--browsers=chrome,firefox` from the positional arguments. Chrome is the default.
function parseArgs(argv) {
	const positional = [];
	let browsers = ['chrome'];
	argv.forEach(arg => {
		const match = /^--browsers=(.+)$/.exec(arg);
		if (match) {
			browsers = match[1].split(',');
		} else {
			positional.push(arg);
		}
	});
	const unknown = browsers.filter(name => BROWSERS.indexOf(name) === -1);
	if (unknown.length) {
		throw new Error(`Unknown browser ${unknown.join(', ')}, use ${BROWSERS.join(', ')}`);
	}
	return { positional, browsers };
}

function launchBrowser(name) {
	return name === 'chrome'
		? playwright.chromium.launch({ channel: 'chrome', headless: true })
		: playwright[name].launch({ headless: true });
}

function newPage(browser) {
	return browser.newPage({ viewport: VIEWPORT, reducedMotion: 'reduce' });
}

// Waits until no element matching `selector` was added for `stableChecks` checks `interval` ms apart.
async function waitForStableCount(page, selector, { stableChecks = 3, interval = 1000, maxAttempts = 30 } = {}) {
	let count = -1;
	for (let stable = 0, attempts = 0; stable < stableChecks && attempts < maxAttempts; attempts++) {
		const current = await page.locator(selector).count();
		stable = current === count ? stable + 1 : 0;
		count = current;
		await page.waitForTimeout(interval);
	}
}

async function screenshot(page, file, maskedSelectors) {
	await page.screenshot({
		path: file,
		animations: 'disabled',
		mask: maskedSelectors.map(selector => page.locator(selector)),
		maskColor: MASK_COLOR
	});
}

// Compares two PNG screenshots in the browser, so no image library is needed. Writes a diff image if they differ.
// Pixels masked (magenta) in either screenshot are skipped, masked content can differ in size between page loads.
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

// Compares `<prefix>.baseline.png` with `<prefix>.new.png`. Returns null, or the problem: its `message` and
// whether only pixels differ (`pixelsOnly`), which rendering noise can cause, unlike a missing screenshot or a size.
async function compareScreenshots(comparisonPage, prefix, label) {
	const file = build => `${prefix}.${build}.png`;
	if (!fs.existsSync(file('baseline')) || !fs.existsSync(file('new'))) {
		return { message: `${label}: screenshot missing`, pixelsOnly: false };
	}
	const result = await compareImages(comparisonPage, file('baseline'), file('new'), file('diff'));
	if (result.differentPixels > MAX_DIFFERENT_PIXELS) {
		return result.sizeMismatch
			? { message: `${label}: screenshots differ in size`, pixelsOnly: false }
			: { message: `${label}: screenshot differs in ${result.differentPixels} pixels, see ${file('diff')}`, pixelsOnly: true };
	}
	console.log(`  ${label}: ${result.differentPixels} different pixels`);
	return null;
}

module.exports = {
	parseArgs,
	launchBrowser,
	newPage,
	waitForStableCount,
	screenshot,
	compareScreenshots
};
