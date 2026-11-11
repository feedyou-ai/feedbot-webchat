import { describe, expect, it } from 'vitest';
import { getAutosuggestUrl, getKbRatingUrl } from './botEndpoints';

describe('getKbRatingUrl', () => {
    it('guesses the web app host from bot.id without a hosting origin', () => {
        expect(getKbRatingUrl(undefined, 'feedbot-foo', undefined, 'p1', 'q1'))
            .toBe('https://feedbot-foo-app.azurewebsites.net/api/messages/kb/KB/queries/p1/q1/rating');
        expect(getKbRatingUrl(undefined, 'feedbot-foo-app', 'M1', 'p1', 'q1'))
            .toBe('https://feedbot-foo-app.azurewebsites.net/api/messages/kb/M1/queries/p1/q1/rating');
    });

    it('treats an empty hosting origin as missing', () => {
        expect(getKbRatingUrl('', 'feedbot-foo', undefined, 'p1', 'q1'))
            .toBe('https://feedbot-foo-app.azurewebsites.net/api/messages/kb/KB/queries/p1/q1/rating');
    });

    it('uses the hosting origin instead of bot.id', () => {
        expect(getKbRatingUrl('https://feedbot-foo-app.azurewebsites.net', 'feedbot-foo-bot', undefined, 'p1', 'q1'))
            .toBe('https://feedbot-foo-app.azurewebsites.net/api/messages/kb/KB/queries/p1/q1/rating');
    });
});

describe('getAutosuggestUrl', () => {
    it('guesses the host from bot.id without a hosting origin', () => {
        expect(getAutosuggestUrl(undefined, 'feedbot-foo', 'repository', 'abc', 'src1'))
            .toBe('https://feedbot-foo.azurewebsites.net/webchat/repository/abc/src1');
    });

    it('treats an empty hosting origin as missing', () => {
        expect(getAutosuggestUrl('', 'feedbot-foo', 'repository', 'abc', 'src1'))
            .toBe('https://feedbot-foo.azurewebsites.net/webchat/repository/abc/src1');
    });

    it('uses the hosting origin without its trailing slash', () => {
        expect(getAutosuggestUrl('http://feedbot-2.azure-webapp.localhost:8080/', 'x', 'google-places-city', 'Prague', 'CZ'))
            .toBe('http://feedbot-2.azure-webapp.localhost:8080/webchat/google-places-city/Prague/CZ');
    });
});
