// FEEDYOU webchat redesign (v2 templates)
//
// The redesign ships as its own stylesheet (botchat-redesign.css) which is loaded
// on top of botchat.css only when a v2 template is configured. Old templates never
// load it, so their look and their customCss keep working exactly as before.

const REDESIGN_TEMPLATES = ['expandable-knob-v2', 'sidebar-v2']

export const REDESIGN_BODY_CLASS = 'feedbot-redesign'

const REDESIGN_STYLESHEET = 'botchat-redesign.css'

const FALLBACK_STYLESHEET_URL = 'https://cdn.feedyou.ai/webchat/latest/' + REDESIGN_STYLESHEET

export const isRedesignTemplate = (type?: string): boolean =>
	REDESIGN_TEMPLATES.indexOf(type) !== -1

// for components with no access to theme props (Shell, SignatureTemplate)
export const isRedesignActive = (): boolean =>
	typeof document !== 'undefined' &&
	!!document.body &&
	document.body.className.indexOf(REDESIGN_BODY_CLASS) !== -1

// Derive the redesign stylesheet URL from whatever botchat build the page already
// loaded, so self-hosted and version-pinned deployments keep working.
const getRedesignStylesheetUrl = (): string => {
	const link = document.querySelector('link[href*="botchat.css"]') as HTMLLinkElement
	if (link && link.getAttribute('href')) {
		return link.getAttribute('href').replace('botchat.css', REDESIGN_STYLESHEET)
	}

	const script = document.querySelector(
		'script[src*="botchat-es5.js"], script[src*="botchat.js"]'
	) as HTMLScriptElement
	if (script && script.getAttribute('src')) {
		return script
			.getAttribute('src')
			.replace(/botchat(-es5)?\.js.*$/, REDESIGN_STYLESHEET)
	}

	return FALLBACK_STYLESHEET_URL
}

export const enableRedesign = () => {
	document.body.className += ' ' + REDESIGN_BODY_CLASS

	const href = getRedesignStylesheetUrl()
	if (document.querySelector('link[href="' + href + '"]')) {
		return
	}

	// appended last so it wins over botchat.css, but still before the theme <style>
	// which App appends to <body>
	const link = document.createElement('link')
	link.rel = 'stylesheet'
	link.type = 'text/css'
	link.href = href
	document.head.appendChild(link)
}
