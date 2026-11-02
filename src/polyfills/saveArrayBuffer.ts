// Backup of the browser ArrayBuffer, taken before the polyfills in BotChatWithPolyfill.ts are loaded.
// It is a module of its own so that it runs before them, see BotChatWithPolyfill.ts.
export const browserArrayBuffer = global.ArrayBuffer
