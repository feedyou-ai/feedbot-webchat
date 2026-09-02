import * as MarkdownIt from 'markdown-it';
import * as React from 'react';
import { getFeedyouParam } from './FeedyouParams';
import { strings, defaultStrings } from './Strings';
import { twemoji } from './lib.js'
import { sanitizeHtml, sanitizeUrl, escapeHtml as escapeHtmlUtil, escapeAttr } from './utils/sanitize'
const Swal = require('sweetalert2')

export interface IFormattedTextProps {
    text: string,
    format: string,
    onImageLoad: () => void
}

export const FormattedText = (props: IFormattedTextProps) => {
    if (!props.text || props.text === '')
        return null;

    switch (props.format) {
        case "plain":
            return renderPlainText(props.text);
        case "xml":
        default:
            return renderMarkdown(props.text, props.onImageLoad);
    }
}

const renderPlainText = (text: string) => {
    const lines = text.replace('\r', '').split('\n');
    const elements = lines.map((line, i) => <span key={i} dangerouslySetInnerHTML={{ __html: twemoji.parse(escapeHtml(line))+'<br />' }} />);
    return <span className="format-plain">{elements}</span>;
}

const markdownIt = new MarkdownIt({ html: false, xhtmlOut: true, breaks: true, linkify: true, typographer: true });

//configure MarkdownIt to open links in new tab
//from https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer

// Remember old renderer, if overriden, or proxy to default renderer
const defaultRender = markdownIt.renderer.rules.link_open || ((tokens, idx, options, env, self) => {
    return self.renderToken(tokens, idx, options);
});

markdownIt.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    // If you are sure other plugins can't add `target` - drop check below
    const targetIndex = tokens[idx].attrIndex('target');
    const hrefIndex = tokens[idx].attrIndex('href');
    const href = hrefIndex >= 0 ? tokens[idx].attrs[hrefIndex][1] : ''
    const target = determineLinkTarget(href)

    if (targetIndex < 0) {
        tokens[idx].attrPush(['target', target]); // add new attribute
    } else {
        tokens[idx].attrs[targetIndex][1] = target;    // replace value of existing attr
    }

    // pass token to default renderer.
    return defaultRender(tokens, idx, options, env, self);
};

const renderMarkdown = (
    text: string,
    onImageLoad: () => void
) => {
    let __html;

    if (text.trim()) {
        const src = text
          // convert <br> tags to blank lines for markdown
          .replace(/<br\s*\/?>/ig, '\n')
          // URL encode all links
          .replace(/\[(.*?)\]\((.*?)( +".*?"){0,1}\)/ig, (match, text, url, title) => `[${text}](${markdownIt.normalizeLink(url)}${title === undefined ? '' : title})`);

        const arr = src.split(/\n *\n|\r\n *\r\n|\r *\r/);
        const ma = arr.map(a => {
            return markdownIt.render(a)
        });

        __html = ma.join('<br/>')
        //transform markdown links whose text is wrapped in [ ] into "chip" elements
        .replace(/<a[^>]*href="([^"]+)"[^>]*>\[([^\]]+)\]<\/a>/gi, (_match, url ,label) => {
            const safeUrl = escapeAttr(url)
            const safeLabel = escapeHtmlUtil(label)
            if(isUrlFeedyouPreview(url)){
                // Use data attribute instead of inline onclick to avoid XSS via URL injection
                return `<a href="${safeUrl}" class="source-link-chip" data-preview-url="${safeUrl}">${safeLabel}</a>`;
            }

            return `<a href="${safeUrl}" target="_blank"><span class="source-link-chip">${safeLabel}</span></a>`;
        });
    } else {
        // Replace spaces with non-breaking space Unicode characters
        __html = text.replace(/ */, '\u00A0');
    }

    __html = sanitizeHtml(__html)

    // FEEDYOU use twemoji to make emoji compatible
    __html = twemoji.parse(__html)

    return <div className="format-markdown" dangerouslySetInnerHTML={{ __html }} />;
}

const isUrlExternal = (url: string) => {
    try {
        return !window.location.hostname || !(new URL(url)).hostname.endsWith(window.location.hostname)
    } catch (err) {
        return true
    }
}
const determineLinkTarget = (url: string) => {
    return getFeedyouParam("openUrlTarget") === "same"
        ? "_self"
        : (!isUrlExternal(url) && getFeedyouParam("openUrlTarget") === "same-domain")
            ? "_self"
            : "_blank"
}

function escapeHtml(unsafe: string) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

 const isUrlFeedyouPreview = (url: string) => {
    const parsedUrl = new URL(url)
    const previewHtmlRegex = /\/api\/messages\/kb\/[^\/]+\/documents\/[^\/]+\/preview/
    return previewHtmlRegex.test(parsedUrl.pathname)
}

 const showIframeModal = (e:MouseEvent ,url: string) => {
    // Validate URL before rendering into modal
    const safeUrl = sanitizeUrl(url)
    if (!safeUrl) {
        e.preventDefault();
        return;
    }

    const locale = getFeedyouParam('locale') || 'en-us';
    const localized = strings(locale) || defaultStrings;

    let originalSourceUrl: string | null = null;
    try {
        const parsedUrl = new URL(safeUrl);
        const fragment = parsedUrl.hash.replace(/^#/, '');
        const params = new URLSearchParams(fragment);
        if (params.has('source')) {
            originalSourceUrl = sanitizeUrl(decodeURIComponent(params.get('source')));
        }
    } catch (_) {
        // ignore parse errors
    }

    const originalSourceHtml = originalSourceUrl
        ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; text-align: left; font-size: 12px; color: grey"><span>${escapeHtmlUtil(localized.originalSource)}: </span><a style="color: grey; word-break: break-all;" href="${escapeAttr(originalSourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtmlUtil(originalSourceUrl)}</a></div>`
        : '';

    Swal.fire({
        title: localized.referencedSource,
        html: `<iframe width="100%" height="600px" frameborder="0" sandbox="allow-same-origin allow-scripts allow-popups" src="${escapeAttr(safeUrl)}"></iframe>${originalSourceHtml}`,
        showCloseButton: true,
        showConfirmButton: false,
        width: 1000,
      })
    e.preventDefault();
  }

// Delegated click handler for preview-url chips (replaces inline onclick)
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const chip = target.closest ? target.closest('[data-preview-url]') as HTMLElement : null
    if (chip) {
      const url = chip.getAttribute('data-preview-url')
      if (url) {
        showIframeModal(e, url)
      }
    }
  })
}

declare global {
  interface Window {
    showIframeModal: (e: MouseEvent, url: string) => void;
  }
}

  window.showIframeModal = (e: MouseEvent, url: string) => showIframeModal(e, url);