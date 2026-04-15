const DOMPurify = require('dompurify')

/**
 * Sanitize an HTML string produced by markdown-it / twemoji so it is safe
 * for dangerouslySetInnerHTML.  Allows the standard inline/block markup that
 * markdown-it emits plus twemoji <img> tags — strips everything else
 * (scripts, event-handler attributes, javascript: URIs, etc.).
 */
export function sanitizeHtml(dirty: string): string {
    // Use DOMPurify defaults which already strip <script>, all on* event
    // handlers, and dangerous URI schemes (javascript:, data:, etc.) while
    // preserving the full set of attributes that markdown-it and twemoji emit.
    // Only add our custom data-preview-url attribute on top of defaults.
    return DOMPurify.sanitize(dirty, {
        ADD_ATTR: ['data-preview-url'],
    })
}

/**
 * Minimal HTML-entity escaping for inserting untrusted text into an HTML
 * context (e.g. before passing through twemoji.parse which only adds <img>
 * tags for emoji).
 */
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Validate and sanitize a URL for use in href / src attributes.
 * Returns the original URL if it is http(s), or an empty string otherwise.
 */
export function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url)
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return url
        }
    } catch (_) {
        // malformed URL
    }
    return ''
}

/**
 * Escape a string for safe interpolation inside an HTML *attribute* value
 * (single- or double-quoted).  Stricter than escapeHtml because it also
 * encodes backticks which can matter in some older browsers.
 */
export function escapeAttr(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/`/g, '&#96;')
}
