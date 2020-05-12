(function (f,y,b,o,t,s){(t = y.createElement(b)), (s = y.getElementsByTagName(b)[0]);
t.async = 1;t.src = o;s.parentNode.insertBefore(t, s);
})(window,document,"script","https://feedyou.azureedge.net/webchat/master/botchat-es5.js");
window.addEventListener('load', function (){ BotChat.App({
  bot: { id: 'feedbot-randstad' },
  theme: { mainColor: '#2175d9' },
  header: { text: 'Chatbot' },
  userData: { site: '...' },
  disableInputWhenNotNeeded: true,
  autoExpandTimeout: 5000
})})