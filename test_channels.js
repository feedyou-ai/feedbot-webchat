// Bots and channels served by `npm run dev` (see .agents/skills/webchat-dev).
// Each entry can be replaced by a bot object copied from the Designer dev tools.
// `hostingId` is passed to BotChat.App as `bot.id`.
module.exports = [
	{
		botId: 'kristina-webapp-nahrada',
		hostingId: 'feedbot-master-kristina-webapp-nahrada-app',
		channelIds: ['somtejec', 'ov3lrg', 'uvrlsdcp']
	},
	{
		botId: 'webapp',
		hostingId: 'feedbot-webapp-app',
		channelIds: ['7yqkmz', 'gmqgsfch']
	}
];
