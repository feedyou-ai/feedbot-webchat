import { ExpandableBarTheme } from './ExpandableBarTheme'
import { FullScreenTheme } from './FullScreenTheme'
import { ExpandableKnobTheme } from './ExpandableKnobTheme'
import { SidebarTheme } from './SidebarTheme'
import { ExpandableKnobThemeV2 } from './ExpandableKnobThemeV2'
import { SidebarThemeV2 } from './SidebarThemeV2'
import { AssistantTheme } from './AssistantTheme'

export type TemplateType = 'expandable-bar' | 'full-screen'| 'expandable-knob'| 'sidebar'| 'expandable-knob-v2'| 'sidebar-v2' | 'assistant'

export type Role = "admin" | "user" | "customer"

export type CustomExplanation = {
	roles: Role[],
	required: boolean,
	intro: string,
	title: string
	explanationFields: ExplanationFields[]
}

export type ExplanationFields = {
		name: string,
		label: string,
		required: boolean,
	}

export type Theme = {
	mainColor: string;
	template?: {
		// Dost možná tu nějaký propy chyběj,
		// tak je neváhej připsat! :)
		autoExpandTimeout?: number,
		type?: TemplateType,
		headerText?: string,
		collapsedHeaderText?: string,
		popupMessage?: {
			title: string,
			description: string,
			timeout: number
		},
		iconUrl?: string,
		customScript?: string,
		logoUrl?: string,
		avatar?: string;
		supportiveTitle?: string;
		persistentMenu?: {
			title: string;
			dialog: string;
		}[]
		welcomeTitle?: string,
		exampleQueries?: string[],
	};
	genAi?: {
		ratingRoles: Role[],
		explanationRoles: Role[],
		customExplanations: CustomExplanation[],
		disclaimerEnabled: boolean,
		customDisclaimerText: string,
	},
	customCss?: string;
	showSignature?: boolean,
	enableScreenshotUpload?: boolean
	showAiMessageIndicator?: boolean
	signature?: {
		partnerLogoUrl: string,
		partnerLogoStyle: string,
		partnerLinkUrl: string,
		mode: string,
		partnerName: string,
		disclaimer?: string,
	}
};

export function getStyleForTheme(theme: Theme, remoteConfig: boolean): string {
	switch (theme && theme.template && theme.template.type) {
		case 'expandable-bar':
			return ExpandableBarTheme(theme)
		case 'full-screen':
			return FullScreenTheme(theme)
		case "assistant":
			return AssistantTheme(theme)
		case 'expandable-knob':
			return ExpandableKnobTheme(theme)
		case 'sidebar':
			return SidebarTheme(theme)
		case 'expandable-knob-v2':
			return ExpandableKnobThemeV2(theme)
		case 'sidebar-v2':
			return SidebarThemeV2(theme)
	}
	// backward compatibility - knob is new default for remote config, old default is bar
	
	return remoteConfig ? ExpandableKnobTheme(theme) : ExpandableBarTheme(theme)
}
