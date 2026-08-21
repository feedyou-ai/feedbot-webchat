// Self-check for src/utils/redesign.ts URL derivation + opt-in guard.
// Run: npm run build (or tsc) && node test/redesign-check.js
const assert = require('assert')

const fakeDom = tags => {
	const head = { children: [], appendChild(el) { this.children.push(el) } }
	global.document = {
		body: { className: 'feedbot-enabled' },
		head,
		createElement: () => ({}),
		querySelector: sel => {
			if (sel.indexOf('link[href="') === 0) {
				const href = sel.slice('link[href="'.length, -2)
				return head.children.filter(el => el.href === href)[0] || null
			}
			if (sel.indexOf('link') === 0) return tags.link ? { getAttribute: () => tags.link } : null
			if (sel.indexOf('script') === 0) return tags.script ? { getAttribute: () => tags.script } : null
			return null
		}
	}
	return head
}

const load = () => {
	delete require.cache[require.resolve('../built/utils/redesign')]
	return require('../built/utils/redesign')
}

// template detection
fakeDom({})
let r = load()
assert.strictEqual(r.isRedesignTemplate('expandable-knob-v2'), true)
assert.strictEqual(r.isRedesignTemplate('sidebar-v2'), true)
assert.strictEqual(r.isRedesignTemplate('expandable-knob'), false, 'old knob must not be redesign')
assert.strictEqual(r.isRedesignTemplate('sidebar'), false, 'old sidebar must not be redesign')
assert.strictEqual(r.isRedesignTemplate('expandable-bar'), false)
assert.strictEqual(r.isRedesignTemplate('full-screen'), false)
assert.strictEqual(r.isRedesignTemplate('assistant'), false)
assert.strictEqual(r.isRedesignTemplate(undefined), false, 'missing type must not be redesign')

// url derived from the css link the page already loaded (version-pinned CDN)
let head = fakeDom({ link: 'https://cdn.feedyou.ai/webchat/v1.2.3/botchat.css' })
r = load()
r.enableRedesign()
assert.strictEqual(head.children[0].href, 'https://cdn.feedyou.ai/webchat/v1.2.3/botchat-redesign.css')
assert.ok(document.body.className.indexOf('feedbot-redesign') !== -1, 'body class must be set')

// relative self-hosted path
head = fakeDom({ link: '../../botchat.css' })
r = load()
r.enableRedesign()
assert.strictEqual(head.children[0].href, '../../botchat-redesign.css')

// no css link -> derive from the script tag (incl. cache-busting query)
head = fakeDom({ script: 'https://cdn.feedyou.ai/webchat/latest/botchat-es5.js?v=7' })
r = load()
r.enableRedesign()
assert.strictEqual(head.children[0].href, 'https://cdn.feedyou.ai/webchat/latest/botchat-redesign.css')

// nothing to derive from -> cdn fallback
head = fakeDom({})
r = load()
r.enableRedesign()
assert.strictEqual(head.children[0].href, 'https://cdn.feedyou.ai/webchat/latest/botchat-redesign.css')

// injected only once
head = fakeDom({ link: '/botchat.css' })
r = load()
r.enableRedesign()
r.enableRedesign()
assert.strictEqual(head.children.length, 1, 'stylesheet must not be injected twice')

// V2 templates must include the runtime color layer, not only the static redesign CSS
const theme = { mainColor: '#fb584e', template: {} }
const knobStyles = require('../built/themes/ExpandableKnobThemeV2').ExpandableKnobThemeV2(theme)
const sidebarStyles = require('../built/themes/SidebarThemeV2').SidebarThemeV2(theme)

for (const styles of [knobStyles, sidebarStyles]) {
	assert.ok(styles.indexOf('#fb584e') !== -1, 'V2 theme must include mainColor')
	assert.ok(styles.indexOf('.wc-list.tiles .ac-pushButton') !== -1, 'V2 theme must style tiles dynamically')
}

console.log('redesign-check: all assertions passed')
