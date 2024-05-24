import { Theme } from './index';

export const ExpandableKnobThemeV2 = (theme: Theme) => `
/* webchat redesign */
.feedbot-wrapper.collapsed .feedbot-header {
    background-image: url(${
		theme.template && theme.template.iconUrl
			? theme.template.iconUrl
			: '"' +
			  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M19.435.045a17.824 17.824 0 0 1 11.338 5.182 17.82 17.82 0 0 1 1.666 23.299 17.825 17.825 0 0 1-22.83 4.94L3.462 35.83A2.548 2.548 0 0 1 .17 32.538l2.365-6.147A17.821 17.821 0 0 1 19.435.045ZM11.29 17.437a1.121 1.121 0 1 0 0 2.243 1.121 1.121 0 0 0 0-2.243Zm6.087.19a1.121 1.121 0 1 1 1.246 1.863 1.121 1.121 0 0 1-1.246-1.864Zm7.333-.19a1.121 1.121 0 1 0 0 2.242 1.121 1.121 0 0 0 0-2.242Z' fill='white'/%3E%3C/svg%3E"
			  +	'"'
	});
}
.feedbot-wrapper.collapsed .feedbot-header {
	background-color: ${theme.mainColor ? theme.mainColor : '#0063F8'};
}

/* expandable knob specific */
.feedbot-signature {
	bottom: -23px;
	font-size: 13px;
	right: -5px;
}

/* user custom css */
${theme.customCss || ''}
`;
