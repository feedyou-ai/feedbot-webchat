import * as React from 'react'
import { isRedesignActive } from '../../../../utils/redesign'

export type Props = {
	botId: string
}

export const SignatureTemplate: React.StatelessComponent = ({ children }) => {
	const redesign = isRedesignActive()

	return (
		<div className="feedbot-signature">
			<div className="feedbot-signature-row">
				{!redesign && <div style={{ alignSelf: 'center' }}>with ❤️ by</div>}
				{children}
			</div>
		</div>
	)
}
