import * as React from 'react';
import { findDOMNode } from 'react-dom';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { Activity, IBotConnection, User, DirectLine, DirectLineOptions, CardActionTypes } from 'botframework-directlinejs';
import { createStore, ChatActions, sendMessage, typingDelay, HistoryAction, ChatStore } from './Store';
import { Provider } from 'react-redux';
import { SpeechOptions } from './SpeechOptions';
import { Speech } from './SpeechModule';
import { ActivityOrID, FormatOptions } from './Types';
import * as konsole from './Konsole';
import { getTabIndex } from './getTabIndex';
import { ConnectionStatus } from 'botframework-directlinejs';
//import { createVisitorClient, VisitorClient, MessageSubType } from 'smartsupp-websocket'

import { History } from './History';
import { MessagePane } from './MessagePane';
import { Shell, ShellFunctions } from './Shell';
import { getFeedyouParam } from './FeedyouParams';
import { CustomExplanation, Role, Theme } from './themes';

const Swal = require('sweetalert2')

declare var $: any;
declare const fbq: Function;

interface GaEvent {
    eventCategory: string
    eventAction:string
    eventLabel?: string
    eventValue?: string
}

interface GtmEvent {
    event: string
    dataLayerName?: string
    variables?: Array<{name: string, value: string}>
}

interface SmartsuppHandoffOptions {
    key: string
    name?: string
    email?: string
    phone?: string
    notification?: string
    variables?: {[key: string]: string}
}

export interface ChatProps {
    adaptiveCardsHostConfig: any,
    chatTitle?: boolean | string,
    consolePlaceholder?: string
    user: User,
    bot: User,
    botConnection?: IBotConnection,
    directLine?: DirectLineOptions,
    speechOptions?: SpeechOptions,
    locale?: string,
    selectedActivity?: BehaviorSubject<ActivityOrID>,
    sendTyping?: boolean,
    showUploadButton?: boolean,
    uploadCapture?: 'image/*' | 'video/*' | 'audio/*',
    disableInputWhenNotNeeded?: boolean,
    formatOptions?: FormatOptions,
    resize?: 'none' | 'window' | 'detect',
    userData?: {},
    introDialog?: {id?: string},
    startOverTrigger?: (trigger: () => void) => void,
    onConversationStarted?: (callback: (conversationId: string) => void) => void,
    onEvent?: {[event: string]: (activity: Activity) => void},
    onMessage?: (activity: Activity) => void,
    typingDelay?: number
    theme?: Theme
    initialMessage?: string
}



export class Chat extends React.Component<ChatProps, {}> {

    private store = createStore();

    private botConnection: IBotConnection;

    private activitySubscription: Subscription;
    private fbPixelEventsSubscription: Subscription;
    private gaEventsSubscription: Subscription;
    private gtmEventsSubscription: Subscription;
    private handoffSubscription: Subscription;
    private webchatCollapseSubscribtion: Subscription;
    private redirectSubscribtion: Subscription;
    private logSubscribtion: Subscription;
    private connectionStatusSubscription: Subscription;
    private selectedActivitySubscription: Subscription;
    private shellRef: React.Component & ShellFunctions;
    private historyRef: React.Component;
    private chatviewPanelRef: HTMLElement;

    //private smartsupp: VisitorClient

    private resizeListener = () => this.setSize();

    private _handleCardRating = this.handleCardRating.bind(this);
    private _handleCardInfo = this.handleCardInfo.bind(this);
    private _handleCardAction = this.handleCardAction.bind(this);
    private _handleKeyDownCapture = this.handleKeyDownCapture.bind(this);
    private _saveChatviewPanelRef = this.saveChatviewPanelRef.bind(this);
    private _saveHistoryRef = this.saveHistoryRef.bind(this);
    private _saveShellRef = this.saveShellRef.bind(this);
    //private _smartsuppHandoff = this.smartsuppHandoff.bind(this);

