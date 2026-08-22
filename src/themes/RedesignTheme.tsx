import { Theme } from './index'

const mixWithWhite = (color: string, whiteRatio: number): string => {
	const hex = color.replace('#', '')
	const normalizedHex = hex.length === 3 ? hex.split('').map(character => character + character).join('') : hex
	const colorValue = parseInt(normalizedHex, 16)

	if (isNaN(colorValue) || normalizedHex.length !== 6) {
		return '#ebf6ff'
	}

	const mixChannel = (channel: number) => Math.round(channel + (255 - channel) * whiteRatio)
	const red = mixChannel(colorValue >> 16)
	const green = mixChannel((colorValue >> 8) & 255)
	const blue = mixChannel(colorValue & 255)

	return `rgb(${red}, ${green}, ${blue})`
}

const withAlpha = (color: string, alpha: number): string => {
	const hex = color.replace('#', '')
	const normalizedHex = hex.length === 3 ? hex.split('').map(character => character + character).join('') : hex
	const colorValue = parseInt(normalizedHex, 16)

	if (isNaN(colorValue) || normalizedHex.length !== 6) {
		return `rgba(0, 99, 248, ${alpha})`
	}

	return `rgba(${colorValue >> 16}, ${(colorValue >> 8) & 255}, ${colorValue & 255}, ${alpha})`
}

export const RedesignTheme = (theme: Theme) => {
	const mainColor = theme.mainColor
	const lightMainColor = mixWithWhite(mainColor, 0.9)
	const mainColorGlow = withAlpha(mainColor, 0.1)

	return `
.feedbot-wrapper .wc-suggested-actions .wc-hscroll > ul {
	text-align: center;
}

.feedbot-wrapper .wc-suggested-actions button,
.feedbot-wrapper .wc-app .wc-card button {
	background-color: ${lightMainColor} !important;
	border-color: ${mainColor} !important;
	color: ${mainColor} !important;
}

.feedbot-wrapper .wc-suggested-actions button:hover,
.feedbot-wrapper .wc-app .wc-card button:hover {
	background-color: ${mainColor} !important;
	border-color: ${mainColor} !important;
	color: white !important;
}

.feedbot-wrapper .wc-app .wc-message-from-me .wc-message-content,
.feedbot-wrapper .wc-carousel button.scroll {
	background-color: ${mainColor};
	border-color: ${mainColor};
}

.feedbot-wrapper .wc-carousel button.scroll:hover,
.feedbot-wrapper .wc-carousel button.scroll:focus,
.feedbot-wrapper .feedbot-persistent-menu-links a:hover {
	background-color: ${lightMainColor};
	border-color: ${mainColor};
}

.feedbot-wrapper .wc-carousel button.scroll:hover svg,
.feedbot-wrapper .wc-carousel button.scroll:focus svg {
	fill: ${mainColor};
}

.feedbot-wrapper .wc-console.has-text .wc-send svg {
	fill: #8fa2b0;
	transition: fill 0.2s cubic-bezier(0, 0, 0.5, 1);
}

.feedbot-wrapper .wc-console.has-text .wc-send:hover svg {
	fill: ${mainColor};
}

.feedbot-wrapper .wc-console.has-text {
	border-color: #dae0e5;
}

.feedbot-wrapper .wc-console:focus-within {
	border-color: ${withAlpha(mainColor, 0.45)};
	box-shadow: 0 0 0 2px ${mainColorGlow};
}

.feedbot-wrapper .wc-console textarea::placeholder {
	color: #8fa2b0;
	opacity: 1;
}

.feedbot-wrapper .wc-list.tiles .ac-pushButton {
	background-color: ${lightMainColor} !important;
	border-color: ${mainColor} !important;
	color: ${mainColor} !important;
}

.feedbot-wrapper .wc-list.tiles .ac-pushButton img {
	filter: brightness(0) drop-shadow(200px 0 0 ${mainColor});
	transition: filter 0.2s cubic-bezier(0, 0, 0.5, 1);
}

.feedbot-wrapper .wc-app .wc-list.tiles .wc-card .ac-pushButton:hover {
	background-color: ${mainColor} !important;
	border-color: ${mainColor} !important;
	box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
	color: white !important;
	top: -3px;
}

.feedbot-wrapper .wc-app .wc-list.tiles .wc-card .ac-pushButton:hover img {
	filter: brightness(0) drop-shadow(200px 0 0 white);
	opacity: 1;
}
`
}
