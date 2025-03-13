import * as React from 'react'

export type Props = {
	botId: string
}

export const SignatureTemplate: React.StatelessComponent = ({ children }) => {
	return (
		<div className="feedbot-signature">
			<div className="feedbot-signature-row">
				<div style={{ alignSelf: 'center' }}>powered by</div>
				{children}
			</div>
		</div>
	)
}