    constructor(props: ChatProps) {
        super(props);

        konsole.log("BotChat.Chat props", props);

        this.store.dispatch<ChatActions>({
            type: 'Set_Locale',
            locale: props.locale || (window.navigator as any)["userLanguage"] || window.navigator.language || 'en'
        });

        if(props.consolePlaceholder){
        this.store.dispatch<ChatActions>({
            type: 'Set_Console_Placeholder',
            locale: props.locale || (window.navigator as any)["userLanguage"] || window.navigator.language || 'en',
            consolePlaceholder: props.consolePlaceholder
        });
    }
        if(props.typingDelay) {
            this.store.dispatch<ChatActions>({
                type: "Set_TypingDelay",
                payload: props.typingDelay
            })
        }

        if (props.adaptiveCardsHostConfig) {
            this.store.dispatch<ChatActions>({
                type: 'Set_AdaptiveCardsHostConfig',
                payload: props.adaptiveCardsHostConfig
            });
        }

        let { chatTitle } = props;

        if (props.formatOptions) {
            console.warn('DEPRECATED: "formatOptions.showHeader" is deprecated, use "chatTitle" instead. See https://github.com/Microsoft/BotFramework-WebChat/blob/master/CHANGELOG.md#formatoptionsshowheader-is-deprecated-use-chattitle-instead.');

            if (typeof props.formatOptions.showHeader !== 'undefined' && typeof props.chatTitle === 'undefined') {
                chatTitle = props.formatOptions.showHeader;
            }
        }

        if (typeof chatTitle !== 'undefined') {
            this.store.dispatch<ChatActions>({ type: 'Set_Chat_Title', chatTitle });
        }

        this.store.dispatch<ChatActions>({ type: 'Toggle_Upload_Button', showUploadButton: props.showUploadButton !== false });

        this.store.dispatch<ChatActions>({ type: 'Set_Upload_Capture', uploadCapture: props.uploadCapture });

        this.store.dispatch<ChatActions>({ type: 'Toggle_Disable_Input', disableInput: props.disableInputWhenNotNeeded });

        this.store.dispatch<ChatActions>({ type: 'Toggle_Disable_Input_When_Not_Needed', disableInputWhenNotNeeded: props.disableInputWhenNotNeeded });

        if (props.sendTyping) {
            this.store.dispatch<ChatActions>({ type: 'Set_Send_Typing', sendTyping: props.sendTyping });
        }

        if (props.speechOptions) {
            Speech.SpeechRecognizer.setSpeechRecognizer(props.speechOptions.speechRecognizer);
            Speech.SpeechSynthesizer.setSpeechSynthesizer(props.speechOptions.speechSynthesizer);
        }
    }

    private handleIncomingActivity(activity: Activity) {
        let state = this.store.getState();
        switch (activity.type) {
            case "event":
                if (['message-stream','message-stream-chunk'].includes(activity.name) && activity.from.id !== state.connection.user.id) {
                    this.store.dispatch<ChatActions>({ type: 'Receive_Message', activity: Object.assign({},activity, {type: 'message', text: activity.value})});
                }
                break;
            case "message":
                if (activity.channelData && activity.channelData.alreadyStreamed) {
                    break
                }

                this.store.dispatch<ChatActions>({ type: activity.from.id === state.connection.user.id ? 'Receive_Sent_Message' : 'Receive_Message', activity });
                break;

            case "typing":
                if (activity.from.id !== state.connection.user.id)
                    this.store.dispatch<ChatActions>({ type: 'Show_Typing', activity });
                break;
        }
    }

    private setSize() {
        this.store.dispatch<ChatActions>({
            type: 'Set_Size',
            width: this.chatviewPanelRef.offsetWidth,
            height: this.chatviewPanelRef.offsetHeight
        });
    }

    private handleCardRating(activity: Activity, rating: number, callback: (rated: boolean) => void) {
        if (rating === -1 && isUserRoleInArray(this.props.theme.genAi.explanationRoles)) {
            const customExplanationForCurrentRole = this.props.theme.genAi.customExplanations.find((customExplanation) => customExplanation.roles.includes(getRole()))
            getExplanation((explanation: string) => this.rate(activity, rating, explanation, callback), customExplanationForCurrentRole)
        } else {
            this.rate(activity, rating, '', callback)
        }
    }

    private rate(activity: Activity, value: number, explanation = '', callback: (rated: boolean) => void) {
        console.log('Rating ' + value + ' for query ' + activity.channelData.queryId);

        const role = getRole()

        fetch('https://'+this.props.bot.id.replace(/\-app$/,'')+'-app.azurewebsites.net/api/messages/kb/'+(activity.channelData.modelId || 'KB')+'/queries/'+activity.channelData.queryPartition+'/'+activity.channelData.queryId+'/rating',{
            method: 'POST',
            headers: { accept: 'application/json', 'content-type': 'application/json' },
            body: JSON.stringify({ action: (value === 1 ? 'up' : value === -1 ? 'down' : ''), explanation, role}),
        }).then(() => {
            Swal.fire({
                icon: "success",
                title: "Děkujeme za zpětnou vazbu!"
            });
            callback(true)
        }).catch((err) => {
            console.error('Failed to rate query', err);
            Swal.fire({
                icon: "error",
                title: "Něco se pokazilo",
                text: "Bohužel se nepodařilo odeslat vaši zpětnou vazbu. Budeme moc rádi, pokud ji zkusíte předat jiným způsobem."
            });
            callback(false)
        })

    }

