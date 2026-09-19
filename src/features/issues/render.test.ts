import { describe, expect, it } from "vitest";
import { renderMarkdownEmail } from "./render";

describe("renderMarkdownEmail", () => {
  it("renders useful Markdown and removes executable HTML", () => {
    const html = renderMarkdownEmail("# Hello\n\n[Read](https://example.com)\n\n<script>alert(1)</script>");
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain("script");
    expect(html).not.toContain("alert(1)");
  });
});
