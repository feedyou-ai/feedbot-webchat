import * as React from 'react';
import { ChatState, FormatState } from './Store';
import { User } from 'botframework-directlinejs';
import { classList } from './Chat';
import { Dispatch, connect } from 'react-redux';
import { Strings } from './Strings';
import { Speech } from './SpeechModule'
import { ChatActions, ListeningState, sendMessage, sendFiles, sendScreenshot } from './Store';

import * as html2canvas from 'html2canvas'

interface Props {
    inputText: string,
    strings: Strings,
    listeningState: ListeningState,
    showUploadButton: boolean,
    uploadCapture: 'image/*' | 'video/*' | 'audio/*' | string,
    disableInput: boolean

    onChangeText: (inputText: string) => void

    sendMessage: (inputText: string) => void,
    sendFiles: (files: FileList) => void,
    sendScreenshot: (screen: string) => void,
    stopListening: () => void,
    startListening: () => void
}

export interface ShellFunctions {
    focus: (appendKey?: string) => void
}

class ShellContainer extends React.Component<Props> implements ShellFunctions {
    private textInput: HTMLTextAreaElement;
    private fileInput: HTMLInputElement;

    componentDidUpdate(prevProps: Props) {
        if (prevProps.disableInput === true && this.props.disableInput === false) {
            this.textInput.focus();
        }
    }

    private sendMessage() {
        if (this.props.inputText.trim().length > 0) {
            this.props.sendMessage(this.props.inputText);
        }
    }