    private handleCardInfo(activity: Activity) {
        Swal.fire({
            width: 1000,
            title: "Query details",
            html: activity.channelData.info
        });
    }

    private handleCardAction() {
        try {
            // After the user click on any card action, we will "blur" the focus, by setting focus on message pane
            // This is for after click on card action, the user press "A", it should go into the chat box
            const historyDOM = this.getHistoryDOMNode();
            if (historyDOM) {
                historyDOM.focus();
            }
        } catch (err) {
            // In Emulator production build, React.findDOMNode(this.historyRef) will throw an exception saying the
            // component is unmounted. I verified we did not miss any saveRef calls, so it looks weird.
            // Since this is an optional feature, I am try-catching this for now. We should find the root cause later.
            //
            // Some of my thoughts, React version-compatibility problems.
        }
    }

		// https://github.com/microsoft/BotFramework-WebChat/issues/970
		// https://github.com/microsoft/BotFramework-WebChat/issues/1156
		private getHistoryDOMNode(): HTMLDivElement | null {
		  	try {
					return findDOMNode(this.historyRef) as HTMLDivElement
			  } catch(e) {
					return null
			  }
	  } 
		
    private handleKeyDownCapture(evt: React.KeyboardEvent<HTMLDivElement>) {
        const target = evt.target as HTMLElement;
        const tabIndex = getTabIndex(target);

        if (
            evt.altKey
            || evt.ctrlKey
            || evt.metaKey
            || (!inputtableKey(evt.key) && evt.key !== 'Backspace')
        ) {
            // Ignore if one of the utility key (except SHIFT) is pressed
            // E.g. CTRL-C on a link in one of the message should not jump to chat box
            // E.g. "A" or "Backspace" should jump to chat box
            return;
        }

        if (
            target === this.getHistoryDOMNode()
            || typeof tabIndex !== 'number'
            || tabIndex < 0
        ) {
            evt.stopPropagation();

            let key: string;

            // Quirks: onKeyDown we re-focus, but the newly focused element does not receive the subsequent onKeyPress event
            //         It is working in Chrome/Firefox/IE, confirmed not working in Edge/16
            //         So we are manually appending the key if they can be inputted in the box
            if (/(^|\s)Edge\/16\./.test(navigator.userAgent)) {
                key = inputtableKey(evt.key);
            }

            this.shellRef.focus(key);
        }
    }

    private saveChatviewPanelRef(chatviewPanelRef: HTMLElement) {
        this.chatviewPanelRef = chatviewPanelRef;
    }

    private saveHistoryRef(historyWrapper: any) {
        this.historyRef = historyWrapper && historyWrapper.getWrappedInstance();
    }
		
    private saveShellRef(shellWrapper: any) {
        this.shellRef = shellWrapper && shellWrapper.getWrappedInstance();
    }

