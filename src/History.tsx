import * as React from 'react';
import { Activity, Message, User, CardActionTypes } from 'botframework-directlinejs';
import { ChatState, FormatState, SizeState } from './Store';
import { connect } from 'react-redux';
import { ActivityView } from './ActivityView';
import { classList, doCardAction, IDoCardAction } from './Chat';
import * as konsole from './Konsole';
import { sendMessage } from './Store';
import { activityWithSuggestedActions } from './activityWithSuggestedActions';

const Swal = require('sweetalert2')

export interface HistoryProps {
    format: FormatState,
    size: SizeState,
    activities: Activity[],
    hasActivityWithSuggestedActions: Activity,

    setMeasurements: (carouselMargin: number) => void,
    onClickRetry: (activity: Activity) => void,
    onClickCardAction: () => void,

    isFromMe: (activity: Activity) => boolean,
    isSelected: (activity: Activity) => boolean,
    onClickActivity: (activity: Activity) => React.MouseEventHandler<HTMLDivElement>,

    onCardRating: (activity: Activity, rating: number, callback: (rated: boolean) => void) => boolean,
    onCardInfo: (activity: Activity) => void,
    onCardAction: () => void,
    doCardAction: IDoCardAction
}

export class HistoryView extends React.Component<HistoryProps, {}> {
    private scrollMe: HTMLDivElement;
    private scrollContent: HTMLDivElement;
    private scrollToBottom = true;
    private lastRenderScrollHeight = 0

    private carouselActivity: WrappedActivity;
    private largeWidth: number;

    constructor(props: HistoryProps) {
        super(props);
    }

    componentWillUpdate(nextProps: HistoryProps) {
        let scrollToBottomDetectionTolerance = 3;

        if (!this.props.hasActivityWithSuggestedActions && nextProps.hasActivityWithSuggestedActions) {
            scrollToBottomDetectionTolerance = 70; // this should be in-sync with $actionsHeight scss var
        }

        this.scrollToBottom = this.shouldScrollToBottom(scrollToBottomDetectionTolerance)
    }
    
    shouldScrollToBottom = (detectionTolerance: number) => {
      const didContentSizeChangeExternallyFromLastRender = this.scrollMe.scrollHeight !== this.lastRenderScrollHeight
      
      if(didContentSizeChangeExternallyFromLastRender) {
        return this.scrollToBottom  // Carry value from last render cycle
      }
      
      return Math.abs(this.scrollMe.scrollHeight - this.scrollMe.scrollTop - this.scrollMe.offsetHeight) <= detectionTolerance
    }

    componentDidUpdate() {
        if (this.props.format.carouselMargin == undefined) {
            // After our initial render we need to measure the carousel width

            // Measure the message padding by subtracting the known large width
            const paddedWidth = measurePaddedWidth(this.carouselActivity.messageDiv) - this.largeWidth;

            // offsetParent could be null if we start initially hidden
            const offsetParent = this.carouselActivity.messageDiv.offsetParent as HTMLElement;

            if (offsetParent) {
                // Subtract the padding from the offsetParent's width to get the width of the content
                const maxContentWidth = offsetParent.offsetWidth - paddedWidth;

                // Subtract the content width from the chat width to get the margin.
                // Next time we need to get the content width (on a resize) we can use this margin to get the maximum content width
                const carouselMargin = this.props.size.width - maxContentWidth;

                konsole.log('history measureMessage ' + carouselMargin);

                // Finally, save it away in the Store, which will force another re-render
                this.props.setMeasurements(carouselMargin)

                this.carouselActivity = null; // After the re-render this activity doesn't exist
            }
        }

        this.lastRenderScrollHeight = this.scrollMe.scrollHeight
        this.autoscroll();
    }

    private autoscroll() {
        const vAlignBottomPadding = Math.max(0, measurePaddedHeight(this.scrollMe) - this.scrollContent.offsetHeight);
        this.scrollContent.style.marginTop = vAlignBottomPadding + 'px';

        const lastActivity = this.props.activities[this.props.activities.length - 1];
        const lastActivityFromMe = lastActivity && this.props.isFromMe && this.props.isFromMe(lastActivity);

        // Validating if we are at the bottom of the list or the last activity was triggered by the user.
        if (this.scrollToBottom || lastActivityFromMe) {
            this.scrollMe.scrollTop = this.scrollMe.scrollHeight - this.scrollMe.offsetHeight;
        }
    }

