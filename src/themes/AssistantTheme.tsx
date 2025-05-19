import { BaseTheme } from './BaseTheme'
import { Theme } from './index'

export const AssistantTheme = (theme: Theme) => {

  const lightenColor = (color: string, amount: number): string => {
    const num = parseInt(color.replace("#", ""), 16)
    const r = Math.min(255, (num >> 16) + amount)
    const g = Math.min(255, ((num >> 8) & 0x00ff) + amount)
    const b = Math.min(255, (num & 0x0000ff) + amount)
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`
  }

  const generateConicGradient = (mainColor: string): string => {
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const num = parseInt(hex.replace("#", ""), 16);
      return {
        r: (num >> 16) & 0xff,
        g: (num >> 8) & 0xff,
        b: num & 0xff
      };
    };

    const toRgba = (color: string, alpha: number): string => {
      const { r, g, b } = hexToRgb(color);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const color1 = toRgba(mainColor, 1);    
    const color2 = toRgba(mainColor, 0.7);  
    const color3 = toRgba(mainColor, 0.4);  

    return `conic-gradient(from var(--angle), ${color1}, ${color2}, ${color3}, ${color3}, ${color2}, ${color1})`;
  };

  const secondaryColor = lightenColor(theme.mainColor, 30)
  
  return `
  ${BaseTheme(theme)}

@keyframes spin{
  from{
    --angle: 0deg;
  }
  to{
    --angle: 360deg;
  }
}

  body {
    font-family: Helvetica, Arial;
    margin: 0; 
    padding: 0; 
    width: 100%; 
    height: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .intro-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin-top: 50px;
    text-align: center;
    translate: 0px -10%;
  }

  .intro-title {
    font-size: 30px;
    font-weight: bold;
    margin-bottom: 20px;
    color: rgb(22, 54, 77);
  }

  .dark-mode .intro-title {
    color: rgb(211, 211, 211);
  }

  .example-queries {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px;
    margin-top: 20px;
  }

  .example-query {
    display: flex;
    align-items: center;
    max-width: 250px;
    background-color: ${theme.mainColor};
    color: white;
    border-radius: 20px;
    padding: 12px 17px;
    cursor: pointer;
    transition: opacity 0.3s ease;
    opacity: 0.75;
  }

  .example-query:hover {
    opacity: 1;
  }

  .chat-input {
    border: none;
    padding: 20px 25px;
    padding-right: 65px;
    border-radius: 32px;
    width: 100%;
    height: 100%;
    font-size: 16px;
    outline: none;
    resize: none;
    transition: border-color 0.3s ease;
    font-family: inherit;
    box-sizing: border-box;
  }

  .chat-input:focus {
    border-color: ${secondaryColor};
  }

  .card {
    width: 100%;
    max-width: 600px;
    height: 60px;
    margin: 50px auto 65px auto;
    border-radius: 15px;
    position: relative;
  }

@property --angle{
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.card::after, .card::before {
  content: '';
  position: absolute;
  height: 100%;
  width: 100%;
  background-image: ${generateConicGradient(theme.mainColor || '#ff4545')};
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  z-index: -1;
  padding: 1px;
  border-radius: 33px;
  animation: 7s spin linear infinite;
}
.card::before {
  filter: blur(0.6rem);
  opacity: 0.5;
}

.feedbot-wrapper.dark-mode .card::before {
  filter: blur(0.8rem);
  opacity: 0.8;
}

.card::after {
  opacity: 0.6;
}

.feedbot-wrapper.dark-mode .card::before {
  filter: blur(0.8rem);
  opacity: 0.8;
}

.feedbot-wrapper.dark-mode .card::after {
  opacity: 1;
}

  .send-button {
    position: absolute;
    top: 12px;
    right: 12px;
    height: 36px;
    width: 36px;
    background-color: #ccc;
    color: white;
    border: none;
    padding: 5px;
    border-radius: 30px;
    font-size: 14px;
    cursor: pointer;
    transition: 0.3s ease, color 0.3s ease;
    opacity: 0.75;
  }

  .send-button.active:hover {
    opacity: 1;
  }

  .send-button.active {
    background-color: ${theme.mainColor};
    color: white;
  }

  .send-button.active svg {
    fill: white;
    transition: fill 0.3s ease;
}

  .send-button.disabled {
    background-color: #ccc;
    color: #999;
    cursor: default;
  }

  .send-button.disabled svg {
    fill: #999;
  }

  .feedbot-wrapper.dark-mode .send-button {
    background-color: #333;
  }


  .feedbot-wrapper.dark-mode .send-button.disabled {
    background-color: transparent;
  }

  .feedbot-logo {
    height: 40px;
    cursor: pointer;
    z-index: 1000;

    background-color: transparent;
    text-align: left;
    padding-top: 0px;
    padding-bottom: 5px;
    padding-left: 20px;
  }

  .feedbot-logo img {
    max-height: 95%;
    max-width: 70%;
    padding-top: 15px;
    object-fit: contain;
  }
  
  @media (min-width: 768px) {
    .wc-adaptive-card {
      width: 398px;
    }
  }

  .feedbot-wrapper {
    background-color: transparent;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    max-width: 100%; /* Prevent any max-width restrictions */
    max-height: 100%; /* Prevent any max-height restrictions */
    display: flex;
    flex-direction: column;
    position: fixed; /* Ensure it stays fixed to the viewport */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .feedbot-wrapper .wc-app {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: transparent;
  }

  .wc-app .wc-message-groups {
    background-color: transparent !important;
  }

  .wc-app .wc-console {
    background-color: transparent !important;}

  .wc-app .wc-chatview-panel {
    width: 1000px;
    left: calc(50% - 500px);
  }

  .feedbot-wrapper .feedbot {
    position: relative;
    height: 95%;
  }

  .feedbot-wrapper.dark-mode {
    background-color: #191919;
    color: #ffffff;
  }

  .feedbot-wrapper.dark-mode .chat-input {
    background-color: #1e1e1e;
    color: #ffffff;
    border-color: #ffffff;
  }

  .feedbot-wrapper.dark-mode .example-query {
    background-color: #333333;
    color: #ffffff;
  }

  .feedbot-wrapper.dark-mode .example-query:hover {
    background-color: #444444;
  }

  .dark-mode-toggle {
    border-width: 0px;
    border-radius: 30px;
    position: fixed;
    top: 10px;
    right: 10px;
    background-color: #333333;
    color: #ffffff;
    padding: 10px 15px;
    cursor: pointer;
    font-size: 14px;
    z-index: 1000;
    transition: background-color 0.3s ease, color 0.3s ease;
    display: flex;
    align-items: center;
  }

  .dark-mode-title {
    display: none;
  }

  .dark-mode-toggle:hover {
    background-color: #000;
    color: #ffffff;
  }

  .wc-message-from.wc-message-from-bot {
    visibility: hidden;
    height: 2px;
  }

  .wc-message-wrapper:not([data-activity-id='retry']) .wc-message-from {
    visibility: hidden;
  }

  .wc-message-wrapper:not([data-activity-id]) .wc-message-from {
    visibility: visible;
  }

  .wc-message-content {
    padding: 10px;
    border-radius: 13px;
  }

  .wc-message-from-bot .wc-message-content {
    color: #424242 !important;
  }

  .wc-carousel {
    margin-top: 10px;
  }

  .wc-suggested-actions .wc-hscroll > ul > li {
    margin: 6px;
  }

  .wc-message-pane .wc-suggested-actions {
    position: absolute;
    z-index: 10000;
    background-color: white;
  }

  .wc-message-pane.show-actions .wc-suggested-actions {
    height: 70px;
  }

  .feedbot-wrapper .wc-console {
    border-width: 0px;
    height: 70px;
  }

  .wc-message-pane.show-actions .wc-message-groups {
    top: 0px;
    transform: translateY(0px);
  }

  .wc-console.disable-input {
    background-color: white !important;
  }

  .feedbot .wc-suggested-actions .wc-hscroll > ul > li button, .wc-app .wc-card button {
    border-radius: 20px;
  }

  .feedbot .wc-suggested-actions .wc-hscroll > ul > li button:focus, .wc-console .wc-mic, .wc-console .wc-send, .wc-app .wc-card button {
    outline:0;
  }

  .wc-console .wc-mic, .wc-console .wc-send {
    top: 10px !important;
  }

  .wc-console input[type=text], .wc-console textarea {
    margin: 0px 15px;
  }

  .wc-textbox {
    border-radius: 13px;
    background-color: #eceff1;
    height: 70%;
    margin-bottom: 0px;
    top: 6px !important;
  }

  .wc-suggested-actions .wc-hscroll > ul {
    text-align: center;
    margin-top: 10px;
  }

  .wc-message-from-bot .wc-message-content {
   background-color: #f5f5f5;
  }

  .wc-message-from-bot svg.wc-message-callout path {
    fill: #f5f5f5;
  }

  .wc-suggested-actions .wc-hscroll > ul > li {
    max-width: 60%;
  }

  .wc-message-content {
   box-shadow: none;
  }

  .wc-message .wc-list {
    text-align: center;
  }

  .wc-app ::-webkit-scrollbar-thumb {
    background-color: #ececec;
  }

  .wc-app h1, .wc-app h2, .wc-app h3, .wc-app h4, .wc-app p, .wc-app ul, .wc-app ol {
    padding: 4px;
  }

  .wc-carousel button.scroll {
    background-color: ${theme.mainColor} !important;
    border-width: 0px !important;
  }

  .feedbot .wc-suggested-actions .wc-hscroll > ul > li button, .wc-app .wc-card button {
    color: white !important;
    background-color: ${theme.mainColor} !important;
    border-color: ${theme.mainColor} !important;
  }

  .feedbot .wc-suggested-actions .wc-hscroll > ul > li button:active, .wc-app .wc-card button:active {
    color: ${theme.mainColor} !important;
    background-color: white !important;
    border-color: ${theme.mainColor} !important;
  }
    @media (max-width: 1200px) {
    .wc-app .wc-chatview-panel {
    width: 100%;
    left: 0;}
    }

  @media (max-width: 768px) {
  
  .intro-title {
    font-size: 24px;
    margin-bottom: 15px;
  }

  .example-query {
    max-width: 200px;
  }

  .card {
    max-width: 90%;
    margin: 20px auto;
  }
}

@media (max-width: 480px) {
  .intro-title {
    font-size: 20px;
    margin-bottom: 10px;
  }

  .example-query {
    max-width: 150px;
  }


  .card {
    max-width: 90%;
    margin: 15px auto;
  }
}

.source-link-chip {
  display: inline-block;
  background-color: ${theme.mainColor};
  color: white;
  border-radius: 20px;
  padding: 5px 10px;
  margin: 5px;
  }
`}