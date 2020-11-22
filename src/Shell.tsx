import * as React from 'react';
import { ChatState, FormatState } from './Store';
import { User } from 'botframework-directlinejs';
import { classList } from './Chat';
import { Dispatch, connect } from 'react-redux';
import { Strings } from './Strings';
import { Speech } from './SpeechModule'
import { ChatActions, ListeningState, sendMessage, sendFiles } from './Store';
import * as QRCode from 'qrcode'

import { StyledDropZone } from 'react-drop-zone'

interface Props {
    inputText: string,
    strings: Strings,
    listeningState: ListeningState,
    showUploadButton: boolean,
    attachmentUrl: string,
    uploadUsingQrCodeOnly: boolean,
    disableInput: boolean

    onChangeText: (inputText: string) => void

    sendMessage: (inputText: string) => void,
    sendFiles: (files: any) => void,
    stopListening: () => void,
    startListening: () => void
}

interface State {
    attachmentQrCode: string
}

export interface ShellFunctions {
    focus: (appendKey?: string) => void
}

class ShellContainer extends React.Component<Props, State> implements ShellFunctions {
    private textInput: HTMLInputElement;
    private fileInput: HTMLInputElement;
    private addFileTimeout: any

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

    componentDidUpdate() {
        if (this.props.attachmentUrl && (!this.state)) {
            QRCode.toDataURL(this.props.attachmentUrl, {
                color: {
                dark: '#000',
                light: '#0000' // transparent
                }
            }).then((attachmentQrCode:string) => this.setState({attachmentQrCode}))
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

    private onKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            this.sendMessage();
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

    private onTextInputFocus(){
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

    addFile(file: any) {
        // onDrop called multiple times, need to debounce
        clearTimeout(this.addFileTimeout)
        this.addFileTimeout = setTimeout(() => {
            console.log('addFile timeout')
            this.props.sendFiles([file])
        }, 75)
    }

    render() {
        const className = classList(
            'wc-console',
            this.props.inputText.length > 0 && 'has-text',
            this.props.showUploadButton && 'has-upload-button',
            this.props.disableInput && 'disable-input'
        );

        const showMicButton = this.props.listeningState !== ListeningState.STOPPED || (Speech.SpeechRecognizer.speechIsAvailable()  && !this.props.inputText.length);

        const sendButtonClassName = classList(
            'wc-send',
            showMicButton || (this.props.showUploadButton && this.props.disableInput) && 'hidden'
        );

        const micButtonClassName = classList(
            'wc-mic',
            !showMicButton && 'hidden',
            this.props.listeningState === ListeningState.STARTED && 'active',
            this.props.listeningState !== ListeningState.STARTED && 'inactive'
        );

        const placeholder = this.props.listeningState === ListeningState.STARTED ? this.props.strings.listeningIndicator : this.props.strings.consolePlaceholder;
        
        const localAndQrAttachment = [
            <StyledDropZone key="a" label={this.props.strings.attachmentDropArea} onDrop={(file:any) => this.addFile(file) } />,
            <div key="b" className="attachment-wrapper">
                <span className="attachment-url">{this.props.strings.attachmentInfo}</span>
                <a href="#" onClick={() => alert(this.props.strings.attachmentAlert + '\n\n'+this.props.attachmentUrl)}><img src={this.state && this.state.attachmentQrCode} /></a>
            </div>
        ]

        const qrOnlyAttachment = [
            <div key="b" className="attachment-wrapper qr-only">
                <span className="attachment-url">{this.props.strings.attachmentInfoQrOnly}<br /><span>{this.props.attachmentUrl}</span></span>
                <a href="#" onClick={() => alert(this.props.strings.attachmentAlert + '\n\n'+this.props.attachmentUrl)}><img src={this.state && this.state.attachmentQrCode} /></a>
            </div>
        ]
        
        return (
            <div className={ className }>
                {
                    this.props.showUploadButton && (this.props.uploadUsingQrCodeOnly ? qrOnlyAttachment : localAndQrAttachment)
                }
                {
                    this.props.showUploadButton &&
                        <input
                            id="wc-upload-input"
                            tabIndex={ -1 }
                            type="file"
                            ref={ input => this.fileInput = input }
                            // multiple
                            onChange={ () => this.onChangeFile() }
                            aria-label={ this.props.strings.uploadFile }
                            role="button"
                        />
                }
                <div className="wc-textbox">
                    <input
                        type="text"
                        className="wc-shellinput"
                        ref={ input => this.textInput = input }
                        autoFocus
                        value={ this.props.inputText }
                        onChange={ _ => this.props.onChangeText(this.textInput.value) }
                        onKeyPress={ e => this.onKeyPress(e) }
                        onFocus={ () => this.onTextInputFocus() }
                        placeholder={ placeholder }
                        disabled={ this.props.disableInput }
                        aria-label={ this.props.inputText ? null : placeholder }
                        aria-live="polite"
                    />
                </div>
                <button
                    className={ sendButtonClassName }
                    onClick={ () => this.onClickSend() }
                    aria-label={ this.props.strings.send }
                    role="button"
                    onKeyPress={ evt => this.handleSendButtonKeyPress(evt) }
                    tabIndex={ 0 }
                    type="button"
                >
                    <svg>
                        <path d="M26.79 9.38A0.31 0.31 0 0 0 26.79 8.79L0.41 0.02C0.36 0 0.34 0 0.32 0 0.14 0 0 0.13 0 0.29 0 0.33 0.01 0.37 0.03 0.41L3.44 9.08 0.03 17.76A0.29 0.29 0 0 0 0.01 17.8 0.28 0.28 0 0 0 0.01 17.86C0.01 18.02 0.14 18.16 0.3 18.16A0.3 0.3 0 0 0 0.41 18.14L26.79 9.38ZM0.81 0.79L24.84 8.79 3.98 8.79 0.81 0.79ZM3.98 9.37L24.84 9.37 0.81 17.37 3.98 9.37Z" />
                    </svg>
                </button>
                <button
                    className={ micButtonClassName }
                    onClick={ () => this.onClickMic() }
                    aria-label={ this.props.strings.speak }
                    role="button"
                    tabIndex={ 0 }
                    type="button"
                >
                   <svg width="28" height="22" viewBox="0 0 58 58" >
                        <path d="M 44 28 C 43.448 28 43 28.447 43 29 L 43 35 C 43 42.72 36.72 49 29 49 C 21.28 49 15 42.72 15 35 L 15 29 C 15 28.447 14.552 28 14 28 C 13.448 28 13 28.447 13 29 L 13 35 C 13 43.485 19.644 50.429 28 50.949 L 28 56 L 23 56 C 22.448 56 22 56.447 22 57 C 22 57.553 22.448 58 23 58 L 35 58 C 35.552 58 36 57.553 36 57 C 36 56.447 35.552 56 35 56 L 30 56 L 30 50.949 C 38.356 50.429 45 43.484 45 35 L 45 29 C 45 28.447 44.552 28 44 28 Z"/>
                        <path id="micFilling" d="M 28.97 44.438 L 28.97 44.438 C 23.773 44.438 19.521 40.033 19.521 34.649 L 19.521 11.156 C 19.521 5.772 23.773 1.368 28.97 1.368 L 28.97 1.368 C 34.166 1.368 38.418 5.772 38.418 11.156 L 38.418 34.649 C 38.418 40.033 34.166 44.438 28.97 44.438 Z"/>
                        <path d="M 29 46 C 35.065 46 40 41.065 40 35 L 40 11 C 40 4.935 35.065 0 29 0 C 22.935 0 18 4.935 18 11 L 18 35 C 18 41.065 22.935 46 29 46 Z M 20 11 C 20 6.037 24.038 2 29 2 C 33.962 2 38 6.037 38 11 L 38 35 C 38 39.963 33.962 44 29 44 C 24.038 44 20 39.963 20 35 L 20 11 Z"/>
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
        attachmentUrl:state.format.attachmentUrl,
        disableInput: state.format.disableInput,
        uploadUsingQrCodeOnly: state.format.uploadUsingQrCodeOnly,
        strings: state.format.strings,
        // only used to create helper functions below
        locale: state.format.locale,
        user: state.connection.user,
        listeningState: state.shell.listeningState
    }), {
        // passed down to ShellContainer
        onChangeText: (input: string) => ({ type: 'Update_Input', input, source: "text" } as ChatActions),
        stopListening:  () => ({ type: 'Listening_Stopping' }),
        startListening:  () => ({ type: 'Listening_Starting' }),
        // only used to create helper functions below
        sendMessage,
        sendFiles
    }, (stateProps: any, dispatchProps: any, ownProps: any): Props => ({
        // from stateProps
        inputText: stateProps.inputText,
        showUploadButton: stateProps.showUploadButton,
        attachmentUrl: stateProps.attachmentUrl,
        disableInput: stateProps.disableInput,
        uploadUsingQrCodeOnly: stateProps.uploadUsingQrCodeOnly,
        strings: stateProps.strings,
        listeningState: stateProps.listeningState,
        // from dispatchProps
        onChangeText: dispatchProps.onChangeText,
        // helper functions
        sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
        sendFiles: (files: FileList) => dispatchProps.sendFiles(files, stateProps.user, stateProps.locale),
        startListening: () => dispatchProps.startListening(),
        stopListening: () => dispatchProps.stopListening()
    }), {
        withRef: true
    }
)(ShellContainer);
