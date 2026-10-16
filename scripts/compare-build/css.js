// Compares the compiled CSS of two builds after normalizing what node-sass and dart-sass print differently
// for the same CSS: whitespace, comments, number formatting (rounded to 5 decimals), color notation, string
// quotes and attribute selector quotes.
//   node scripts/compare-build/css.js <baseline dir> <new dir>
const fs = require('fs');
const path = require('path');

const CSS_FILES = ['botchat.css', 'botchat-fullwindow.css', 'botchat-redesign.css'];

function toHex(channel) {
	return Number(channel).toString(16).padStart(2, '0');
}

// Splits CSS into quoted strings and the code between them, so that strings are left as they are.
function splitStrings(css) {
	const parts = [];
	let code = '';
	for (let i = 0; i < css.length; i++) {
		const char = css[i];
		if (char !== '"' && char !== "'") {
			code += char;
			continue;
		}
		let end = i + 1;
		while (end < css.length && css[end] !== char) {
			end += css[end] === '\\' ? 2 : 1;
		}
		parts.push({ code }, { string: css.slice(i + 1, end) });
		code = '';
		i = end;
	}
	parts.push({ code });
	return parts;
}

function normalizeCode(code) {
	return (
		code
			.replace(/\s+/g, ' ')
			.replace(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/g, (match, r, g, b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`)
			.replace(/#([0-9a-fA-F]{3})\b/g, (match, hex) => '#' + hex.replace(/./g, digit => digit + digit))
			.replace(/#[0-9a-fA-F]{6}\b/g, hex => hex.toLowerCase())
			.replace(/(^|[^\w.#-])(-?)(\d*\.\d+|\d+)(?![\w.]*[a-fA-F]{2,}\d)/g, (match, before, sign, number) => {
				const rounded = String(Number(Number(number).toFixed(5)));
				return before + (rounded === '0' ? '' : sign) + rounded;
			})
			.replace(/\s*([{};:,>=\[\]])\s*/g, '$1')
			.replace(/;}/g, '}')
	);
}

function normalizeCss(css) {
	const normalized = splitStrings(css.replace(/\/\*[\s\S]*?\*\//g, ''))
		.map(part => {
			if ('code' in part) {
				return normalizeCode(part.code);
			}
			// 'a' and "a" are the same string.
			return part.string.indexOf('"') === -1 ? `"${part.string}"` : `'${part.string}'`;
		})
		.join('')
		// Attribute selectors: [type=text] and [type="text"] are the same.
		.replace(/\[([\w-]+)([~|^$*]?=)([\w-]+)\]/g, '[$1$2"$3"]');
	return normalized
		.trim()
		.split('}')
		.map(rule => rule.trim())
		.filter(Boolean);
}

function compareCss(baselineDir, newDir) {
	return CSS_FILES.map(file => {
		const baselineRules = normalizeCss(fs.readFileSync(path.join(baselineDir, file), 'utf8'));
		const newRules = normalizeCss(fs.readFileSync(path.join(newDir, file), 'utf8'));
		const differences = [];
		const length = Math.max(baselineRules.length, newRules.length);
		for (let i = 0; i < length; i++) {
			if (baselineRules[i] !== newRules[i]) {
				differences.push({ index: i, baseline: baselineRules[i], new: newRules[i] });
			}
		}
		return { file, rules: baselineRules.length, differences };
	});
}

if (require.main === module) {
	const [baselineDir, newDir] = process.argv.slice(2);
	if (!baselineDir || !newDir) {
		console.error('Usage: node scripts/compare-build/css.js <baseline dir> <new dir>');
		process.exit(2);
	}
	let failed = false;
	compareCss(baselineDir, newDir).forEach(result => {
		if (result.differences.length === 0) {
			console.log(`✓ ${result.file}: ${result.rules} rules, identical after normalization`);
			return;
		}
		failed = true;
		console.error(`✗ ${result.file}: ${result.differences.length} rules differ`);
		result.differences.slice(0, 10).forEach(difference => {
			console.error(`  rule ${difference.index}:\n    - ${difference.baseline}\n    + ${difference.new}`);
		});
	});
	process.exit(failed ? 1 : 0);
}

module.exports = { compareCss, normalizeCss };
