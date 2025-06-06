import * as React from 'react'
import { AppProps } from '../App'
import { Chat } from '../../Chat'
import { appendScriptToBody } from '../../utils/appendScriptToBody'

export type Props = AppProps

export class AssistantTemplate extends React.Component<
    Props,
    { introMode: boolean; inputValue: string; darkMode: boolean }
> {
    constructor(props: Props) {
        super(props)
        this.state = {
            introMode: true,
            inputValue: '',
            darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        }
    }

    componentDidMount() {
        this.appendCustomScript()
    }

    appendCustomScript = () => {
        const { theme } = this.props
        const customScript = theme && theme.template && theme.template.customScript

        if (customScript) {
            appendScriptToBody(customScript)
        }
    }

    handleExampleQueryClick = (query: string) => {
        this.setState({ inputValue: query }, () => {
            const inputElement = document.getElementById('chat-input') as HTMLTextAreaElement
            if (inputElement) {
                inputElement.focus()
                inputElement.setSelectionRange(query.length, query.length)
            }
        })
    }

    handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ inputValue: event.target.value })
    }

    handleInputKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && this.state.inputValue.trim() !== '') {
            const message = this.state.inputValue.trim()

            this.setState({ introMode: false })
        }
    }

    toggleDarkMode = () => {
        this.setState((prevState) => ({ darkMode: !prevState.darkMode }))
    }

    renderIntroSection() {
        const { theme } = this.props
        const welcomeTitle = (theme && theme.template && theme.template.welcomeTitle) || 'Welcome to the chatbot!'
        const exampleQueries = (theme && theme.template && theme.template.exampleQueries) || []
        const isSendDisabled = this.state.inputValue.trim() === ''

        return (
            <div className="intro-section">
                <h1 className="intro-title">{welcomeTitle}</h1>
                <div className="card">
                    <textarea
                        id="chat-input"
                        className="chat-input"
                        placeholder="Type your message..."
                        value={this.state.inputValue}
                        onChange={this.handleInputChange}
                        onKeyPress={this.handleInputKeyPress}
                        rows={5}
                        autoFocus
                    />
                    <button
                        className={`send-button ${isSendDisabled ? 'disabled' : 'active'}`}
                        onClick={() => {
                            if (!isSendDisabled) {
                                this.setState({ introMode: false })
                            }
                        }}
                        disabled={isSendDisabled}
                    >
                        <svg width="22" height="22" viewBox="-2 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
                <div className="example-queries">
                    {exampleQueries.map((query, index) => (
                        <div
                            key={index}
                            className="example-query"
                            onClick={() => this.handleExampleQueryClick(query)}
                        >
                            {query}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    render() {
        const { theme } = this.props
        const logoSrc =
            (theme && theme.template && theme.template.logoUrl) ||
            'https://cdn.feedyou.ai/webchat/feedyou_logo_red.png'

        return (
            <div
                className={`feedbot-wrapper ${this.state.darkMode ? 'dark-mode' : ''}`}
                data-html2canvas-ignore=""
            >
                <div className="feedbot-logo" onClick={() => location.reload()}>
                    <img alt="Logo" src={logoSrc} />
                </div>

                <button className="dark-mode-toggle" onClick={this.toggleDarkMode}>
                    <span className='dark-mode-title'>{this.state.darkMode ? 'Light mode' : 'Dark mode'}</span> <span className='dark-mode-icon'> {this.state.darkMode ?"☀️" : "🌙"}</span>
                </button>

                {this.state.introMode ? (
                    this.renderIntroSection()
                ) : (
                    <div className="feedbot">
                        <Chat {...this.props} initialMessage={this.state.inputValue} />
                    </div>
                )}
            </div>
        )
    }
}


