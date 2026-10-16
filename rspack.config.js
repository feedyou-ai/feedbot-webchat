// Builds botchat.js, botchat-es5.js and CognitiveServices.js into the repository root.
// `rspack build --mode development` (npm run build) or `--mode production` (npm run build:release).
// The settings reproduce the output of the webpack 2 build this config replaced; see the comments below.
const fs = require('fs');
const path = require('path');
const { rspack } = require('@rspack/core');
const { getSwcOptions } = require('./scripts/build/swcOptions');

const ROOT_DIR = __dirname;

// patches/adaptivecards+1.1.0.patch renders emoji in adaptive cards through built/lib.js. patch-package applies it
// on `npm install` / `npm ci`, but not when a package is added with `npm install <package>`. Without this check
// the bundles would silently lose it.
const adaptiveCardElements = fs.readFileSync(require.resolve('adaptivecards/lib/card-elements.js'), 'utf8');
if (adaptiveCardElements.indexOf("require('../../../built/lib')") === -1) {
	throw new Error('patches/adaptivecards+1.1.0.patch is not applied to node_modules, run `npm run prepare`.');
}

// Each bundle assigns its entry's exports to a window global, see scripts/build/entries/toPlainExports.js.
function windowLibraryEntry(entryFile, globalName) {
	return {
		import: path.join(ROOT_DIR, 'scripts/build/entries', entryFile),
		library: { name: globalName, type: 'window' }
	};
}

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		mode: isProduction ? 'production' : 'development',
		context: ROOT_DIR,
		target: ['web', 'es5'],
		devtool: 'source-map',
		entry: {
			botchat: windowLibraryEntry('botchat.entry.js', 'BotChat'),
			'botchat-es5': windowLibraryEntry('botchat-es5.entry.js', 'BotChat'),
			CognitiveServices: windowLibraryEntry('CognitiveServices.entry.js', 'CognitiveServices')
		},
		output: {
			path: ROOT_DIR,
			filename: '[name].js',
			// No chunks or assets are loaded at runtime. An explicit publicPath keeps Rspack from adding
			// code that detects it from document.currentScript.
			publicPath: '',
			// The output directory is the repository root, it must never be cleaned.
			clean: false
		},
		resolve: {
			extensions: ['.ts', '.tsx', '.js', '.json'],
			// webpack 2 did not read package.json "exports". Ignoring it keeps every package resolving to the
			// same file, e.g. tslib to tslib.es6.js (ES5) instead of tslib.es6.mjs (ES2015).
			exportsFields: []
		},
		module: {
			rules: [
				// Includes the TypeScript sources of microsoft-speech-browser-sdk, which CognitiveServices.js bundles.
				{
					test: /\.ts$/,
					loader: 'builtin:swc-loader',
					options: getSwcOptions('file.ts'),
					type: 'javascript/auto'
				},
				{
					test: /\.tsx$/,
					loader: 'builtin:swc-loader',
					options: getSwcOptions('file.tsx'),
					type: 'javascript/auto'
				},
				// Customer pages use window.AdaptiveCards. `override` keeps the behaviour of expose-loader 0.7,
				// which always assigned it.
				{
					test: require.resolve('adaptivecards'),
					loader: 'expose-loader',
					options: { exposes: { globalName: 'AdaptiveCards', override: true } }
				}
			]
		},
		// webpack 2 provided these Node.js globals to browser bundles automatically, at these package versions.
		node: {
			global: true,
			__filename: 'mock',
			__dirname: 'mock'
		},
		plugins: [
			new rspack.ProvidePlugin({
				process: 'process/browser.js',
				setImmediate: ['timers-browserify', 'setImmediate'],
				clearImmediate: ['timers-browserify', 'clearImmediate']
			}),
			// The webpack 2 production build replaced the whole `process.env` object, so other variables
			// read from it are undefined. Development builds read `process.env` from the process polyfill.
			isProduction &&
				new rspack.DefinePlugin({
					'process.env': { NODE_ENV: JSON.stringify('production') }
				})
		].filter(Boolean),
		optimization: {
			nodeEnv: false,
			minimizer: [
				new rspack.SwcJsMinimizerRspackPlugin({
					minimizerOptions: { ecma: 5 }
				})
			]
		},
		performance: false
	};
};