    componentDidMount() {
        // Now that we're mounted, we know our dimensions. Put them in the store (this will force a re-render)
        this.setSize();

        // FEEDYOU - ability to pass some userData to bot using backchannel's channel data prop
        let botConnection: any
        if (this.props.directLine) {
            botConnection = this.botConnection = new DirectLine(this.props.directLine)
        } else {
            botConnection = this.props.botConnection
        }

        const userData = {
            ...(this.props.userData || {}),
            ...(window.location.hash === '#feedbot-test-mode' ? { testMode: true } : {}),
            ...getLocaleUserData(this.props.locale),
            ...getReferrerUserData(), 
              "user-agent":  navigator.userAgent
        }

        botConnection.postActivityOriginal = botConnection.postActivity
        
        botConnection.postActivity = (activity: any) => {
            //send userData only once during initial event
            if (activity.name === 'beginIntroDialog') {
                const newActivity = {
                    ...activity,
                    channelData: {
                        ...activity.channelData,
                        userData
                    }
                };
                

                return botConnection.postActivityOriginal(newActivity);
            /*} else if (this.smartsupp && activity.type === "message") {
                console.log('Smartsupp send', activity.text, activity)
                this.smartsupp.chatMessage({
                    content: {
                        type: 'text',
                        text: activity.text,
                    },
                })
                return new Observable()*/
            } else {
                return botConnection.postActivityOriginal(activity);
            }
        }

        if (this.props.onEvent) {
            Object.keys(this.props.onEvent).forEach((eventName) => {
                botConnection.activity$
                    .filter((activity: Activity) => activity.type === 'event' && activity.name === eventName)
                    .subscribe(this.props.onEvent[eventName]);
            });
        }

        if (this.props.onMessage) {
            botConnection.activity$
                .filter((activity: Activity) => activity.type === 'message' )
                .subscribe(this.props.onMessage);
        }

        if (this.props.resize === 'window')
            window.addEventListener('resize', this.resizeListener);

        this.store.dispatch<ChatActions>({ type: 'Start_Connection', user: this.props.user, bot: this.props.bot, botConnection, selectedActivity: this.props.selectedActivity });
        
        // setTimeout(() => this.smartsuppHandoff({key: '8f2622df0b638f00440671a5fb471919ff3cfea1'}), 10000)

        // FEEDYOU - TECHNICAL ISSUES MESSAGE
        // this.handleIncomingActivity({ id: 'maintenance', type: 'message', from: { name: "Chatbot", ...this.props.bot }, text: "Dobrý den, aktuálně mám technické problémy, které kolegové intenzivně řeší. Je možné, že nebudu reagovat úplně správně, moc se za to omlouvám. Prosím zkuste si se mnou popovídat později.", timestamp: new Date().toISOString()});

        // FEEDYOU - show typing on startup - if bot.id is set to the same value as value on server, it will be cleared by first message
        const directLineBotId = getFeedyouParam("directLineBotId") || this.props.bot.id
        if (this.props.bot && directLineBotId) {
            this.store.dispatch<ChatActions>({ type: 'Show_Typing', activity: { id: 'typingUntilIntroDialog', type: 'typing', from: { name: "Chatbot", ...this.props.bot, id: directLineBotId }, timestamp: new Date().toISOString()}});
        }

        // FEEDYOU - support "start over" button
        this.props.startOverTrigger && this.props.startOverTrigger(() => {
            startOver(botConnection, this.store, this.props)
        })
        window.addEventListener('feedbot:start-over', () => {
            startOver(botConnection, this.store, this.props)
        })
        
        this.fbPixelEventsSubscription = botConnection.activity$
            .filter((activity: any) => activity.type === "event" && activity.name === "facebook-pixel-track-event")
            .subscribe((activity: any) => trackFacebookPixelEvent(activity.value))

        this.gaEventsSubscription = botConnection.activity$
            .filter((activity: any) => activity.type === "event" && activity.name === "google-analytics-track-event")
            .subscribe((activity: any) => trackGoogleAnalyticsEvent(JSON.parse(activity.value)))

        this.gtmEventsSubscription = botConnection.activity$
            .filter((activity: any) => activity.type === "event" && activity.name === "google-tag-manager-track-event")
            .subscribe((activity: any) => trackGoogleTagManagerEvent(JSON.parse(activity.value)))

        /*this.handoffSubscription = botConnection.activity$
            .filter((activity: any) => activity.type === "event" && activity.name === "handoff")
            .subscribe((activity: any) => this._smartsuppHandoff(JSON.parse(activity.value)))*/

        this.webchatCollapseSubscribtion = botConnection.activity$
            .filter((activity: any) => activity.type === "event" && activity.name === "webchat-collapse")
            .subscribe(() => {
                const wrapper = document.getElementsByClassName('feedbot-wrapper')[0]
                wrapper && wrapper.classList.add('collapsed')
            })

        this.redirectSubscribtion = botConnection.activity$
            .filter((activity: any) => activity.type === "event" && activity.name === "redirect")
            .subscribe((activity: any) => {
                // ignore redirect inside of Designer's Try panel
                activity.value && !window.hasOwnProperty('API_URL') && (location.href = activity.value)
            })

        this.logSubscribtion = botConnection.activity$
            .filter((activity: any) => activity.type === "event" && activity.name === "log")
            .subscribe((activity: any) => {
                if (Array.isArray(activity.value)) {
                    const logs: any[] = [].concat(activity.value) // unfreeeze so unshift will not fail
                    logs.unshift('Feedyou WebChat log')
                    console.log.apply(this, logs)
                } else {
                    console.log('Feedyou WebChat log', activity.value)
                }
            })

        // FEEDYOU - send event to bot to tell him webchat was opened - more reliable solution instead of conversationUpdate event
        // https://github.com/Microsoft/BotBuilder/issues/4245#issuecomment-369311452
        if ((!this.props.directLine || !this.props.directLine.conversationId) && (!this.props.botConnection || !((this.props.botConnection as any).conversationId)) && !this.props.initialMessage) {
            const introDialogId = getIntroDialogId(this.props)
            botConnection.postActivity({
                from: this.props.user,
                name: 'beginIntroDialog',
                type: 'event',
                value: '',
                channelData: introDialogId ? {id: introDialogId} : undefined
            }).subscribe(function (id: any) {
                konsole.log('"beginIntroDialog" event sent');
            });
        }

        // FEEDYOU - way to trigger dialog from anywhere using window event
        // polyfill needed for IEs https://gomakethings.com/custom-events-in-internet-explorer-with-vanilla-js/
        window.addEventListener('feedbot:trigger-dialog', (event: CustomEvent) => {
            console.log('feedbot:trigger-dialog', event.detail, event)
            let eventName: string
            let dialogId: string
            let userData: object = {}
            let mode: string
            if (typeof event.detail === 'string') {
                dialogId = event.detail
                eventName = 'beginIntroDialog'
            } else if (typeof event.detail === 'object' && typeof event.detail.id === 'string') {
                dialogId = event.detail.id
                userData = event.detail.userData || {}
                mode = event.detail.mode || ''
                eventName = 'beginDialog' // new event supported from bot v1.7.419
            }
            
            if (dialogId) {
                botConnection.postActivity({
                    from: this.props.user,
                    name: eventName,
                    type: 'event',
                    value: '',
                    channelData: {id: dialogId, userData, mode}
                }).subscribe(function (id: any) {
                    konsole.log('"'+eventName+'" event sent', dialogId, userData, mode);
                });
            }
        })

        this.connectionStatusSubscription = botConnection.connectionStatus$.subscribe((connectionStatus: any) =>{
                if(this.props.speechOptions && this.props.speechOptions.speechRecognizer){
                    let refGrammarId = botConnection.referenceGrammarId;
                    if(refGrammarId)
                        this.props.speechOptions.speechRecognizer.referenceGrammarId = refGrammarId;
                }
                this.store.dispatch<ChatActions>({ type: 'Connection_Change', connectionStatus })

			// FEEDYOU
			// sessionStorage is undefined in IE for file:// testing: https://stackoverflow.com/a/3392301/10467064
			botConnection.conversationId && sessionStorage && sessionStorage.setItem("feedbotConversationId", botConnection.conversationId)
                if (this.props.onConversationStarted && connectionStatus === ConnectionStatus.Online && botConnection.conversationId) {
                    this.props.onConversationStarted(botConnection.conversationId)
                }

            }
        );

        this.activitySubscription = botConnection.activity$.subscribe(
            (activity: any) => this.handleIncomingActivity(activity),
            (error: any) => konsole.log("activity$ error", error)
        );

        if (this.props.initialMessage) {
            this.store.dispatch<ChatActions>(sendMessage(this.props.initialMessage, this.props.user, 'cs', {userData}));
        }

        if (this.props.selectedActivity) {
            this.selectedActivitySubscription = this.props.selectedActivity.subscribe(activityOrID => {
                this.store.dispatch<ChatActions>({
                    type: 'Select_Activity',
                    selectedActivity: activityOrID.activity || this.store.getState().history.activities.find(activity => activity.id === activityOrID.id)
                });
            });
        }
    }

