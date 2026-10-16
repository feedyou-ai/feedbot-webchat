// SWC options shared by the Rspack bundles and the `built/` output, so both compile the sources the same way.
// They reproduce what TypeScript 2.3 emitted before the Rspack migration:
// - CommonJS modules without interop wrappers (`noInterop`), like `tsc` with `module: commonjs`.
// - ES5 syntax in loose mode, with helpers imported from `@swc/helpers` (like `importHelpers` with tslib).
// - Classic React JSX (`React.createElement`).
// One difference remains: SWC hoists `import` statements to the top of the module, as ES modules require,
// while TypeScript 2.3 kept them in place. See src/BotChatWithPolyfill.ts for the one place where it matters.
const path = require('path');

function getSwcOptions(filename) {
	const extension = path.extname(filename);
	const parser =
		extension === '.ts' || extension === '.tsx'
			? { syntax: 'typescript', tsx: extension === '.tsx' }
			: { syntax: 'ecmascript', jsx: false };

	return {
		jsc: {
			parser,
			target: 'es5',
			loose: true,
			externalHelpers: true,
			transform: {
				react: { runtime: 'classic', pragma: 'React.createElement', pragmaFrag: 'React.Fragment' }
			}
		},
		module: { type: 'commonjs', noInterop: true },
		sourceMaps: true
	};
}

module.exports = { getSwcOptions };
