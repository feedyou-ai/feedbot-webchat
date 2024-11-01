import * as React from 'react';
import { ChatState} from './Store';
import { classList } from './Chat';
import { connect } from 'react-redux';
import { Strings } from './Strings';
import { Speech } from './SpeechModule'
import { ChatActions, ListeningState, sendMessage, sendFiles, sendScreenshot } from './Store';

import * as html2canvas from 'html2canvas'
import {debounce} from "debounce";
import Downshift from "downshift";
import fuzzysort =  require('fuzzysort');

interface Props {
    botId: string
    inputText: string,
    strings: Strings,
    listeningState: ListeningState,
    showUploadButton: boolean,
    showAutoSuggest: boolean;
    autoSuggestType: string;
    autoSuggestItems: string[];
    autoSuggestCountry: string;
    autoSuggestSource: string;
    attachmentUrl: string,
    uploadCapture: 'image/*' | 'video/*' | 'audio/*' | string,
    disableInput: boolean

    onChangeText: (inputText: string) => void

    sendMessage: (inputText: string) => void,
    sendFiles: (files: FileList) => void,
    sendScreenshot: (screen: string) => void,
    stopListening: () => void,
    startListening: () => void
}

interface State {
    attachmentQrCode: string;
    items: any[];
    lastAutosuggestSelection: string
  }

export interface ShellFunctions {
    focus: (appendKey?: string) => void
}

class ShellContainer extends React.Component<Props, State> implements ShellFunctions {
    private textInput: HTMLTextAreaElement | HTMLInputElement;
    private fileInput: HTMLInputElement;

    constructor(props: Props) {
        super(props);
  
        this.state = { attachmentQrCode: "", items: this.props.autoSuggestItems, lastAutosuggestSelection:"" };
      }
  
      private sendMessage(forceText?: string) {
          if ((forceText || "").trim().length > 0 || this.props.inputText.trim().length > 0) {
              this.props.sendMessage((forceText || "").trim() || this.props.inputText);
          }
      }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.disableInput === true && this.props.disableInput === false) {
            this.textInput.focus();
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

    private onKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            this.sendMessage();
            e.stopPropagation()
            e.preventDefault()
        }
    }

    debounceCall = debounce(async (queryString: string, type: string, param: string) => {
        const replacedQueryString = queryString
          .normalize("NFKD")
          .replace(/[^\w]/g, "");
          
        const action = type === "repository" ? "autosuggest-repository" : "autosuggest";
        // use replaced query string with old autosuggest
        const useReplacedQueryString = action === "autosuggest"
        const query = useReplacedQueryString ? replacedQueryString : encodeURIComponent(queryString)

        const res = await fetch(
          `https://${this.props.botId}.azurewebsites.net/webchat/${action}/${query}/${param}`
        );
        const data = await res.json();
  
        this.setState({
          items: data.value.map((item: any) => ({
            answer: item && item.terms && item.terms[0] && item.terms[0].value ? item.terms[0].value : item,
          })),
        });
  
      }, 500);
  
      private autoSuggestOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (this.props.autoSuggestType === "google-city") {
          this.debounceCall(e.currentTarget.value, this.props.autoSuggestType, this.props.autoSuggestCountry);
        }
        if(this.props.autoSuggestType === "repository") {
          this.debounceCall(e.currentTarget.value, this.props.autoSuggestType, this.props.autoSuggestSource)
        }
      };

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
                            <path d="M19.96 4.79m-2 0a2 2 0 0 1 4 0 2 2 0 0 1-4 0zM8.32 4.19L2.5 15.53 22.45 15.53 17.46 8.56 14.42 11.18 8.32 4.19ZM1.04 1L1.04 17 24.96 17 24.96 1 1.04 1ZM1.03 0L24.96 0C25.54 0 26 0.45 26 0.99L26 17.01C26 17.55 25.53 18 24.96 18L1.03 18C0.46 18 0 17.55 0 17.01L0 0.99C0 0.45 0.47 0 1.03 0Z" />
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

