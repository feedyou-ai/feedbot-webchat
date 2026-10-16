const path = require('path');

const TEST_CHANNELS_PATH = path.resolve(__dirname, '../../test_channels.js');
const URL_SAFE_ID = /^[A-Za-z0-9_-]+$/;

// Re-reads test_channels.js on every call, so edits apply without a restart.
function loadTestChannels() {
	delete require.cache[TEST_CHANNELS_PATH];
	const bots = require(TEST_CHANNELS_PATH);
	const errors = validateBots(bots);
	if (errors.length > 0) {
		throw new Error('Invalid test_channels.js:\n- ' + errors.join('\n- '));
	}
	return bots;
}

function validateBots(bots) {
	if (!Array.isArray(bots)) {
		return ['module.exports must be an array of { botId, hostingId, channelIds }'];
	}

	const errors = [];
	const seenBotIds = {};
	bots.forEach((bot, index) => {
		const label = 'bot #' + index + (bot && bot.botId ? ' (' + bot.botId + ')' : '');
		if (!bot || typeof bot !== 'object') {
			errors.push(label + ' must be an object');
			return;
		}
		if (!isUrlSafeId(bot.botId)) {
			errors.push(label + ': botId must be a non-empty string of letters, digits, "-" or "_"');
		} else if (seenBotIds[bot.botId]) {
			errors.push(label + ': duplicate botId');
		} else {
			seenBotIds[bot.botId] = true;
		}
		if (!isUrlSafeId(bot.hostingId)) {
			errors.push(label + ': hostingId must be a non-empty string of letters, digits, "-" or "_"');
		}
		if (!Array.isArray(bot.channelIds) || bot.channelIds.length === 0) {
			errors.push(label + ': channelIds must be a non-empty array');
		} else {
			bot.channelIds.forEach(channelId => {
				if (!isUrlSafeId(channelId)) {
					errors.push(label + ': invalid channelId ' + JSON.stringify(channelId));
				}
			});
		}
	});
	return errors;
}

function isUrlSafeId(value) {
	return typeof value === 'string' && URL_SAFE_ID.test(value);
}

module.exports = { loadTestChannels, TEST_CHANNELS_PATH };
