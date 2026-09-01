// FEEDYOU webchat redesign (v2 templates)
//
// The redesign ships as its own stylesheet (botchat-redesign.css) which is loaded
// on top of botchat.css only when a v2 template is configured. Old templates never
// load it, so their look and their customCss keep working exactly as before.

const REDESIGN_TEMPLATES = ['expandable-knob-v2', 'sidebar-v2']

export const REDESIGN_BODY_CLASS = 'feedbot-redesign'

const REDESIGN_STYLESHEET = 'botchat-redesign.css'

let redesignStylesheetLoad: Promise<void>

const getBaseStylesheet = (): HTMLLinkElement =>
	document.querySelector('link[href*="botchat.css"]') as HTMLLinkElement

// `currentScript` is available while the bundle evaluates. Keep its source because
// enableRedesign runs later, after dynamically added script tags may be removed.
const botchatScriptSource = typeof document !== 'undefined' && (<any>document).currentScript
	? (<HTMLScriptElement>(<any>document).currentScript).getAttribute('src')
	: null

export const isRedesignTemplate = (type?: string): boolean =>
	REDESIGN_TEMPLATES.indexOf(type) !== -1

// for components with no access to theme props (Shell, SignatureTemplate)
export const isRedesignActive = (): boolean =>
	typeof document !== 'undefined' &&
	!!document.body &&
	document.body.className.indexOf(REDESIGN_BODY_CLASS) !== -1

const getStylesheetUrlFromScript = (src?: string): string =>
	src && src.replace(/botchat(-es5)?\.js.*$/, REDESIGN_STYLESHEET)

// Derive the redesign stylesheet URL from the same botchat build the page loaded,
// so self-hosted and version-pinned deployments keep working.
const getRedesignStylesheetUrl = (): string => {
	const currentScriptUrl = getStylesheetUrlFromScript(botchatScriptSource)
	if (currentScriptUrl) {
		return currentScriptUrl
	}

	const script = document.querySelector(
		'script[src*="botchat-es5.js"], script[src*="botchat.js"]'
	) as HTMLScriptElement
	if (script && script.getAttribute('src')) {
		return getStylesheetUrlFromScript(script.getAttribute('src'))
	}

	const link = getBaseStylesheet()
	if (link && link.getAttribute('href')) {
		return link.getAttribute('href').replace('botchat.css', REDESIGN_STYLESHEET)
	}
}

export const enableRedesign = (): Promise<void> => {
	document.body.className += ' ' + REDESIGN_BODY_CLASS

	const href = getRedesignStylesheetUrl()
	if (!href) {
		return Promise.resolve()
	}
	if (redesignStylesheetLoad) {
		return redesignStylesheetLoad
	}
	if (document.querySelector('link[href="' + href + '"]')) {
		return Promise.resolve()
	}

	const link = document.createElement('link')
	link.rel = 'stylesheet'
	link.type = 'text/css'
	link.href = href

	redesignStylesheetLoad = new Promise<void>(resolve => {
		link.onload = () => resolve()
		link.onerror = () => resolve()

		const baseStylesheet = getBaseStylesheet()
		if (baseStylesheet && baseStylesheet.parentNode) {
			baseStylesheet.parentNode.insertBefore(link, baseStylesheet.nextSibling)
		} else {
			document.head.appendChild(link)
		}
	})

	return redesignStylesheetLoad
}
