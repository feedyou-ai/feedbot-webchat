import { Theme } from './index';

export const ExpandableKnobThemeV2 = (theme: Theme) => `
/* webchat redesign */
.feedbot-wrapper.collapsed .feedbot-header {
    background-image: url(${
		theme.template && theme.template.iconUrl
			? theme.template.iconUrl
			: "https://feedyou.blob.core.windows.net/webchat/chatbot-default-icon-v2.svg"
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
