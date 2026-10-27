// Compiles the `src/BotChat.ts` module graph to `built/` (the package `main`, used by the Designer).
// The file set is the one `tsc` compiles for tsconfig.json, so it matches what `tsc` emitted before
// the Rspack migration. The bundles need `built/lib.js` too: patches/adaptivecards+1.1.0.patch requires it.
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const swc = require('@swc/core');
const { getSwcOptions } = require('./swcOptions');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const OUT_DIR = path.join(ROOT_DIR, 'built');

function listSourceFiles() {
	const output = childProcess.execFileSync(
		process.execPath,
		[require.resolve('typescript/bin/tsc'), '-p', ROOT_DIR, '--listFilesOnly'],
		{ cwd: ROOT_DIR, encoding: 'utf8' }
	);
	return output
		.split(/\r?\n/)
		.map(file => path.resolve(ROOT_DIR, file.trim()))
		.filter(file => file.startsWith(SRC_DIR + path.sep) && !file.endsWith('.d.ts'));
}

function compile(sourceFile) {
	const relativePath = path.relative(SRC_DIR, sourceFile);
	const outFile = path.join(OUT_DIR, relativePath.replace(/\.(tsx?|js)$/, '.js'));
	const mapFile = outFile + '.map';
	const result = swc.transformFileSync(sourceFile, {
		...getSwcOptions(sourceFile),
		filename: sourceFile,
		sourceFileName: path.relative(path.dirname(outFile), sourceFile).split(path.sep).join('/'),
		outputPath: outFile,
		inlineSourcesContent: true
	});
	fs.mkdirSync(path.dirname(outFile), { recursive: true });
	fs.writeFileSync(outFile, `${result.code.replace(/\s+$/, '')}\n//# sourceMappingURL=${path.basename(mapFile)}`);
	fs.writeFileSync(mapFile, result.map);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
const sourceFiles = listSourceFiles();
sourceFiles.forEach(compile);
console.log(`Compiled ${sourceFiles.length} files to ${path.relative(ROOT_DIR, OUT_DIR)}/`);
