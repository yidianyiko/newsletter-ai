import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export function renderMarkdownEmail(markdown: string): string {
  const rendered = marked.parse(markdown, { async: false });
  return sanitizeHtml(rendered, {
    allowedTags: ["h1", "h2", "h3", "p", "a", "strong", "em", "ul", "ol", "li", "blockquote", "code", "pre", "hr", "br"],
    allowedAttributes: { a: ["href", "title"] },
    allowedSchemes: ["https", "http", "mailto"],
    disallowedTagsMode: "discard",
    exclusiveFilter: (frame) => frame.tag === "script" || frame.tag === "style",
  });
}