{this.props.showAutoSuggest ? (
          <Downshift
            onChange={async (selection) => {
              this.sendMessage(selection)
              return 
            }}
            onInputValueChange={(inputValue) => {
                if(this.props.autoSuggestType === "static") {
                    return
                }
                this.props.onChangeText(inputValue)
                return
            }}
            inputValue={this.props.inputText}
            itemToString={(item) => {
              return item ? item : "";
            }}
          >
            {({
              getInputProps,
              getItemProps,
              getMenuProps,
              isOpen,
              inputValue,
              highlightedIndex,
              selectedItem,
              getRootProps,
            }) => (
              <div
                className="wc-textbox"
                {...getRootProps({ refKey: "" }, { suppressRefError: true })}
              >
                <input
                  type="text"
                  className="wc-shellinput"
                  ref={(input) => (this.textInput = input)}
                  autoFocus
                  value={inputValue}
                  onBlur={async () => {
                    if(this.props.autoSuggestType === "static") {
                      return this.props.onChangeText("");
                    }
                  }}
                  onKeyPress={(e) => {
                    this.onKeyPress(e);
                  }}
                  onKeyUp={this.autoSuggestOnKeyUp}
                  onFocus={() => this.onTextInputFocus()}
                  placeholder={placeholder}
                  disabled={this.props.disableInput}
                  aria-label={this.props.inputText ? null : placeholder}
                  aria-live="polite"
                  {...getInputProps()}
                />
                <ul
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 13,
                    minWidth: 200,
                    borderTopLeftRadius: "13px",
                    borderTopRightRadius: "13px",
                    padding: 0,
                    overflow: "hidden",
                    backgroundColor: "#eceff1",
                  }}
                  {...getMenuProps()}
                >
                  {isOpen
                    ? Array.from(fuzzysort.go(inputValue, (this.props.autoSuggestItems.length > 0
                        ? this.props.autoSuggestItems 
                        : this.state.items), {keys: ["answer"], limit: 10}))
                      .reverse()
                      .map((item: any, index: number) => {
                          return <li
                            {...getItemProps({
                              key: item.obj.answer,
                              index,
                              item: item.obj.answer,
                              style: {
                                backgroundColor:
                                  highlightedIndex === index
                                    ? "lightgray"
                                    : "transparent",
                                fontWeight:
                                  selectedItem === item ? "bold" : "normal",
                                padding: "10px",
                              },
                            })}
                          >
                            {item.obj.answer}
                          </li>
                        })
                    : null}
                </ul>
              </div>
            )}
          </Downshift>

        ) : ( <div className="wc-textbox">
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
    </div> )}
                
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
                        <path d="M26.79 9.38A0.31 0.31 0 0 0 26.79 8.79L0.41 0.02C0.36 0 0.34 0 0.32 0 0.14 0 0 0.13 0 0.29 0 0.33 0.01 0.37 0.03 0.41L3.44 9.08 0.03 17.76A0.29 0.29 0 0 0 0.01 17.8 0.28 0.28 0 0 0 0.01 17.86C0.01 18.02 0.14 18.16 0.3 18.16A0.3 0.3 0 0 0 0.41 18.14L26.79 9.38ZM0.81 0.79L24.84 8.79 3.98 8.79 0.81 0.79ZM3.98 9.37L24.84 9.37 0.81 17.37 3.98 9.37Z" />
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
    (state: ChatState) => {
      return {
        // passed down to ShellContainer
        botId: state.connection.bot ? state.connection.bot.id : "",
        inputText: state.shell.input,
        showUploadButton: state.format.showUploadButton,
        attachmentUrl: state.format.attachmentUrl,
        showAutoSuggest: state.format.showAutoSuggest,
        autoSuggestType: state.format.autoSuggestType,
        autoSuggestItems: state.format.autoSuggestItems,
        autoSuggestCountry: state.format.autoSuggestCountry,
        autoSuggestSource: state.format.autoSuggestSource,
        uploadCapture: state.format.uploadCapture,
        disableInput: state.format.disableInput,
        strings: state.format.strings,
        // only used to create helper functions below
        locale: state.format.locale,
        user: state.connection.user,
        listeningState: state.shell.listeningState
    }}, {
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
    botId: stateProps.botId,
    inputText: stateProps.inputText,
    showUploadButton: stateProps.showUploadButton,
    attachmentUrl: stateProps.attachmentUrl,
    showAutoSuggest: stateProps.showAutoSuggest,
    autoSuggestType: stateProps.autoSuggestType,
    autoSuggestItems: stateProps.autoSuggestItems,
    autoSuggestCountry: stateProps.autoSuggestCountry,
    autoSuggestSource: stateProps.autoSuggestSource,
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