    // In order to do their cool horizontal scrolling thing, Carousels need to know how wide they can be.
    // So, at startup, we create this mock Carousel activity and measure it.
    private measurableCarousel = () =>
        // find the largest possible message size by forcing a width larger than the chat itself
        <WrappedActivity
            ref={ x => this.carouselActivity = x }
            activity={ {
                type: 'message',
                id: '',
                from: { id: '' },
                attachmentLayout: 'carousel'
            } }
            format={ null }
            fromMe={ false }
            onClickActivity={ null }
            onClickRetry={ null }
            onClickInfo={ null }
            onClickRatingUp={ null }
            onClickRatingDown={ null }
            selected={ false }
            showTimestamp={ false }
        >
            <div style={ { width: this.largeWidth } }>&nbsp;</div>
        </WrappedActivity>;

    // At startup we do three render passes:
    // 1. To determine the dimensions of the chat panel (not much needs to actually render here)
    // 2. To determine the margins of any given carousel (we just render one mock activity so that we can measure it)
    // 3. (this is also the normal re-render case) To render without the mock activity

    private doCardAction(type: CardActionTypes, value: string | object) {
        this.props.onClickCardAction();
        this.props.onCardAction && this.props.onCardAction();
        return this.props.doCardAction(type, value);
    }

    render() {
        konsole.log("History props", this);
        let content;
        if (this.props.size.width !== undefined) {
            if (this.props.format.carouselMargin === undefined) {
                // For measuring carousels we need a width known to be larger than the chat itself
                this.largeWidth = this.props.size.width * 2;
                content = <this.measurableCarousel/>;
            } else {
                content = this.props.activities.reduce((out, activity) => {
                    if (activity.channelData && activity.channelData.streamId && activity.type === 'message') {
                        const firstStreamIndex = out.findIndex(a => a.channelData && a.channelData.streamId === activity.channelData.streamId)
                        const firstStreamActivity = out[firstStreamIndex]
                        if (firstStreamActivity && firstStreamActivity.type === 'message') {
                            firstStreamActivity.text = firstStreamActivity.text+' '+activity.text
                            return out
                        }
                    }
                    out.push(Object.assign({}, activity))
                    return out
                }, []).map((activity, index) =>
                    (activity.type !== 'message' || activity.text || (activity.attachments && activity.attachments.length)) &&
                        <WrappedActivity
                            format={ this.props.format }
                            key={ 'message' + index }
                            activity={ activity }
                            showTimestamp={ index === this.props.activities.length - 1 || (index + 1 < this.props.activities.length && suitableInterval(activity, this.props.activities[index + 1])) }
                            selected={ this.props.isSelected(activity) }
                            fromMe={ this.props.isFromMe(activity) }
                            onClickActivity={ this.props.onClickActivity(activity) }
                            onClickRetry={ e => {
                                // Since this is a click on an anchor, we need to stop it
                                // from trying to actually follow a (nonexistant) link
                                e.preventDefault();
                                e.stopPropagation();
                                this.props.onClickRetry(activity)
                            } }
                            onClickInfo={() => this.props.onCardInfo(activity)}
                            onClickCopy={() => (navigator as any).clipboard.writeText(activity.text)}
                            onClickRatingUp={callback => this.props.onCardRating(activity, 1, callback)}
                            onClickRatingDown={callback => this.props.onCardRating(activity, -1, callback)}
                        >
                            <ActivityView
                                format={ this.props.format }
                                size={ this.props.size }
                                activity={ activity }
                                onCardAction={ (type: CardActionTypes, value: string | object) => this.doCardAction(type, value) }
                                onImageLoad={ () => this.autoscroll() }
                                isLast={ index === this.props.activities.length - 1  }
                            />
                        </WrappedActivity>
                );
            }
        }

        const groupsClassName = classList('wc-message-groups', !this.props.format.chatTitle && 'no-header');

        return (
            <div
                className={ groupsClassName }
                ref={ div => this.scrollMe = div || this.scrollMe }
                role="log"
                tabIndex={ 0 }
            >
                <div className="wc-message-group-content" ref={ div => { if (div) this.scrollContent = div }}>
                    { content }
                </div>
            </div>
        );
    }
}

