// Serves the test channels from test_channels.js together with the current build output.
// It does not build anything: run the build first (see .agents/skills/webchat-dev).
const fs = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');
const { createChannelRoutes } = require('./channelRoutes');
const { loadTestChannels } = require('./loadTestChannels');
const { channelHref } = require('./pages');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 1234;
const BASE_URL = 'http://localhost:' + PORT;

const BUILD_FILES = {
	'/botchat-es5.js': 'application/javascript; charset=utf-8',
	'/botchat-es5.js.map': 'application/json; charset=utf-8',
	'/botchat.js': 'application/javascript; charset=utf-8',
	'/botchat.js.map': 'application/json; charset=utf-8',
	'/CognitiveServices.js': 'application/javascript; charset=utf-8',
	'/CognitiveServices.js.map': 'application/json; charset=utf-8',
	'/botchat.css': 'text/css; charset=utf-8',
	'/botchat-fullwindow.css': 'text/css; charset=utf-8',
	'/botchat-redesign.css': 'text/css; charset=utf-8'
};

const handleChannelRoutes = createChannelRoutes({ getWarnings: getStaleBuildWarnings });

const server = http.createServer((req, res) => {
	const pathname = url.parse(req.url).pathname;
	if (BUILD_FILES.hasOwnProperty(pathname)) {
		serveBuildFile(pathname, req, res);
	} else {
		handleChannelRoutes(req, res);
	}
});

server.on('error', error => {
	if (error.code === 'EADDRINUSE') {
		console.error(
			`Port ${PORT} is already in use, probably by a running dev server (${BASE_URL}/).` +
				' Reuse it, or set PORT to start another one.'
		);
	} else {
		console.error(error);
	}
	process.exit(1);
});

server.listen(PORT, HOST, () => {
	console.log(`Webchat test channels: ${BASE_URL}/`);
	try {
		loadTestChannels().forEach(bot => {
			bot.channelIds.forEach(channelId => {
				console.log(`  ${BASE_URL}${channelHref(bot, channelId)}`);
			});
		});
	} catch (error) {
		console.error(error.message);
	}
	getStaleBuildWarnings().forEach(warning => console.warn(`Warning: ${warning}`));
});

function serveBuildFile(pathname, req, res) {
	const filePath = path.join(ROOT_DIR, pathname);
	fs.stat(filePath, (error, stats) => {
		if (error || !stats.isFile()) {
			res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
			res.end(`${pathname.slice(1)} not found, run the build first (see .agents/skills/webchat-dev)\n`);
			return;
		}
		res.writeHead(200, {
			'Content-Type': BUILD_FILES[pathname],
			'Content-Length': stats.size,
			'Cache-Control': 'no-store'
		});
		if (req.method === 'HEAD') {
			res.end();
		} else {
			fs.createReadStream(filePath).pipe(res);
		}
	});
}

function getStaleBuildWarnings() {
	const scssDir = path.join(SRC_DIR, 'scss');
	return [
		getStaleWarning('botchat-es5.js', newestModification(SRC_DIR, scssDir)),
		getStaleWarning('botchat.css', newestModification(scssDir))
	].filter(Boolean);
}

function getStaleWarning(buildFile, newestSource) {
	const buildPath = path.join(ROOT_DIR, buildFile);
	if (!fs.existsSync(buildPath)) {
		return `${buildFile} is missing, run the build first.`;
	}
	const builtAt = fs.statSync(buildPath).mtime;
	if (newestSource && newestSource.mtime > builtAt) {
		return (
			`${buildFile} (built ${builtAt.toLocaleString()}) is older than ` +
			`${path.relative(ROOT_DIR, newestSource.file)} (changed ${newestSource.mtime.toLocaleString()}).`
		);
	}
	return null;
}

function newestModification(dir, excludedDir) {
	let newest = null;
	fs.readdirSync(dir).forEach(name => {
		const entryPath = path.join(dir, name);
		if (entryPath === excludedDir) {
			return;
		}
		const stats = fs.statSync(entryPath);
		const candidate = stats.isDirectory()
			? newestModification(entryPath, excludedDir)
			: { file: entryPath, mtime: stats.mtime };
		if (candidate && (!newest || candidate.mtime > newest.mtime)) {
			newest = candidate;
		}
	});
	return newest;
}
