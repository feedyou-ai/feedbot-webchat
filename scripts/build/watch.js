// `npm run watch`: rebuilds everything `npm run build` builds whenever a source changes, until stopped (Ctrl+C):
// built/ (build-lib.js), the type check, the CSS and the development bundles.
const childProcess = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SASS_ARGS = ['--no-source-map', '--style=expanded', '--silence-deprecation=import'];
const CSS_FILES = ['botchat', 'botchat-fullwindow', 'botchat-redesign'];
// The command line scripts of these packages are not in their package.json "exports".
const bin = file => path.join(ROOT_DIR, 'node_modules', file);

const watchers = {
	lib: [path.join(__dirname, 'build-lib.js'), '--watch'],
	tsc: [bin('typescript/bin/tsc'), '-p', ROOT_DIR, '--watch', '--preserveWatchOutput'],
	// The files are listed one by one: compiling the src/scss/ directory would also compile src/scss/includes/.
	css: [bin('sass/sass.js'), '--watch', ...SASS_ARGS, ...CSS_FILES.map(name => `src/scss/${name}.scss:${name}.css`)],
	rspack: [bin('@rspack/cli/bin/rspack.js'), 'build', '--mode', 'development', '--watch']
};

function prefixLines(name, stream, output) {
	let rest = '';
	stream.on('data', data => {
		const lines = (rest + data).split('\n');
		rest = lines.pop();
		lines.forEach(line => output.write(`[${name}] ${line}\n`));
	});
}

// The bundles include built/lib.js (see patches/adaptivecards+1.1.0.patch), so it is built before the bundler starts.
childProcess.execFileSync(process.execPath, [path.join(__dirname, 'build-lib.js')], { cwd: ROOT_DIR, stdio: 'inherit' });

const children = Object.keys(watchers).map(name => {
	const child = childProcess.spawn(process.execPath, watchers[name], { cwd: ROOT_DIR });
	prefixLines(name, child.stdout, process.stdout);
	prefixLines(name, child.stderr, process.stderr);
	child.on('exit', code => {
		console.error(`[${name}] exited with code ${code}, stopping`);
		stop(code || 1);
	});
	return child;
});

function stop(code) {
	children.forEach(child => child.exitCode === null && child.kill());
	process.exit(code);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