    /*smartsuppHandoff(options: SmartsuppHandoffOptions) {
        console.log('SMARTSUPP HANDOFF')

        this.smartsupp = createVisitorClient({
            data: {
                id: this.props.user.id,
                key: options.key,
                domain: document.domain || "localhost",
                name: options.name || null,
                email: options.email || null,
                phone: options.phone || null,
                variables: options.variables
            },
            connection: {
                url: 'https://websocket.smartsupp.com',
                options: {}
            }
        })

        this.smartsupp.connect().then(() => {
            console.log('Smartsupp connected')

            this.smartsupp.chatMessage({
                content: {
                    type: 'text',
                    text: options.notification || '🤖',
                },
            })
        }).catch((err) => {
            console.error(err)
        })
        
        this.smartsupp.on('chat.message_received', (data) => {
            if (data.message.subType === MessageSubType.Agent) {
                console.log('Smartsupp receive', data.message.content.text, data)

                this.store.dispatch<ChatActions>({ type: 'Receive_Message', activity: {
                    from: { id: this.props.bot.id, name: this.props.bot.name},
                    type: "message",
                    text: data.message.content.text,
                    id: data.message.id
                } });
            }
        })
    }*/

    componentWillUnmount() {
        this.fbPixelEventsSubscription.unsubscribe();
        this.gaEventsSubscription.unsubscribe();
        this.gtmEventsSubscription.unsubscribe();
        // this.handoffSubscription.unsubscribe();
        this.webchatCollapseSubscribtion.unsubscribe();
        this.redirectSubscribtion.unsubscribe();
        this.logSubscribtion.unsubscribe();
        this.connectionStatusSubscription.unsubscribe();
        this.activitySubscription.unsubscribe();
        if (this.selectedActivitySubscription)
            this.selectedActivitySubscription.unsubscribe();
        if (this.botConnection)
            this.botConnection.end();
        window.removeEventListener('resize', this.resizeListener);
    }

