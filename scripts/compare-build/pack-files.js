// Compares the files `npm pack` would publish from two builds.
//   node scripts/compare-build/pack-files.js <baseline dir> <new dir>
const childProcess = require('child_process');

function listPackFiles(dir) {
	const output = childProcess.execSync('npm pack --dry-run --json --ignore-scripts', {
		cwd: dir,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore']
	});
	// Lifecycle output can precede the JSON.
	const json = JSON.parse(output.slice(output.search(/^\[/m)));
	return json[0].files.map(file => file.path).sort();
}

const [baselineDir, newDir] = process.argv.slice(2);
if (!baselineDir || !newDir) {
	console.error('Usage: node scripts/compare-build/pack-files.js <baseline dir> <new dir>');
	process.exit(2);
}
const baselineFiles = listPackFiles(baselineDir);
const newFiles = listPackFiles(newDir);
const removed = baselineFiles.filter(file => newFiles.indexOf(file) === -1);
const added = newFiles.filter(file => baselineFiles.indexOf(file) === -1);
removed.forEach(file => console.error(`  - ${file}`));
added.forEach(file => console.error(`  + ${file}`));
if (removed.length || added.length) {
	console.error('✗ The published file lists differ');
	process.exit(1);
}
console.log(`✓ ${newFiles.length} published files, same as before`);
