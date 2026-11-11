// URLs of the endpoints served by the bot web app. Hosts that know its origin (Feedbot Designer) pass it
// as hostingOrigin. Without it (website embeds), the historical host guesses from bot.id are kept exactly.

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, '');

const legacyRatingOrigin = (botId: string) => 'https://' + botId.replace(/\-app$/, '') + '-app.azurewebsites.net';
const legacyAutosuggestOrigin = (botId: string) => 'https://' + botId + '.azurewebsites.net';

export function getKbRatingUrl(
    hostingOrigin: string | undefined,
    botId: string,
    modelId: string | undefined,
    queryPartition: string,
    queryId: string
): string {
    const origin = hostingOrigin ? trimTrailingSlashes(hostingOrigin) : legacyRatingOrigin(botId);
    return origin + '/api/messages/kb/' + (modelId || 'KB') + '/queries/' + queryPartition + '/' + queryId + '/rating';
}

export function getAutosuggestUrl(
    hostingOrigin: string | undefined,
    botId: string,
    action: string,
    queryString: string,
    param: string
): string {
    const origin = hostingOrigin ? trimTrailingSlashes(hostingOrigin) : legacyAutosuggestOrigin(botId);
    return origin + '/webchat/' + action + '/' + queryString + '/' + param;
}