    componentWillReceiveProps(nextProps: ChatProps) {
        if (this.props.adaptiveCardsHostConfig !== nextProps.adaptiveCardsHostConfig) {
            this.store.dispatch<ChatActions>({
                type: 'Set_AdaptiveCardsHostConfig',
                payload: nextProps.adaptiveCardsHostConfig
            });
        }

        if (this.props.showUploadButton !== nextProps.showUploadButton) {
            this.store.dispatch<ChatActions>({
                type: 'Toggle_Upload_Button',
                showUploadButton: nextProps.showUploadButton
            });
        }

        if (this.props.disableInputWhenNotNeeded !== nextProps.disableInputWhenNotNeeded) {
            this.store.dispatch<ChatActions>({
                type: 'Toggle_Disable_Input_When_Not_Needed',
                disableInputWhenNotNeeded: nextProps.disableInputWhenNotNeeded
            });
        }

        if (this.props.chatTitle !== nextProps.chatTitle) {
            this.store.dispatch<ChatActions>({
                type: 'Set_Chat_Title',
                chatTitle: nextProps.chatTitle
            });
        }
    }

    // At startup we do three render passes:
    // 1. To determine the dimensions of the chat panel (nothing needs to actually render here, so we don't)
    // 2. To determine the margins of any given carousel (we just render one mock activity so that we can measure it)
    // 3. (this is also the normal re-render case) To render without the mock activity

    render() {
        const state = this.store.getState();
        konsole.log("BotChat.Chat state", state);

        // only render real stuff after we know our dimensions
        return (
            <div className="wc-app">
                <Provider store={ this.store }>
                      <div
                          className="wc-chatview-panel"
                          onKeyDownCapture={ this._handleKeyDownCapture }
                          ref={ this._saveChatviewPanelRef }
                      >
                          {
                              !!state.format.chatTitle &&
                                  <div className="wc-header">
                                      <span>{ typeof state.format.chatTitle === 'string' ? state.format.chatTitle : state.format.strings.title }</span>
                                  </div>
                          }
                          <MessagePane>
                              <History
                                customDisclaimerText={ this.props.theme.genAi.customDisclaimerText }
                                canRate={isUserRoleInArray(this.props.theme.genAi.ratingRoles)}
                                canWriteExplanation={ isUserRoleInArray(this.props.theme.genAi.explanationRoles) }
                                canSeeInfo={ getRole() === "admin" }
                                  onCardAction={ this._handleCardAction }
                                  onCardRating={ this._handleCardRating }
                                  onCardInfo={ this._handleCardInfo }
                                  ref={ this._saveHistoryRef }
                              />
                          </MessagePane>
                          <Shell ref={ this._saveShellRef } />
                          {
                              this.props.resize === 'detect' &&
                                  <ResizeDetector onresize={ this.resizeListener } />
                          }
                      </div>
                  </Provider>
            </div>
        );
    }
}

export interface IDoCardAction {
    (type: CardActionTypes, value: string | object): void;
}

