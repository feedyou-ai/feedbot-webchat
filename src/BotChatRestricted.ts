// Restricted build - security-hardened variant of BotChat.
// The following props are permanently forced and cannot be overridden by callers:
//   forbidScriptInjection = true
//   forbidStyleInjection   = true
//   forbidReferrerQuery    = true  (referrer contains only origin+pathname, no query/hash)
//   forbidDataLayer        = true  (dataLayer writes are suppressed with a console.warn)
//   enableScreenshotUpload = false

import * as React from 'react';
import { App as OriginalApp, AppProps } from './App';
import { Chat as OriginalChat, ChatProps } from './Chat';

const RESTRICTED_CHAT_PROPS: Partial<ChatProps> = {
    forbidReferrerQuery: true,
    forbidDataLayer: true,
};

const RESTRICTED_APP_PROPS: Partial<AppProps> = {
    ...RESTRICTED_CHAT_PROPS,
    forbidScriptInjection: true,
    forbidStyleInjection: true,
    enableScreenshotUpload: false,
};

export const App = (props: AppProps, container?: HTMLElement) => {
    return OriginalApp({ ...props, ...RESTRICTED_APP_PROPS }, container);
};

export class Chat extends React.Component<ChatProps, {}> {
    render() {
        return React.createElement(OriginalChat, {
            ...this.props,
            ...RESTRICTED_CHAT_PROPS,
        });
    }
}

// Re-export everything else unchanged
export { AppProps } from './App';
export { ChatProps } from './Chat';
export * from 'botframework-directlinejs';
export { queryParams } from './Attachment';
export { SpeechOptions } from './SpeechOptions';
export { Speech } from './SpeechModule';
export { generateUserId } from './utils/generateUserId';
