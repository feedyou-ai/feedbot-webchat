// The bundles assign their entry module's exports to `window.BotChat` / `window.CognitiveServices`.
// SWC compiles re-exports (`export { App } from './App'`, `export * from ...`) to getters, while
// TypeScript 2.3 assigned plain values. Customer pages can read and overwrite these properties, so the
// bundle entries copy the exports to a plain object shaped like the TypeScript 2.3 `exports` object:
// a non-enumerable `__esModule` flag and a writable, enumerable data property for each export.
module.exports = function toPlainExports(moduleExports) {
	var plainExports = {};
	Object.defineProperty(plainExports, '__esModule', { value: true });
	for (var name in moduleExports) {
		plainExports[name] = moduleExports[name];
	}
	return plainExports;
};
