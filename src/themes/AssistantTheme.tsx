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
    const lighter1 = lightenColor(mainColor, 50);
    const lighter2 = lightenColor(mainColor, 100);

    return `conic-gradient(from var(--angle), ${mainColor},${lighter1}, ${lighter2}, ${lighter2}, ${lighter1}, ${mainColor})`;
  };

  const secondaryColor = lightenColor(theme.mainColor, 30)
  
  return `
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
    padding: 30px;

    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: row;
    -ms-flex-direction: row;
    flex-direction: row;
    -webkit-flex-wrap: wrap;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    -webkit-justify-content: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-align-items: flex-end;
    -ms-flex-align: end;
    align-items: flex-end;
  }

  .intro-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }

  .intro-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .example-queries {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
  }

  .example-query {
    background-color: ${theme.mainColor};
    color: white;
    border-radius: 20px;
    padding: 10px 15px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .example-query:hover {
    background-color: ${secondaryColor};
  }

  .chat-input {
    border: none;
    padding: 15px;
    border-radius: 15px;
    width: calc(100% - 30px);
    height: calc(100% - 30px);
    font-size: 16px;
    outline: none;
    resize: none;
    transition: border-color 0.3s ease;
    font-family: inherit;
  }

  .chat-input:focus {
    border-color: ${secondaryColor};
  }

  .card{
  width: 500px;
    height: 100px;
  margin: 30px auto;
  border-radius: 15px;
  position: relative;
}

@property --angle{
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.card::after, .card::before{
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
  border-radius: 15px;
  animation: 10s spin linear infinite;
}
.card::before{
  filter: blur(0.8rem);
  opacity: 0.8;
}

  .feedbot-logo {
    height: 10%;

    background-color: transparent;
    text-align: center;
    padding-top: 0px;
    padding-bottom: 5px;
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
    max-width: 900px;
    min-width: 300px;
    max-height: 98.5%;
    min-height: 500px;

    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: column;
    -ms-flex-direction: column;
    flex-direction: column;

    position: fixed;
    top: 2%;
    left: 2%;
    right: 2%;
    bottom: 0;
  }

  @media screen and (min-width: 950px) {
    .feedbot-wrapper {
      left: calc(50% - 450px);
    }
  }

  .feedbot-wrapper .feedbot {
    position: relative;
    height: 90%;
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

  ${BaseTheme(theme)}
`}