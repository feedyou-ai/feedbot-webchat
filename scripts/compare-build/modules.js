// Compares the modules bundled into each bundle, read from the source maps, with package versions.
//   node scripts/compare-build/modules.js <baseline dir> <new dir> [bundle ...]
// Both directories must contain the bundles and the node_modules they were built from.
// Exits with 1 when a module was added or removed and EXPECTED_DIFFERENCES does not explain it.
const fs = require('fs');
const path = require('path');

const BUNDLES = ['botchat.js', 'botchat-es5.js', 'CognitiveServices.js'];

// Differences between the webpack 2 / TypeScript 2.3 build and the Rspack / SWC build.
const EXPECTED_DIFFERENCES = [
	{ removed: /^tslib@1\.7\.1\//, reason: 'TypeScript helpers, replaced by @swc/helpers' },
	{ added: /^@swc\/helpers@/, reason: 'SWC helpers, replace tslib 1.7.1' },
	{ added: /^expose-loader@[^/]+\/dist\/runtime\//, reason: 'runtime of the upgraded expose-loader' },
	{ added: /^scripts\/build\/entries\//, reason: 'bundle entries, see scripts/build/entries/toPlainExports.js' },
	{ added: /^src\/polyfills\/(save|restore)ArrayBuffer\.ts$/, reason: 'split out of src/BotChatWithPolyfill.ts' },
	{
		added: /^microsoft-speech-browser-sdk@0\.0\.12\/src\/common\/IDisposable\.ts$/,
		reason: 'interfaces only: TypeScript dropped `export *` of it, SWC compiles files in isolation and keeps it'
	},
	{
		removed: /^react-redux@5\.0\.5\/es\/utils\/warning\.js$/,
		reason: 'only called when NODE_ENV is not production, the minifier now drops it'
	}
];

// Normalizes a source map source of a webpack 2 or Rspack bundle to a path relative to the package root.
// Returns null for bundler runtime code, which has no counterpart between the two bundlers.
function normalizeSource(source) {
	// Strips the namespace ("webpack:///" in webpack 2, "webpack://<package name>/" in Rspack) and the hash
	// that tells apart the two modules expose-loader creates for adaptivecards.
	let sourcePath = source.replace(/^webpack:\/\/.*?\/(?=\.\/|\.\.\/|webpack\/|\(webpack\))/, '').replace(/\?[0-9a-f]+$/, '');
	if (/^webpack\/(bootstrap|runtime)/.test(sourcePath) || sourcePath.startsWith('(webpack)/')) {
		return null;
	}
	sourcePath = sourcePath.replace(/^\.\//, '').replace(/(^|\/)~\//g, '$1node_modules/');
	// webpack 2 applied source-map-loader to built/lib.js, so it appeared as its source.
	if (sourcePath === '../src/lib.js') {
		sourcePath = 'built/lib.js';
	}
	return sourcePath;
}

function describeModule(rootDir, modulePath) {
	const match = modulePath.match(/^(.*node_modules\/)((?:@[^/]+\/)?[^/]+)\/(.*)$/);
	if (!match) {
		return modulePath;
	}
	const [, prefix, packageName, file] = match;
	const packageJsonPath = path.join(rootDir, prefix, packageName, 'package.json');
	const version = fs.existsSync(packageJsonPath) ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version : '?';
	return `${packageName}@${version}/${file}`;
}

function listModules(rootDir, bundle) {
	const map = JSON.parse(fs.readFileSync(path.join(rootDir, bundle + '.map'), 'utf8'));
	const modules = new Set();
	map.sources.forEach(source => {
		const modulePath = normalizeSource(source);
		// JSON modules have no source maps in Rspack bundles.
		if (modulePath && !modulePath.endsWith('.json')) {
			modules.add(describeModule(rootDir, modulePath));
		}
	});
	return [...modules].sort();
}

function findExpectedDifference(change, module) {
	return EXPECTED_DIFFERENCES.find(difference => difference[change] && difference[change].test(module));
}

function compareModules(baselineDir, newDir, bundles) {
	return bundles.map(bundle => {
		const baselineModules = listModules(baselineDir, bundle);
		const newModules = listModules(newDir, bundle);
		const describeChange = change => module => ({ module, expected: findExpectedDifference(change, module) });
		return {
			bundle,
			baselineCount: baselineModules.length,
			newCount: newModules.length,
			removed: baselineModules.filter(module => newModules.indexOf(module) === -1).map(describeChange('removed')),
			added: newModules.filter(module => baselineModules.indexOf(module) === -1).map(describeChange('added'))
		};
	});
}

if (require.main === module) {
	const [baselineDir, newDir, ...bundles] = process.argv.slice(2);
	if (!baselineDir || !newDir) {
		console.error('Usage: node scripts/compare-build/modules.js <baseline dir> <new dir> [bundle ...]');
		process.exit(2);
	}
	let unexpected = 0;
	compareModules(path.resolve(baselineDir), path.resolve(newDir), bundles.length ? bundles : BUNDLES).forEach(
		result => {
			console.log(`${result.bundle}: ${result.baselineCount} modules before, ${result.newCount} after`);
			const print = sign => ({ module, expected }) => {
				unexpected += expected ? 0 : 1;
				console.log(`  ${expected ? ' ' : '✗'} ${sign} ${module}  (${expected ? expected.reason : 'UNEXPECTED'})`);
			};
			result.removed.forEach(print('-'));
			result.added.forEach(print('+'));
		}
	);
	if (unexpected) {
		console.error(`✗ ${unexpected} unexpected module differences`);
		process.exit(1);
	}
	console.log('✓ All module differences are expected');
}

module.exports = { compareModules, listModules };