export const History = connect(
    (state: ChatState) => ({
        // passed down to HistoryView
        format: state.format,
        size: state.size,
        activities: state.history.activities,
        hasActivityWithSuggestedActions: !!activityWithSuggestedActions(state.history.activities),
        // only used to create helper functions below
        connectionSelectedActivity: state.connection.selectedActivity,
        selectedActivity: state.history.selectedActivity,
        botConnection: state.connection.botConnection,
        user: state.connection.user
    }), {
        setMeasurements: (carouselMargin: number) => ({ type: 'Set_Measurements', carouselMargin }),
        onClickRetry: (activity: Activity) => ({ type: 'Send_Message_Retry', clientActivityId: activity.channelData.clientActivityId }),
        onClickCardAction: () => ({ type: 'Card_Action_Clicked'}),
        // only used to create helper functions below
        sendMessage
    }, (stateProps: any, dispatchProps: any, ownProps: any): HistoryProps => ({
        // from stateProps
        format: stateProps.format,
        size: stateProps.size,
        activities: stateProps.activities,
        hasActivityWithSuggestedActions: stateProps.hasActivityWithSuggestedActions,
        // from dispatchProps
        setMeasurements: dispatchProps.setMeasurements,
        onClickRetry: dispatchProps.onClickRetry,
        onClickCardAction: dispatchProps.onClickCardAction,
        // helper functions
        doCardAction: doCardAction(stateProps.botConnection, stateProps.user, stateProps.format.locale, dispatchProps.sendMessage),
        isFromMe: (activity: Activity) => activity.from.id === stateProps.user.id,
        isSelected: (activity: Activity) => activity === stateProps.selectedActivity,
        onClickActivity: (activity: Activity) => stateProps.connectionSelectedActivity && (() => stateProps.connectionSelectedActivity.next({ activity })),
        onCardAction: ownProps.onCardAction,
        onCardRating: ownProps.onCardRating,
        onCardInfo: ownProps.onCardInfo
    }), {
        withRef: true
    }
)(HistoryView);

const getComputedStyleValues = (el: HTMLElement, stylePropertyNames: string[]) => {
    const s = window.getComputedStyle(el);
    const result: { [key: string]: number } = {};
    stylePropertyNames.forEach(name => result[name] = parseInt(s.getPropertyValue(name)));
    return result;
}

const measurePaddedHeight = (el: HTMLElement): number => {
    const paddingTop = 'padding-top', paddingBottom = 'padding-bottom';
    const values = getComputedStyleValues(el, [paddingTop, paddingBottom]);
    return el.offsetHeight - values[paddingTop] - values[paddingBottom];
}

const measurePaddedWidth = (el: HTMLElement): number => {
    const paddingLeft = 'padding-left', paddingRight = 'padding-right';
    const values = getComputedStyleValues(el, [paddingLeft, paddingRight]);
    return el.offsetWidth + values[paddingLeft] + values[paddingRight];
}

const suitableInterval = (current: Activity, next: Activity) =>
    Date.parse(next.timestamp) - Date.parse(current.timestamp) > 5 * 60 * 1000;

export interface WrappedActivityProps {
    activity: Activity,
    showTimestamp: boolean,
    selected: boolean,
    fromMe: boolean,
    format: FormatState,
    onClickActivity: React.MouseEventHandler<HTMLDivElement>,
    onClickRetry: React.MouseEventHandler<HTMLAnchorElement>,
    onClickRatingUp: (callback: (rated: boolean) => void) => boolean,
    onClickRatingDown: (callback: (rated: boolean) => void) => boolean,
    onClickInfo: () => void,
    onClickCopy?: () => void,
}

export class WrappedActivity extends React.Component<WrappedActivityProps, {ratingInProgress: boolean, rated: boolean}> {
    public messageDiv: HTMLDivElement;

    constructor(props: WrappedActivityProps) {
        super(props);
        this.state = {ratingInProgress: false, rated: false};
    }

