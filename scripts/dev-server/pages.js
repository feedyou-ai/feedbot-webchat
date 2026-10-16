const TEST_MODE_HASH = '#feedbot-test-mode';

function botUrl(bot) {
	return '/' + bot.botId;
}

function channelUrl(bot, channelId) {
	return '/' + bot.botId + '/' + channelId;
}

function channelHref(bot, channelId) {
	return channelUrl(bot, channelId) + TEST_MODE_HASH;
}

// Mirrors samples/feedyou/local.html. The embed code is the customer snippet verbatim,
// with only the bundle URLs and ids replaced. The test-mode hash is set by a separate
// script after the snippet, so the snippet's own <script> stays the first one on the page.
function renderChatPage(bot, channelId) {
	return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${escapeHtml(bot.botId + ' / ' + channelId)}</title>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
  </head>
  <body>
    <link href="/botchat.css" rel="stylesheet" />
    <script type="text/javascript">
      (function (f,y,b,o,t,s){(t = y.createElement(b)), (s = y.getElementsByTagName(b)[0]);t.async = 1;t.src = "/botchat-es5.js";t.onload=function(){BotChat.App({
        bot: { id: ${JSON.stringify(bot.hostingId)} },
        channel: { id: ${JSON.stringify(channelId)} }
      })};s.parentNode.insertBefore(t, s);})(window, document, "script");
    </script>
    <script type="text/javascript">
      if (window.location.hash !== ${JSON.stringify(TEST_MODE_HASH)}) {
        history.replaceState(null, '', ${JSON.stringify(TEST_MODE_HASH)});
      }
    </script>
  </body>
</html>
`;
}

function renderIndexPage(bots, warnings) {
	return renderListPage('Test channels', bots.map(renderBotSection).join('\n'), warnings);
}

function renderBotPage(bot, warnings) {
	return renderListPage(
		'Test channels: ' + bot.botId,
		'<p><a href="/">All bots</a></p>\n' + renderBotSection(bot),
		warnings
	);
}

function renderNotFoundPage(pathname, bots) {
	const routes = ['<li><a href="/">/</a></li>'];
	bots.forEach(bot => {
		routes.push(renderLink(botUrl(bot), botUrl(bot)));
		bot.channelIds.forEach(channelId => {
			routes.push(renderLink(channelHref(bot, channelId), channelUrl(bot, channelId)));
		});
	});
	return renderListPage(
		'Not found',
		`<p>No page at <code>${escapeHtml(pathname)}</code>. Valid routes:</p>\n<ul>\n${routes.join(
			'\n'
		)}\n</ul>`
	);
}

function renderErrorPage(error) {
	return renderListPage(
		'test_channels.js error',
		`<pre>${escapeHtml(error && error.stack ? error.stack : String(error))}</pre>`
	);
}

function renderBotSection(bot) {
	const links = bot.channelIds
		.map(channelId => renderLink(channelHref(bot, channelId), channelId))
		.join('\n');
	return `<section>
<h2><a href="${botUrl(bot)}">${escapeHtml(bot.botId)}</a></h2>
<p>hostingId: <code>${escapeHtml(bot.hostingId)}</code></p>
<ul>
${links}
</ul>
</section>`;
}

function renderLink(href, text) {
	return `<li><a href="${escapeHtml(href)}">${escapeHtml(text)}</a></li>`;
}

function renderListPage(title, body, warnings) {
	const warningHtml = (warnings || [])
		.map(warning => `<p class="warning">${escapeHtml(warning)}</p>`)
		.join('\n');
	return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; }
.warning { background: #fff3cd; border: 1px solid #e0c46c; padding: 0.5rem 1rem; }
pre { white-space: pre-wrap; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${warningHtml}
${body}
</body>
</html>
`;
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

module.exports = {
	renderChatPage,
	renderIndexPage,
	renderBotPage,
	renderNotFoundPage,
	renderErrorPage,
	channelHref
};
