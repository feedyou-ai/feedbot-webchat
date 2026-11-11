import { browserArrayBuffer } from './saveArrayBuffer'

// Runs after the polyfills in BotChatWithPolyfill.ts. It is a module of its own so that it runs after them,
// see BotChatWithPolyfill.ts.
// fix https://github.com/zloirock/core-js/issues/273 by using browser ArrayBuffer when available - https://feedyou.bitrix24.eu/company/personal/user/1/tasks/task/view/31031/
if (typeof browserArrayBuffer !== 'undefined') {
  global.ArrayBuffer = browserArrayBuffer
}
