export * from './BotChat';

// backup browser ArrayBuffer in case it gets overwritten by a polyfill - see below
const browserArrayBuffer = global.ArrayBuffer

// below are shims for compatibility with old browsers (IE 10 being the main culprit)
import 'core-js'
import 'core-js/modules/es6.string.starts-with';
import 'core-js/modules/es6.array.find';
import 'core-js/modules/es6.array.find-index';
import 'isomorphic-fetch';

// fix https://github.com/zloirock/core-js/issues/273 by using browser ArrayBuffer when available - https://feedyou.bitrix24.eu/company/personal/user/1/tasks/task/view/31031/
if (typeof browserArrayBuffer !== 'undefined') {
  global.ArrayBuffer = browserArrayBuffer
}

// Polyfill Promise if needed
if (typeof (window as any).Promise === 'undefined') {
  (window as any).Promise = require('bluebird');
}
