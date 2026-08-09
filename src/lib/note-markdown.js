import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: false,
  typographer: false,
});

const defaultLinkOpen = markdown.renderer.rules.link_open
  || ((tokens, index, options, _env, renderer) => renderer.renderToken(tokens, index, options));

markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  const hrefIndex = tokens[index].attrIndex("href");
  if (hrefIndex >= 0 && typeof env.resolveHref === "function") {
    const href = tokens[index].attrs[hrefIndex][1];
    tokens[index].attrs[hrefIndex][1] = env.resolveHref(href);
  }

  return defaultLinkOpen(tokens, index, options, env, renderer);
};

const sanitizeOptions = {
  allowedTags: ["p", "br", "a", "em", "strong", "code"],
  allowedAttributes: {
    a: ["href", "title"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
};

export function renderNoteMarkdown(note, { resolveHref } = {}) {
  if (!note) return "";
  const rendered = markdown.render(String(note), { resolveHref });
  return sanitizeHtml(rendered, sanitizeOptions);
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function renderedNoteText(html) {
  const text = String(html)
    .replace(/\r\n?/g, "\n")
    .replace(/^<p>/, "")
    .replace(/<\/p>\s*<p>/g, "\n\n")
    .replace(/<br\s*\/?>(?:\n)?/g, "\n")
    .replace(/<\/?(?:p|a|em|strong|code)(?:\s[^>]*)?>/g, "")
    .replace(/\n$/, "");

  return decodeHtmlEntities(text);
}
