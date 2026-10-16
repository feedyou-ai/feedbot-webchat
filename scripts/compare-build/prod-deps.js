// Compares the production dependency trees (`npm ls --omit=dev --all`) of two installs as sets of
// name@version. The Rspack migration removed uglifyjs-webpack-plugin from the runtime dependencies and
// added @swc/helpers, so their subtrees are left out; everything else must be the same.
//   node scripts/compare-build/prod-deps.js <baseline dir> <new dir>
const childProcess = require('child_process');

const REMOVED_DEPENDENCY = 'uglifyjs-webpack-plugin';
const ADDED_DEPENDENCY = '@swc/helpers';

function listProductionPackages(dir, excludedDependency) {
	const output = childProcess.execSync('npm ls --omit=dev --all --json', {
		cwd: dir,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'ignore']
	});
	const tree = JSON.parse(output);
	const packages = new Set();
	(function walk(node, isRoot) {
		Object.keys(node.dependencies || {}).forEach(name => {
			const dependency = node.dependencies[name];
			if (isRoot && name === excludedDependency) {
				return;
			}
			if (dependency.version) {
				packages.add(`${name}@${dependency.version}`);
			}
			walk(dependency, false);
		});
	})(tree, true);
	return packages;
}

const [baselineDir, newDir] = process.argv.slice(2);
if (!baselineDir || !newDir) {
	console.error('Usage: node scripts/compare-build/prod-deps.js <baseline dir> <new dir>');
	process.exit(2);
}
const baselinePackages = listProductionPackages(baselineDir, REMOVED_DEPENDENCY);
const newPackages = listProductionPackages(newDir, ADDED_DEPENDENCY);
const removed = [...baselinePackages].filter(name => !newPackages.has(name)).sort();
const added = [...newPackages].filter(name => !baselinePackages.has(name)).sort();
removed.forEach(name => console.error(`  - ${name}`));
added.forEach(name => console.error(`  + ${name}`));
if (removed.length || added.length) {
	console.error(`✗ Production dependencies differ (besides ${REMOVED_DEPENDENCY} and ${ADDED_DEPENDENCY})`);
	process.exit(1);
}
console.log(`✓ ${newPackages.size} production packages, same as before (besides ${REMOVED_DEPENDENCY} and ${ADDED_DEPENDENCY})`);