    private handleSendButtonKeyPress(evt: React.KeyboardEvent<HTMLButtonElement>) {
        if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            this.sendMessage();
            this.textInput.focus();
        }
    }

    private handleUploadButtonKeyPress(evt: React.KeyboardEvent<HTMLLabelElement>) {
        if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            this.fileInput.click();
        }
    }

    private onKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            this.sendMessage();
            e.stopPropagation()
            e.preventDefault()
        }
    }

    private onClickSend() {
        this.sendMessage();
    }

    private onChangeFile() {
        this.props.sendFiles(this.fileInput.files);
        this.fileInput.value = null;
        this.textInput.focus();
    }

    private onTextInputFocus() {
        if (this.props.listeningState === ListeningState.STARTED) {
            this.props.stopListening();
        }
    }

    private onClickMic() {
        if (this.props.listeningState === ListeningState.STARTED) {
            this.props.stopListening();
        } else if (this.props.listeningState === ListeningState.STOPPED) {
            this.props.startListening();
        }
    }

    public focus(appendKey?: string) {
        this.textInput.focus();

        if (appendKey) {
            this.props.onChangeText(this.props.inputText + appendKey);
        }
    }

    private async takeScreenshot() {
        const screen = await html2canvas(document.body, { allowTaint: true, useCORS: true }).then((canvas) => {
            const dataURI = canvas.toDataURL("image/png");

            return dataURI
        })
        this.props.sendScreenshot(screen);
    }

    render() {
        const className = classList(
            'wc-console',
            this.props.inputText.length > 0 && 'has-text',
            this.props.showUploadButton && 'has-upload-button',
            this.props.disableInput && 'disable-input'
        );

        const showMicButton = this.props.listeningState !== ListeningState.STOPPED || (Speech.SpeechRecognizer.speechIsAvailable() && !this.props.inputText.length);

        const sendButtonClassName = classList(
            'wc-send',
            showMicButton && 'hidden'
        );

        const micButtonClassName = classList(
            'wc-mic',
            !showMicButton && 'hidden',
            this.props.listeningState === ListeningState.STARTED && 'active',
            this.props.listeningState !== ListeningState.STARTED && 'inactive'
        );

        const placeholder = this.props.listeningState === ListeningState.STARTED ? this.props.strings.listeningIndicator : this.props.strings.consolePlaceholder;

        return (
            <div className={className}>
                {
                    this.props.showUploadButton &&
                    <label
                        className="wc-upload"
                        htmlFor="wc-upload-input"
                        onKeyPress={evt => this.handleUploadButtonKeyPress(evt)}
                        tabIndex={0}
                    >
                        <svg>
							<path d='M0.850098 3.99961C0.850098 2.25991 2.2604 0.849609 4.0001 0.849609H10.0001C10.199 0.849609 10.3898 0.928627 10.5304 1.06928L16.5304 7.06928C16.6711 7.20993 16.7501 7.4007 16.7501 7.59961V15.9996C16.7501 17.7393 15.3398 19.1496 13.6001 19.1496H4.0001C2.2604 19.1496 0.850098 17.7393 0.850098 15.9996V3.99961ZM4.0001 2.34961C3.08883 2.34961 2.3501 3.08834 2.3501 3.99961V15.9996C2.3501 16.9109 3.08883 17.6496 4.0001 17.6496H13.6001C14.5114 17.6496 15.2501 16.9109 15.2501 15.9996V7.91027L9.68944 2.34961H4.0001Z' />
							<path d='M10 0.849609C10.4142 0.849609 10.75 1.1854 10.75 1.59961V5.19961C10.75 6.11088 11.4887 6.84961 12.4 6.84961H16C16.4142 6.84961 16.75 7.1854 16.75 7.59961C16.75 8.01382 16.4142 8.34961 16 8.34961H12.4C10.6603 8.34961 9.25 6.93931 9.25 5.19961V1.59961C9.25 1.1854 9.58579 0.849609 10 0.849609Z' />
						</svg>
                    </label>
                }
                {
                    this.props.showUploadButton &&
                    <input
                        id="wc-upload-input"
                        tabIndex={-1}
                        type="file"
                        ref={input => this.fileInput = input}
                        // multiple
                        onChange={() => this.onChangeFile()}
                        aria-label={this.props.strings.uploadFile}
                        role="button"
                        capture={!!this.props.uploadCapture}
                        accept={this.props.uploadCapture}
                    />
                }
                {
                    this.props.showUploadButton &&
                    <button className="wc-upload-screenshot" onClick={() => { this.takeScreenshot() }}><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="camera" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#8a8a8a" d="M512 144v288c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h88l12.3-32.9c7-18.7 24.9-31.1 44.9-31.1h125.5c20 0 37.9 12.4 44.9 31.1L376 96h88c26.5 0 48 21.5 48 48zM376 288c0-66.2-53.8-120-120-120s-120 53.8-120 120 53.8 120 120 120 120-53.8 120-120zm-32 0c0 48.5-39.5 88-88 88s-88-39.5-88-88 39.5-88 88-88 88 39.5 88 88z"></path></svg></button>
                }
                <div className="wc-textbox">
                    <textarea
                        className="wc-shellinput"
                        ref={input => this.textInput = input}
                        autoFocus
                        value={this.props.inputText}
                        onChange={_ => this.props.onChangeText(this.textInput.value)}
                        onKeyPress={e => this.onKeyPress(e)}
                        onFocus={() => this.onTextInputFocus()}
                        placeholder={placeholder}
                        disabled={this.props.disableInput}
                        aria-label={this.props.inputText ? null : placeholder}
                        aria-live="polite"
                    ></textarea>
                </div>
                <button
                    className={sendButtonClassName}
                    onClick={() => this.onClickSend()}
                    aria-label={this.props.strings.send}
                    role="button"
                    onKeyPress={evt => this.handleSendButtonKeyPress(evt)}
                    tabIndex={0}
                    type="button"
                >
                    <svg>
						<path d='M3.03792 2.33702C2.89522 2.26748 2.73411 2.245 2.57777 2.27287C2.42024 2.30095 2.27582 2.37868 2.16561 2.49469C2.05541 2.61071 1.9852 2.75893 1.96524 2.91769C1.9458 3.0723 1.97502 3.22902 2.04866 3.36612L7.09739 11.601C7.24476 11.8414 7.24487 12.1441 7.09769 12.3845L2.04877 20.6337C1.97505 20.7708 1.94579 20.9276 1.96524 21.0823C1.9852 21.2411 2.05541 21.3893 2.16561 21.5053C2.27582 21.6213 2.42024 21.6991 2.57777 21.7271C2.73406 21.755 2.89513 21.7325 3.03779 21.6631L22.047 11.9935L3.03792 2.33702ZM2.31455 0.796147C2.78714 0.711908 3.27429 0.781026 3.7048 0.9934L3.7127 0.997297L22.7267 10.6563C22.9734 10.7818 23.1809 10.9733 23.3257 11.2093C23.4704 11.4453 23.547 11.7167 23.547 11.9935C23.547 12.2703 23.4704 12.5417 23.3257 12.7777C23.1809 13.0137 22.9738 13.205 22.727 13.3305C22.727 13.3305 22.7271 13.3305 22.727 13.3305L3.70482 23.0067C3.27432 23.219 2.78714 23.2881 2.31455 23.2039C1.84196 23.1196 1.40869 22.8865 1.07808 22.5384C0.74746 22.1904 0.536825 21.7457 0.476953 21.2694C0.41708 20.7931 0.51111 20.3102 0.7453 19.8911C0.750131 19.8825 0.755132 19.8739 0.760301 19.8655L5.57846 11.9933L0.760597 4.13502C0.755323 4.12642 0.750223 4.11771 0.7453 4.1089C0.51111 3.68986 0.41708 3.2069 0.476953 2.73061C0.536825 2.25431 0.747461 1.80965 1.07808 1.46161C1.40869 1.11357 1.84196 0.880386 2.31455 0.796147Z' />
						<path d='M5.70299 11.993C5.70299 11.5788 6.03877 11.243 6.45299 11.243H22.797C23.2112 11.243 23.547 11.5788 23.547 11.993C23.547 12.4072 23.2112 12.743 22.797 12.743H6.45299C6.03877 12.743 5.70299 12.4072 5.70299 11.993Z' />
					</svg>
                </button>
                <button
                    className={micButtonClassName}
                    onClick={() => this.onClickMic()}
                    aria-label={this.props.strings.speak}
                    role="button"
                    tabIndex={0}
                    type="button"
                >
                    <svg width="28" height="22" viewBox="0 0 58 58" >
                        <path d="M 44 28 C 43.448 28 43 28.447 43 29 L 43 35 C 43 42.72 36.72 49 29 49 C 21.28 49 15 42.72 15 35 L 15 29 C 15 28.447 14.552 28 14 28 C 13.448 28 13 28.447 13 29 L 13 35 C 13 43.485 19.644 50.429 28 50.949 L 28 56 L 23 56 C 22.448 56 22 56.447 22 57 C 22 57.553 22.448 58 23 58 L 35 58 C 35.552 58 36 57.553 36 57 C 36 56.447 35.552 56 35 56 L 30 56 L 30 50.949 C 38.356 50.429 45 43.484 45 35 L 45 29 C 45 28.447 44.552 28 44 28 Z" />
                        <path id="micFilling" d="M 28.97 44.438 L 28.97 44.438 C 23.773 44.438 19.521 40.033 19.521 34.649 L 19.521 11.156 C 19.521 5.772 23.773 1.368 28.97 1.368 L 28.97 1.368 C 34.166 1.368 38.418 5.772 38.418 11.156 L 38.418 34.649 C 38.418 40.033 34.166 44.438 28.97 44.438 Z" />
                        <path d="M 29 46 C 35.065 46 40 41.065 40 35 L 40 11 C 40 4.935 35.065 0 29 0 C 22.935 0 18 4.935 18 11 L 18 35 C 18 41.065 22.935 46 29 46 Z M 20 11 C 20 6.037 24.038 2 29 2 C 33.962 2 38 6.037 38 11 L 38 35 C 38 39.963 33.962 44 29 44 C 24.038 44 20 39.963 20 35 L 20 11 Z" />
                    </svg>
                </button>
            </div>
        );
    }
}

