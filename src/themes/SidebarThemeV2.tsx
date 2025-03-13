import { Theme } from './index';

export const SidebarThemeV2 = (theme: Theme) => `
/* webchat redesign */
.feedbot-wrapper.collapsed .feedbot-header {
    background-image: url(${
		theme.template && theme.template.iconUrl
			? theme.template.iconUrl
			: "https://feedyou.blob.core.windows.net/webchat/chatbot-default-icon-v2.svg"
	});
}
.feedbot-wrapper.collapsed .feedbot-header {
	background-color: ${theme.mainColor ? theme.mainColor : '#0063f8'};
}

/* sidebar specific */
.feedbot-wrapper {
    height: 100vh;
    bottom: 0;
    right: 0;
    max-height: 100%;
    border-radius: 0;
}
.feedbot-signature {
    bottom: -2px;
    font-size: 11px;
    right: 13px;
}

/* user custom css */
${theme.customCss || ''}
`;
