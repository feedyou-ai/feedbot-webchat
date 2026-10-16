const url = require('url');
const { loadTestChannels } = require('./loadTestChannels');
const pages = require('./pages');

// Terminal request handler for the test channel pages:
//   /                      all bots and their channels
//   /{botId}               channels of one bot
//   /{botId}/{channelId}   chat page embedding the webchat like a customer site
// Anything else gets a 404 listing the valid routes. Bundles and CSS are served elsewhere.
// `getWarnings` optionally returns messages shown on the listing pages.
function createChannelRoutes(options) {
	const getWarnings = (options && options.getWarnings) || (() => []);

	return function handleChannelRoutes(req, res) {
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
			res.end('Method not allowed\n');
			return;
		}

		const parsedUrl = url.parse(req.url);
		const pathname = parsedUrl.pathname || '/';
		if (pathname === '/favicon.ico') {
			// Keeps the browser's favicon request from adding a console error to every test page.
			res.writeHead(204);
			res.end();
			return;
		}
		const segments = pathname.split('/').filter(Boolean);
		if (pathname.length > 1 && pathname.endsWith('/')) {
			// Rebuilt from segments, so "//host/" cannot become a redirect to another host.
			res.writeHead(301, { Location: '/' + segments.join('/') + (parsedUrl.search || '') });
			res.end();
			return;
		}

		let bots;
		try {
			bots = loadTestChannels();
		} catch (error) {
			sendHtml(req, res, 500, pages.renderErrorPage(error));
			return;
		}

		const bot = segments.length > 0 && bots.find(candidate => candidate.botId === segments[0]);

		if (segments.length === 0) {
			sendHtml(req, res, 200, pages.renderIndexPage(bots, getWarnings()));
		} else if (bot && segments.length === 1) {
			sendHtml(req, res, 200, pages.renderBotPage(bot, getWarnings()));
		} else if (bot && segments.length === 2 && bot.channelIds.indexOf(segments[1]) !== -1) {
			sendHtml(req, res, 200, pages.renderChatPage(bot, segments[1]));
		} else {
			sendHtml(req, res, 404, pages.renderNotFoundPage(pathname, bots));
		}
	};
}

function sendHtml(req, res, statusCode, html) {
	res.writeHead(statusCode, {
		'Content-Type': 'text/html; charset=utf-8',
		'Cache-Control': 'no-store'
	});
	res.end(req.method === 'HEAD' ? undefined : html);
}

module.exports = { createChannelRoutes };
