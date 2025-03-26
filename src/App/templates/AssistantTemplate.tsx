import * as React from 'react'
import { AppProps } from '../App'
import { Chat } from '../../Chat'
import { appendScriptToBody } from '../../utils/appendScriptToBody'

export type Props = AppProps

export class AssistantTemplate extends React.Component<Props, { introMode: boolean; inputValue: string }> {
    constructor(props: Props) {
        super(props)
        this.state = {
            introMode: true,
            inputValue: '',
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
            const inputElement = document.getElementById('chat-input') as HTMLInputElement
            if (inputElement) {
                inputElement.focus()
                inputElement.setSelectionRange(query.length, query.length)
            }
        })
    }

    handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ inputValue: event.target.value })
    }

    handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && this.state.inputValue.trim() !== '') {
            const message = this.state.inputValue.trim()

            this.setState({ introMode: false })
        }
    }

    renderIntroSection() {
        const { theme } = this.props
        const welcomeTitle = (theme && theme.template && theme.template.welcomeTitle) || 'Welcome to the chatbot!'
        const exampleQueries = (theme && theme.template && theme.template.exampleQueries) || []

        return (
            <div className="intro-section">
                <h1 className="intro-title">{welcomeTitle}</h1>
				<div className='card'>
                <input
                    id="chat-input"
                    className="chat-input"
                    type="text"
                    placeholder="Type your message..."
                    value={this.state.inputValue}
                    onChange={this.handleInputChange}
                    onKeyPress={this.handleInputKeyPress}
                />
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
        const logoSrc = (theme && theme.template && theme.template.logoUrl) || 'https://cdn.feedyou.ai/webchat/feedyou_logo_red.png'

        return (
            <div className="feedbot-wrapper" data-html2canvas-ignore="">
                <div className="feedbot-logo">
                    <img alt="Logo" src={logoSrc} />
                </div>

                {this.state.introMode ? (
                    this.renderIntroSection()
                ) : (
                    <div className="feedbot">
                        <Chat {...this.props}  initialMessage={this.state.inputValue} /> 
                    </div>
                )}
            </div>
        )
    }
}


