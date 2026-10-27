// Compares the window globals each bundle defines (names, value types, property descriptors, two levels
// deep), loading the bundles into jsdom.
//   node scripts/compare-build/exports.js <baseline dir> <new dir>
const path = require('path');
const { describeGlobals } = require('./describeGlobals');

const BUNDLES = ['botchat.js', 'botchat-es5.js', 'CognitiveServices.js'];

// core-js names some symbol polyfill keys with a random suffix.
function describe(bundlePath) {
	return JSON.stringify(describeGlobals(bundlePath), null, 1).replace(
		/(Symbol\([a-z_]+\)_\d+)\.[0-9a-z]+/g,
		'$1.<random>'
	);
}

const [baselineDir, newDir] = process.argv.slice(2);
if (!baselineDir || !newDir) {
	console.error('Usage: node scripts/compare-build/exports.js <baseline dir> <new dir>');
	process.exit(2);
}
let failed = false;
BUNDLES.forEach(bundle => {
	const baselineLines = describe(path.join(baselineDir, bundle)).split('\n');
	const newLines = describe(path.join(newDir, bundle)).split('\n');
	const firstDifference = baselineLines.findIndex((line, i) => line !== newLines[i]);
	if (firstDifference === -1 && baselineLines.length === newLines.length) {
		console.log(`✓ ${bundle}: window globals are the same`);
		return;
	}
	failed = true;
	const index = firstDifference === -1 ? baselineLines.length : firstDifference;
	console.error(`✗ ${bundle}: window globals differ, first at line ${index + 1}:`);
	console.error(`  - ${baselineLines.slice(Math.max(0, index - 3), index + 3).join('\n  - ')}`);
	console.error(`  + ${newLines.slice(Math.max(0, index - 3), index + 3).join('\n  + ')}`);
});
process.exit(failed ? 1 : 0);
