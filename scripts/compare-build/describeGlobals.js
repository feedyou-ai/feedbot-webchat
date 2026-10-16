// Loads a bundle into jsdom and describes the window globals it adds: their names, value types and
// property descriptors, two levels deep. Used by verify-build.js and compare-build/exports.js.
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

function loadBundle(bundlePath) {
	const virtualConsole = new VirtualConsole();
	const errors = [];
	virtualConsole.on('jsdomError', error => errors.push(error.message));
	const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
		url: 'https://customer.example/',
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		virtualConsole
	});
	const window = dom.window;
	const globalsBefore = new Set(Object.getOwnPropertyNames(window));
	window.eval(fs.readFileSync(bundlePath, 'utf8'));
	const addedGlobals = Object.getOwnPropertyNames(window).filter(name => !globalsBefore.has(name));
	return { window, addedGlobals, errors };
}

function describeValue(value) {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	return typeof value;
}

function describeProperties(object, depth) {
	const result = {};
	Object.getOwnPropertyNames(object)
		.sort()
		.forEach(name => {
			const descriptor = Object.getOwnPropertyDescriptor(object, name);
			const flags = ['enumerable', 'configurable', 'writable'].filter(flag => descriptor[flag]).join(',');
			const kind = 'value' in descriptor ? describeValue(descriptor.value) : 'accessor';
			const entry = { kind, flags };
			const value = descriptor.value;
			if (depth > 1 && value && (kind === 'object' || kind === 'function') && name !== 'prototype') {
				entry.properties = describeProperties(value, depth - 1);
			}
			result[name] = entry;
		});
	return result;
}

function describeGlobals(bundlePath) {
	const { window, addedGlobals, errors } = loadBundle(bundlePath);
	const globals = {};
	addedGlobals.sort().forEach(name => {
		const descriptor = Object.getOwnPropertyDescriptor(window, name);
		const value = descriptor.value;
		globals[name] = {
			kind: 'value' in descriptor ? describeValue(value) : 'accessor',
			properties: value && typeof value === 'object' ? describeProperties(value, 2) : undefined
		};
	});
	window.close();
	return { globals, errors };
}

module.exports = { describeGlobals, loadBundle };
