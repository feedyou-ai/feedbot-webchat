import * as React from 'react'
import cx from 'classnames'
import { CustomStylesForCssClass } from '../../../CustomStylesForCssClass'

export type Props = {
	href: string,
	imgSrc: string
	className?: string
	customStyles?: string
	text?: string
};

export const SignatureLink: React.StatelessComponent<Props> = ({
	href,
	imgSrc,
	className,
	customStyles,
	text,
}) => {
	return (
		<a className={cx('signature-link', className)} target="_blank" href={href}>
			{imgSrc ? <img src={imgSrc} alt='Logo' /> : text}
			{className && customStyles &&
				<CustomStylesForCssClass cssClass={className} styles={customStyles} />}
		</a>
	)
}

export type SignatureLinkProps = Props
