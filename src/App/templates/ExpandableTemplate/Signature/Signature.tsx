import * as React from 'react'
import { SignatureLink } from './SignatureLink'
import { Theme } from '../../../../themes'
import { AppProps } from '../../../App'
import { isRedesignTemplate } from '../../../../utils/redesign'

import { SignatureTemplate } from './SignatureTemplate'

type SignatureSchema = Theme['signature']
const FEEDYOU_LOGO_IMG_SRC = 'https://cdn.feedyou.ai/webchat/feedyou_logo_red.png'

export type Props = {
	signature: SignatureSchema
	appProps: AppProps
	botId: string
}

const getLinkQueryString = (botId: string) => `?utm_source=webchat&utm_medium=chatbot&utm_campaign=${botId}`

export const Signature: React.StatelessComponent<Props> = ({
	signature,
	botId,
	appProps,
}) => {
	const {
		partnerLogoUrl,
		partnerLinkUrl,
		partnerLogoStyle,
		mode,
		partnerName,
		disclaimer,
	} = signature
	const template = (appProps.theme && appProps.theme.template) || {}

	const attachQueryStringToUrl = (url: string) =>
		`${url}${getLinkQueryString(botId)}`

	const enhancedFeedyouUrl = attachQueryStringToUrl('https://feedyou.ai');
	const enhancedPartnerUrl = partnerLinkUrl
		? attachQueryStringToUrl(partnerLinkUrl)
		: enhancedFeedyouUrl

	const feedyouLink = (
		<SignatureLink
			href={enhancedFeedyouUrl}
			imgSrc={FEEDYOU_LOGO_IMG_SRC}
		/>
	);

	const partnerLink = (
		<SignatureLink
			href={enhancedPartnerUrl}
			imgSrc={partnerLogoUrl}
			className='partner-logo'
			customStyles={partnerLogoStyle}
			text={partnerName}
		/>
	);

	if (mode === 'none') {
		return null;
	}

	/* Webchat Redesign Signature */
	if (isRedesignTemplate(template.type)) {
		const redesignPrefix = (
			<span className='signature-prefix'>
				{disclaimer && <span className='signature-disclaimer'>{disclaimer} · </span>}
				Powered by
			</span>
		)

		if (mode === 'both') {
			return (
				<SignatureTemplate>
					<span className='signature-redesign-content'>
						{redesignPrefix}
						{partnerLink} &{' '}
						<a
							className='signature-link'
							target='_blank'
							href={enhancedFeedyouUrl}>
							Feedyou
						</a>
					</span>
				</SignatureTemplate>
			);
		}
		if (mode === 'partner') {
			return (
				<SignatureTemplate>
					<span className='signature-redesign-content'>
						{redesignPrefix}
						{partnerLink}
					</span>
				</SignatureTemplate>
			)
		}
		return (
			<SignatureTemplate>
				<span className='signature-redesign-content'>
					{redesignPrefix}
					<a
						className='signature-link'
						target='_blank'
						rel='noopener noreferrer'
						href={enhancedFeedyouUrl}>
						Feedyou
					</a>
				</span>
			</SignatureTemplate>
		);
	}
	
	if (partnerLogoUrl && mode === 'both') {
		return (
			<SignatureTemplate>
				{partnerLink}
				<div style={{ alignSelf: 'center' }}>&</div>
				{feedyouLink}
			</SignatureTemplate>
		)
	}

	if (partnerLogoUrl && mode === 'partner') {
		return (
			<SignatureTemplate>
				{partnerLink}
			</SignatureTemplate>
		)
	}

	return (
		<SignatureTemplate>
			{feedyouLink}
		</SignatureTemplate>
	)
}

export type SignatureProps = Props
