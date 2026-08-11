import * as React from 'react'
import { isRedesignActive } from '../../../../utils/redesign'

export type Props = {
	botId: string
}

export const SignatureTemplate: React.StatelessComponent = ({ children }) => {
	return (
		<div className="feedbot-signature">
			<div className="feedbot-signature-row">
				<div style={{ alignSelf: 'center' }}>{isRedesignActive() ? 'powered by' : 'with ❤️ by'}</div>
				{children}
			</div>
		</div>
	)
}
