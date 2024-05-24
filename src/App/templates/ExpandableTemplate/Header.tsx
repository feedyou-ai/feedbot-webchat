import * as React from 'react'
import { AppProps } from '../../App'
import { Theme } from '../../../themes'

export type Props = {
	appProps: AppProps
	onClick(): void
	isCollapsed: boolean
}

export type State = {
	isMenuOpen: boolean;
};

export class Header extends React.Component<Props, State> {
	state: State = { isMenuOpen: false };

	render() {
		const {
			appProps: {
				theme: { mainColor, template },
				header: { extraHtml }
			},
			isCollapsed,
			onClick
		} = this.props;

		const handlePersistentMenuToggle = () => {
			this.setState(prevState => ({
				isMenuOpen: !prevState.isMenuOpen
			}));
		};

		let backgroundColor;
		if (template.type !== 'expandable-knob-v2' && template.type !== 'sidebar-v2') {
			backgroundColor = mainColor || '#fb584e';
		}

		const title = getTitle(this.props.appProps, isCollapsed);

		const avatar =
			template.avatar ||
			"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36' fill='none'%3E%3Cpath d='M36 18c0 9.941-8.059 18-18 18S0 27.941 0 18 8.059 0 18 0s18 8.059 18 18Z' fill='%23F7F9FB'/%3E%3Cpath d='M14.024 18.026h-.003v-.005h.004l.001.002v.001l-.002.002Zm3.978 0v-.001l.001-.002v-.002h-.006v.004l.002.001h.003Zm3.976 0h-.003l-.001-.002v-.002l.001-.001h.004v.003l-.001.002Z' fill='%23385B75'/%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M18.718 9.023a8.912 8.912 0 0 1 5.669 2.59 8.91 8.91 0 0 1-10.583 14.12l-3.073 1.182a1.274 1.274 0 0 1-1.646-1.646l1.182-3.073a8.91 8.91 0 0 1 8.45-13.173ZM14.023 17a1.024 1.024 0 1 0 0 2.047 1.024 1.024 0 0 0 0-2.047Zm3.409.172a1.023 1.023 0 1 1 1.136 1.702 1.023 1.023 0 0 1-1.136-1.702ZM21.977 17a1.023 1.023 0 1 0 0 2.047 1.023 1.023 0 0 0 0-2.047Z' fill='%23385B75'/%3E%3C/svg%3E";

		const startOverIcon = (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="17"
				height="15"
				viewBox="0 0 17 15"
				fill="none"
			>
				<path
					d="M4.429 1 1 4.429l3.429 3.428"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M1 4.429h10.286a4.571 4.571 0 0 1 0 9.142H5.57"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		);

		return (
			<div className="feedbot-header" onClick={isCollapsed && onClick} style={{ backgroundColor }}>
				<div className="feedbot-header-name">
					{template.type === 'expandable-knob-v2' || template.type === 'sidebar-v2' ? (
						<div className="feedbot-avatar" style={{ backgroundImage: `url("${avatar}")` }}></div>
					) : null}
					<div className="feedbot-name">
						<span className="feedbot-title">{title}</span>
						{template.type === 'expandable-knob-v2' || template.type === 'sidebar-v2' ? (
							<span className="feedbot-supportive-title">{template.supportiveTitle}</span>
						) : null}
					</div>
				</div>

				{extraHtml && (
					<span className="feedbot-extra-html" dangerouslySetInnerHTML={{ __html: extraHtml }} />
				)}

				<div className="feedbot-header-actions">
					{(template.type === 'expandable-knob-v2' || template.type === 'sidebar-v2') &&
					(checkFeedbotTestMode() || template.persistentMenu.length > 0) ? (
						<div className="feedbot-persistent-menu" onClick={handlePersistentMenuToggle}>
							<a className="feedbot-persistent-menu-toggle">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="3"
									height="17"
									viewBox="0 0 3 17"
									fill="none"
								>
									<path
										d="M3 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
										fill="currentColor"
									/>
								</svg>
							</a>
							{this.state.isMenuOpen && (
								<ul className="feedbot-persistent-menu-links">
									{checkFeedbotTestMode() && (
										<li className="feedbot-persistent-menu-debug">
											<a onClick={handleStartOver}>
												<span>Start over</span>
												{startOverIcon}
											</a>
										</li>
									)}

									{template.persistentMenu.map((menuItem, index) => (
										<li key={index}>
											<a onClick={() => handleTriggerDialog(menuItem.dialog)}>{menuItem.title}</a>
										</li>
									))}
								</ul>
							)}
						</div>
					) : null}
					<a
						onClick={e => {
							e.preventDefault();
							onClick();
						}}
						className="feedbot-minimize"
						href="#"
					>
						{template.type === 'expandable-knob-v2' || template.type === 'sidebar-v2' ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="26"
								height="26"
								viewBox="0 0 26 26"
								fill="none"
							>
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M17.5303 8.46967C17.8232 8.76256 17.8232 9.23744 17.5303 9.53033L9.53033 17.5303C9.23744 17.8232 8.76256 17.8232 8.46967 17.5303C8.17678 17.2374 8.17678 16.7626 8.46967 16.4697L16.4697 8.46967C16.7626 8.17678 17.2374 8.17678 17.5303 8.46967Z"
									fill="currentColor"
								/>
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M8.46967 8.46967C8.76256 8.17678 9.23744 8.17678 9.53033 8.46967L17.5303 16.4697C17.8232 16.7626 17.8232 17.2374 17.5303 17.5303C17.2374 17.8232 16.7626 17.8232 16.4697 17.5303L8.46967 9.53033C8.17678 9.23744 8.17678 8.76256 8.46967 8.46967Z"
									fill="currentColor"
								/>
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M13 1.75C6.7868 1.75 1.75 6.7868 1.75 13C1.75 19.2132 6.7868 24.25 13 24.25C19.2132 24.25 24.25 19.2132 24.25 13C24.25 6.7868 19.2132 1.75 13 1.75ZM0.25 13C0.25 5.95837 5.95837 0.25 13 0.25C20.0416 0.25 25.75 5.95837 25.75 13C25.75 20.0416 20.0416 25.75 13 25.75C5.95837 25.75 0.25 20.0416 0.25 13Z"
									fill="currentColor"
								/>
							</svg>
						) : (
							'_'
						)}
					</a>
				</div>
			</div>
		);
	}
}

const getTitle = (props: AppProps, isCollapsed: boolean) => {
	const { text, textWhenCollapsed } = props.header

	const titleWhenExpanded = text || 'Chatbot'
	const titleWhenCollapsed = textWhenCollapsed || titleWhenExpanded
	const titleToShow = isCollapsed ? titleWhenCollapsed : titleWhenExpanded

	return titleToShow
};

/**
 * Triggers a specified dialog for the persistent menu item from Channel settings
 * @param dialogId Dialog ID to be triggered on persistent menu item click
 */
const handleTriggerDialog = (dialogId: string) => {
	window.dispatchEvent(new CustomEvent('feedbot:trigger-dialog', { detail: dialogId }));
};

/**
 * Restart conversation via custom event
 */
const handleStartOver = () => {
	window.dispatchEvent(new CustomEvent('feedbot:start-over'));
};

/**
 * Check URL if test mode is being used (#feedbot-test-mode)
 * @returns Boolean
 */
const checkFeedbotTestMode = (): boolean => {
	return window.location.hash === '#feedbot-test-mode';
};

export type HeaderProps = Props
