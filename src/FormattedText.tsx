import * as MarkdownIt from 'markdown-it';
import * as React from 'react';
import { getFeedyouParam } from './FeedyouParams';
import { strings, defaultStrings } from './Strings';
import { twemoji } from './lib.js'
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
        .replace(/<a href="(.+?)" target="_.+?">\[([^\]]+)\]<\/a>/gi, (_match, url ,label) => {
            if(isUrlFeedyouPreview(url)){
                // If the URL is a Feedyou preview link, show a custom iframe modal
                // Use data attribute instead of inline onclick for better security
                return `<a href="${escapeHtml(url)}" class="source-link-chip feedyou-preview-link" data-preview-url="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
            }

            return `<a href="${escapeHtml(url)}" target="_blank"><span class="source-link-chip">${escapeHtml(label)}</span></a>`;
        });
    } else {
        // Replace spaces with non-breaking space Unicode characters
        __html = text.replace(/ */, '\u00A0');
    }

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
    try {
        const parsedUrl = new URL(url)
        const previewHtmlRegex = /\/preview\/html\/?$/
        return previewHtmlRegex.test(parsedUrl.pathname)
    } catch (_) {
        return false
    }
}

 const showIframeModal = (e:MouseEvent ,url: string) => {
    const locale = getFeedyouParam('locale') || 'en-us';
    const localized = strings(locale) || defaultStrings;

    let originalSourceUrl: string | null = null;
    try {
        const parsedUrl = new URL(url);
        const fragment = parsedUrl.hash.replace(/^#/, '');
        const params = new URLSearchParams(fragment);
        if (params.has('source')) {
            originalSourceUrl = decodeURIComponent(params.get('source'));
        }
    } catch (_) {
        // ignore parse errors
    }

    const originalSourceHtml = originalSourceUrl
        ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; text-align: left; font-size: 12px; color: grey"><span>${escapeHtml(localized.originalSource)}: </span><a style="color: grey;" href="${escapeHtml(originalSourceUrl)}" target="_blank" rel="noopener noreferrer" style="word-break: break-all;">${escapeHtml(originalSourceUrl)}</a></div>`
        : '';

    Swal.fire({
        title: localized.referencedSource,
        html: `<iframe width="100%" height="600px" frameborder="0" src="${escapeHtml(url)}"></iframe>${originalSourceHtml}`,
        showCloseButton: true,
        showConfirmButton: false,
        width: 1000,
      })
    e.preventDefault();
  }

declare global {
  interface Window {
    feedyouPreviewClickHandlerAttached?: boolean;
  }
}

// Set up event delegation for preview links (only attach once)
if (typeof window !== 'undefined' && !window.feedyouPreviewClickHandlerAttached) {
  const attachPreviewHandler = () => {
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const previewLink = target.closest('.feedyou-preview-link');
      if (previewLink) {
        e.preventDefault();
        const url = previewLink.getAttribute('data-preview-url');
        if (url) {
          showIframeModal(e, url);
        }
      }
    });
    window.feedyouPreviewClickHandlerAttached = true;
  };

  // Attach handler when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachPreviewHandler);
  } else {
    // DOM is already ready
    attachPreviewHandler();
  }
}