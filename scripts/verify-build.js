// Checks the build output in the repository root (npm run verify:build, also run by the Azure pipeline):
// - the published files exist,
// - the bundles contain only ES5 syntax, except in the allowlisted packages below,
// - the bundles define their window globals when loaded into a page (jsdom).
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { TraceMap, originalPositionFor } = require('@jridgewell/trace-mapping');
const { loadBundle } = require('./compare-build/describeGlobals');

const ROOT_DIR = path.resolve(__dirname, '..');

const EXPECTED_FILES = [
	'botchat.js',
	'botchat.js.map',
	'botchat-es5.js',
	'botchat-es5.js.map',
	'CognitiveServices.js',
	'CognitiveServices.js.map',
	'botchat.css',
	'botchat-fullwindow.css',
	'botchat-redesign.css',
	'built/BotChat.js',
	'built/lib.js'
];

// These packages ship ES2015+ code that was already bundled untranspiled before the Rspack migration.
// Transpiling them is a separate task; until then no other package may add non-ES5 syntax.
const ES5_ALLOWLIST = ['node_modules/sweetalert2/', 'node_modules/compute-scroll-into-view/'];

const BUNDLE_GLOBALS = {
	'botchat.js': [['BotChat', 'App', 'function'], ['AdaptiveCards', 'AdaptiveCard', 'function']],
	'botchat-es5.js': [['BotChat', 'App', 'function'], ['AdaptiveCards', 'AdaptiveCard', 'function']],
	'CognitiveServices.js': [['CognitiveServices', 'SpeechRecognizer', 'function']]
};

// Syntax that ES5 does not have, by acorn node type.
function describeNonEs5Node(node) {
	switch (node.type) {
		case 'VariableDeclaration':
			return node.kind !== 'var' ? node.kind : null;
		case 'FunctionDeclaration':
		case 'FunctionExpression':
			return node.async ? 'async function' : node.generator ? 'generator' : null;
		case 'Property':
			return node.shorthand ? 'shorthand property' : node.computed ? 'computed property' : node.method ? 'method' : null;
		case 'Literal':
			if (node.regex && /[uys]/.test(node.regex.flags)) return 'regex flag';
			return typeof node.bigint === 'string' ? 'bigint' : null;
		case 'BinaryExpression':
		case 'AssignmentExpression':
			return /\*\*|&&=|\|\|=|\?\?=/.test(node.operator) ? node.operator : null;
		case 'LogicalExpression':
			return node.operator === '??' ? '??' : null;
		default:
			return NON_ES5_NODE_TYPES.has(node.type) ? node.type : null;
	}
}

const NON_ES5_NODE_TYPES = new Set([
	'ArrowFunctionExpression',
	'ClassDeclaration',
	'ClassExpression',
	'TemplateLiteral',
	'TaggedTemplateExpression',
	'SpreadElement',
	'RestElement',
	'ObjectPattern',
	'ArrayPattern',
	'AssignmentPattern',
	'ForOfStatement',
	'AwaitExpression',
	'YieldExpression',
	'MetaProperty',
	'ChainExpression',
	'ImportExpression',
	'ImportDeclaration',
	'ExportNamedDeclaration',
	'ExportDefaultDeclaration',
	'ExportAllDeclaration'
]);

function findNonEs5Syntax(bundle) {
	const code = fs.readFileSync(path.join(ROOT_DIR, bundle), 'utf8');
	const traceMap = new TraceMap(fs.readFileSync(path.join(ROOT_DIR, bundle + '.map'), 'utf8'));
	const ast = acorn.parse(code, { ecmaVersion: 'latest', locations: true });
	const findings = [];
	walk.full(ast, node => {
		const syntax = describeNonEs5Node(node);
		if (syntax) {
			const position = originalPositionFor(traceMap, node.loc.start);
			findings.push({ syntax, source: position.source || '(no source)', line: position.line });
		}
	});
	return findings;
}

function checkFiles() {
	return EXPECTED_FILES.filter(file => {
		const filePath = path.join(ROOT_DIR, file);
		return !fs.existsSync(filePath) || fs.statSync(filePath).size === 0;
	}).map(file => `${file} is missing or empty`);
}

function checkEs5(bundle) {
	const disallowed = findNonEs5Syntax(bundle).filter(
		finding => !ES5_ALLOWLIST.some(allowed => finding.source.indexOf(allowed) !== -1)
	);
	const bySource = {};
	disallowed.forEach(finding => {
		const key = `${finding.source}: ${finding.syntax}`;
		bySource[key] = (bySource[key] || 0) + 1;
	});
	return Object.keys(bySource).map(key => `${bundle} has non-ES5 syntax from ${key} (${bySource[key]}x)`);
}

function checkGlobals(bundle) {
	const { window, errors } = loadBundle(path.join(ROOT_DIR, bundle));
	const problems = errors.map(error => `${bundle} threw while loading: ${error}`);
	BUNDLE_GLOBALS[bundle].forEach(([globalName, property, type]) => {
		const value = window[globalName];
		if (!value || typeof value[property] !== type) {
			problems.push(`${bundle} does not define window.${globalName}.${property} as a ${type}`);
		}
	});
	window.close();
	return problems;
}

let problems = checkFiles();
if (problems.length === 0) {
	Object.keys(BUNDLE_GLOBALS).forEach(bundle => {
		problems = problems.concat(checkEs5(bundle), checkGlobals(bundle));
	});
}

if (problems.length) {
	problems.forEach(problem => console.error(`✗ ${problem}`));
	process.exit(1);
}
console.log(`✓ Build output verified: ${EXPECTED_FILES.length} files, ES5 syntax, window globals.`);
