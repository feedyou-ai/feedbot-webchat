var twemojiModule = require('twemoji');
var twemojiApi = twemojiModule.default || twemojiModule;

var BOTCHAT_SCRIPT_PATTERN = /(?:^|\/)botchat(?:-es5)?\.js(?:[?#].*)?$/i;

function getBotChatScriptSrc() {
  if (typeof document === 'undefined') {
    return '';
  }

  var currentScript = document.currentScript;

  if (currentScript && currentScript.src) {
    return currentScript.src;
  }

  var scripts = document.getElementsByTagName('script');

  for (var index = scripts.length - 1; index >= 0; index--) {
    var script = scripts[index];
    var src = script && script.src;

    if (src && BOTCHAT_SCRIPT_PATTERN.test(src)) {
      return src;
    }
  }

  return '';
}

function getTwemojiBase() {
  var scriptSrc = getBotChatScriptSrc();

  if (!scriptSrc) {
    return 'twemoji/';
  }

  return scriptSrc.replace(/[?#].*$/, '').replace(/[^/]*$/, 'twemoji/');
}

function getTwemojiOptions() {
  return {
    base: getTwemojiBase(),
    folder: 'svg',
    ext: '.svg'
  };
}

module.exports = {
  twemoji: {
    parse: function(text) {
      return twemojiApi.parse(text, getTwemojiOptions());
    }
  }
}