export const doCardAction = (
    botConnection: IBotConnection,
    from: User,
    locale: string,
    sendMessage: (value: string, user: User, locale: string) => void,
): IDoCardAction => (
    type,
    actionValue
) => {

    const text = (typeof actionValue === 'string') ? actionValue as string : undefined;
    const value = (typeof actionValue === 'object')? actionValue as object : undefined;

    switch (type) {
        case "imBack":
            if (typeof text === 'string')
                sendMessage(text, from, locale);
            break;

        case "postBack":
            sendPostBack(botConnection, text, value, from, locale);
            break;
            
        case "call":
        case "openUrl":
        case "playAudio":
        case "playVideo":
        case "showImage":
        case "downloadFile":
            window.open(text);
            break;
        case "signin":
            let loginWindow =  window.open();
            if (botConnection.getSessionId)  {
                botConnection.getSessionId().subscribe(sessionId => {
                    konsole.log("received sessionId: " + sessionId);
                    loginWindow.location.href = text + encodeURIComponent('&code_challenge=' + sessionId);
                }, error => {
                    konsole.log("failed to get sessionId", error);
                });
            }
            else {
                loginWindow.location.href = text;
            }
            break;

        default:
            konsole.log("unknown button type", type);
        }
}

export const sendPostBack = (botConnection: IBotConnection, text: string, value: object, from: User, locale: string) => {
    botConnection.postActivity({
        type: "message",
        text,
        value,
        from,
        locale,
        timestamp: new Date().toISOString()
    })
    .subscribe(id => {
        konsole.log("success sending postBack", id)
    }, error => {
        konsole.log("failed to send postBack", error);
    });
}

export const startOver = (botConnection: IBotConnection, store: ChatStore, props: ChatProps) => {
    konsole.log('cleaning history and starting over')

    store.dispatch<HistoryAction>({ type: 'Clear_History' });
    
    store.dispatch<ChatActions>({ type: 'Show_Typing', activity: { id: 'typingUntilIntroDialog', type: 'typing', from: { name: "Chatbot", ...props.bot }, timestamp: new Date().toISOString()}});

    const introDialogId = getIntroDialogId(props)
    botConnection.postActivity({
        from: props.user,
        name: 'beginIntroDialog',
        type: 'event',
        value: '',
        channelData: introDialogId ? {id: introDialogId} : undefined
    }).subscribe(() => {
        konsole.log("success sending startOver")
    }, error => {
        konsole.log("failed to send startOver", error);
    });
}

export const renderIfNonempty = (value: any, renderer: (value: any) => JSX.Element ) => {
    if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 0))
        return renderer(value);
}

export const classList = (...args:(string | boolean)[]) => {
    return args.filter(Boolean).join(' ');
}

// note: container of this element must have CSS position of either absolute or relative
const ResizeDetector = (props: {
    onresize: () => void
}) =>
    // adapted to React from https://github.com/developit/simple-element-resize-detector
    <iframe
        style={ { position: 'absolute', left: '0', top: '-100%', width: '100%', height: '100%', margin: '1px 0 0', border: 'none', opacity: 0, visibility: 'hidden', pointerEvents: 'none' } }
        ref={ frame => {
            if (frame)
                frame.contentWindow.onresize = props.onresize;
        } }
    />;

// For auto-focus in some browsers, we synthetically insert keys into the chatbox.
// By default, we insert keys when:
// 1. evt.key.length === 1 (e.g. "1", "A", "=" keys), or
// 2. evt.key is one of the map keys below (e.g. "Add" will insert "+", "Decimal" will insert ".")
const INPUTTABLE_KEY: { [key: string]: string } = {
    Add: '+',      // Numpad add key
    Decimal: '.',  // Numpad decimal key
    Divide: '/',   // Numpad divide key
    Multiply: '*', // Numpad multiply key
    Subtract: '-'  // Numpad subtract key
};

function inputtableKey(key: string) {
    return key.length === 1 ? key : INPUTTABLE_KEY[key];
}

function getGoogleAnalyticsUserData() {
    const tracker = (typeof ga !== 'undefined') && ga && ga.getAll && ga.getAll() && ga.getAll()[0]
    if (tracker) {
        const trackingId = tracker.get('trackingId')
        return {googleAnalyticsTrackingId: trackingId} || {}
    }
    return {}
}

function getReferrerUserData() {
    return {referrerUrl: window.location.href}
}

function getLocaleUserData(locale?: string) {
    return locale ? {locale: locale.replace(/-.*/,'')} : {}
}