    render () {
        let timeLine: JSX.Element;
        switch (this.props.activity.id) {
            case undefined:
                timeLine = <span>{ this.props.format.strings.messageSending }</span>;
                break;
            case null:
                timeLine = <span>{ this.props.format.strings.messageFailed }</span>;
                break;
            case "retry":
                timeLine =
                    <span>
                        { this.props.format.strings.messageFailed }
                        { ' ' }
                        <a href="." onClick={ this.props.onClickRetry }>{ this.props.format.strings.messageRetry }</a>
                    </span>;
                break;
            default:
                let sent: string;
                if (this.props.showTimestamp)
                    sent = this.props.format.strings.timeSent.replace('%1', (new Date(this.props.activity.timestamp)).toLocaleTimeString());
                timeLine = <span>{ this.props.activity.from.name || this.props.activity.from.id }{ sent }</span>;
                break;
        }

        const who = this.props.fromMe ? 'me' : 'bot';

        const wrapperClassName = classList(
            'wc-message-wrapper',
            (this.props.activity as Message).attachmentLayout || 'list',
            this.props.onClickActivity && 'clickable'
        );

        const contentClassName = classList(
            'wc-message-content',
            this.props.selected && 'selected',
            'wc-message-content-type-'+this.props.activity.type
        );

        return (
            <div data-activity-id={ this.props.activity.id } className={ wrapperClassName } onClick={ this.props.onClickActivity }>
                <div className={ 'wc-message wc-message-from-' + who + ' wc-message-type-' + this.props.activity.type } ref={ div => this.messageDiv = div }>
                    <div className={ contentClassName }>
                        <svg className="wc-message-callout">
                            <path className="point-left" d="m0,6 l6 6 v-12 z" />
                            <path className="point-right" d="m6,6 l-6 6 v-12 z" />
                        </svg>
                        { this.props.children }
                    </div>
                    {this.props.activity.channelData && this.props.activity.channelData.queryId && !this.props.fromMe && this.props.activity.type === 'message' && <div className={'wc-message-buttons' + (this.state.ratingInProgress ? ' wc-rating-in-progress' : '') }>
                        {<div onClick={() => Swal.fire({icon: "question", text: this.props.format.strings.aiMessageTitle})} title={this.props.format.strings.aiMessageTitle} className='wc-message-button-ai'><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-304 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224l16 0 0 192-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0 0-192 16 0z"/></svg></div>}
                        {<div onClick={() => this.props.onClickCopy()} className='wc-message-button-copy'><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M208 0L332.1 0c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9L448 336c0 26.5-21.5 48-48 48l-192 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48zM48 128l80 0 0 64-64 0 0 256 192 0 0-32 64 0 0 48c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 176c0-26.5 21.5-48 48-48z"/></svg></div>}
                        {location.search.endsWith('?developer') && this.props.activity.channelData.info && <div onClick={this.props.onClickInfo} className='wc-message-button-info'><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg></div>}
                        {this.props.activity.channelData.queryId && !this.state.rated && <div onClick={() => !this.state.ratingInProgress && this.props.onClickRatingUp(rated => this.setState({rated}))} className='wc-message-button-vote-up'><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2l144 0c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48l-97.5 0c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3l0-38.3 0-48 0-24.9c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192l64 0c17.7 0 32 14.3 32 32l0 224c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32L0 224c0-17.7 14.3-32 32-32z"/></svg></div>}
                        {this.props.activity.channelData.queryId && !this.state.rated && <div onClick={() => !this.state.ratingInProgress && this.props.onClickRatingDown(rated => this.setState({rated}))} className='wc-message-button-vote-down'><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M313.4 479.1c26-5.2 42.9-30.5 37.7-56.5l-2.3-11.4c-5.3-26.7-15.1-52.1-28.8-75.2l144 0c26.5 0 48-21.5 48-48c0-18.5-10.5-34.6-25.9-42.6C497 236.6 504 223.1 504 208c0-23.4-16.8-42.9-38.9-47.1c4.4-7.3 6.9-15.8 6.9-24.9c0-21.3-13.9-39.4-33.1-45.6c.7-3.3 1.1-6.8 1.1-10.4c0-26.5-21.5-48-48-48l-97.5 0c-19 0-37.5 5.6-53.3 16.1L202.7 73.8C176 91.6 160 121.6 160 153.7l0 38.3 0 48 0 24.9c0 29.2 13.3 56.7 36 75l7.4 5.9c26.5 21.2 44.6 51 51.2 84.2l2.3 11.4c5.2 26 30.5 42.9 56.5 37.7zM32 384l64 0c17.7 0 32-14.3 32-32l0-224c0-17.7-14.3-32-32-32L32 96C14.3 96 0 110.3 0 128L0 352c0 17.7 14.3 32 32 32z"/></svg></div>}
                    </div>}
                </div>
                <div className={ 'wc-message-from wc-message-from-' + who }>{ timeLine }</div>
            </div>
        );
    }
}