export const Shell = connect(
    (state: ChatState) => ({
        // passed down to ShellContainer
        inputText: state.shell.input,
        showUploadButton: state.format.showUploadButton,
        uploadCapture: state.format.uploadCapture,
        disableInput: state.format.disableInput,
        strings: state.format.strings,
        // only used to create helper functions below
        locale: state.format.locale,
        user: state.connection.user,
        listeningState: state.shell.listeningState
    }), {
    // passed down to ShellContainer
    onChangeText: (input: string) => ({ type: 'Update_Input', input, source: "text" } as ChatActions),
    stopListening: () => ({ type: 'Listening_Stopping' }),
    startListening: () => ({ type: 'Listening_Starting' }),
    // only used to create helper functions below
    sendMessage,
    sendFiles,
    sendScreenshot
}, (stateProps: any, dispatchProps: any, ownProps: any): Props => ({
    // from stateProps
    inputText: stateProps.inputText,
    showUploadButton: stateProps.showUploadButton,
    uploadCapture: stateProps.uploadCapture,
    disableInput: stateProps.disableInput,
    strings: stateProps.strings,
    listeningState: stateProps.listeningState,
    // from dispatchProps
    onChangeText: dispatchProps.onChangeText,
    // helper functions
    sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
    sendFiles: (files: FileList) => dispatchProps.sendFiles(files, stateProps.user, stateProps.locale),
    sendScreenshot: (screen: string) => dispatchProps.sendScreenshot(screen, stateProps.user, stateProps.locale),
    startListening: () => dispatchProps.startListening(),
    stopListening: () => dispatchProps.stopListening()
}), {
    withRef: true
}
)(ShellContainer);