function trackFacebookPixelEvent(eventName: string) {
    console.log('Tracking FB Pixel custom event ' + eventName)
    if (typeof fbq === 'function') {
        console.log('Tracking FB Pixel custom event ' + eventName)
        fbq('trackCustom', eventName);
    } else {
        console.warn('fbq is undefined - cannot track FB Pixel custom event ' + eventName)
    }
}

function trackGoogleAnalyticsEvent(event: GaEvent) {
    const eventInfo = 'ga("'+event.eventCategory+'", "'+event.eventAction+'", '+(event.eventLabel || 'undefined')+', '+(event.eventValue ? parseInt(event.eventValue) : 'undefined')+')'
    if (typeof ga === 'function') {
        console.log('Tracking GA custom event ' + eventInfo, event)
        ga(event.eventCategory, event.eventAction, event.eventLabel || undefined, event.eventValue ? parseInt(event.eventValue) : undefined)
    } else {
        console.warn('ga is undefined - cannot track GA custom event ' + eventInfo, event)
    }
}

function trackGoogleTagManagerEvent({event, variables, dataLayerName}: GtmEvent) {
    const data = (variables || []).reduce((data, variable) => ({...data, [variable.name]: variable.value}), {event})
    const dataLayer = dataLayerName || "dataLayer"
    
    if (typeof (window as any)[dataLayer] === 'object') {
        console.log('Tracking GTM custom event dataLayer.push(...)', data)
        ;(window as any)[dataLayer].push(data)
    } else {
        console.warn('dataLayer is undefined - cannot track GTM custom event dataLayer.push(...)', data)
    }
}

function getIntroDialogId(props: ChatProps): string | undefined {
    if (window.location.hash.startsWith('#feedbot-intro-dialog=')) {
        return window.location.hash.substr(22)
    }

    return props.introDialog && props.introDialog.id ? props.introDialog.id : undefined
}

function getRole(): Role {
    const urlParams = new URLSearchParams(window.location.search);
    const roles = ['admin', 'customer', 'user'] as Role[]

    // this goes through all roles and returns the first one that is set in URL
    const role = roles.find((role): boolean => {
        return urlParams.get(role) !== null
    })

    return role || "user"
 }

 function isUserRoleInArray(roles: Role[] = []): boolean {
    const userRole = getRole()
    const isInArray = roles.indexOf(userRole) >= 0

    return isInArray          
 }

function getExplanation(callback: (explanation: string) => void, customExplanationForCurrentRole: CustomExplanation | undefined) {
    const title = (customExplanationForCurrentRole && customExplanationForCurrentRole.title) || 'Zpětná vazba'
    const intro = (customExplanationForCurrentRole && customExplanationForCurrentRole.intro) || "Kliknutím na palec dolů nám dáváte vědět, že vygenerovaná odpověď nebyla správná, něco v ní chybělo, popřípadě neodpovídala vašim představám. Váš feedback je velmi vítaný."
    const explanationFields = (customExplanationForCurrentRole && customExplanationForCurrentRole.explanationFields.length > 0) ? customExplanationForCurrentRole.explanationFields : [{"name": "swal-problem", "label": "<b>Stručně prosím popište, co by na odpovědi mohlo být lépe: <span style='color: red;'>*</span></b>", "required": true}]

    const fieldsHtml = explanationFields.map((field) => {
        return `
        <label for="${field.name}">${field.label}</label>
        <textarea class="form-control" id="${field.name}" rows="3"></textarea>
        `})

    Swal.fire({
        title,
        showCancelButton: true,
        cancelButtonText: 'Zrušit',
        html: `
          <p style="margin-top:32px;text-align:left;">${intro}</p>
          <form style="text-align:left;">
            <div class="form-group">
                ${fieldsHtml}
            </div>
          </form>
        `,
        focusConfirm: false,
        preConfirm: () => {
            const fields = explanationFields.map((field) => {
                return { ...field, value: (document.getElementById(field.name) as any).value}
            })
            const invalidFields = fields.filter((field) => field.required && !field.value)  

            fields.forEach((field) => {
                if(invalidFields.includes(field)) {
                    document.getElementById(field.name).style.border = "2px solid red"
                    return
                }

                document.getElementById(field.name).style.border = "2px solid #ced4da"
            })

            if (invalidFields.length > 0) {
                Swal.showValidationMessage(`Prosím vyplňte všechna povinná pole.`)
                return false
            }

            return fields.map(field => field.value).join('\n\n')
        },
        confirmButtonText: 'Odeslat'
    }).then((result: any) => {
        if (result.value) {
            callback(result.value);
        }
    })
}