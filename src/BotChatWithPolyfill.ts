export * from './BotChat';

// The statements below must run in this order: back up the browser ArrayBuffer, load the polyfills, restore it.
// SWC hoists all imports above the other statements of a module (TypeScript 2.3 kept them in place),
// so the backup and the restore are imports of their own modules, which run in the order they are listed.

// backup browser ArrayBuffer in case it gets overwritten by a polyfill - see ./polyfills/restoreArrayBuffer
import './polyfills/saveArrayBuffer';

// below are shims for compatibility with old browsers (IE 10 being the main culprit)
import 'core-js'
import 'core-js/modules/es6.string.starts-with';
import 'core-js/modules/es6.array.find';
import 'core-js/modules/es6.array.find-index';
import 'isomorphic-fetch';

import './polyfills/restoreArrayBuffer';

// Polyfill Promise if needed
if (typeof (window as any).Promise === 'undefined') {
  (window as any).Promise = require('bluebird');
}
