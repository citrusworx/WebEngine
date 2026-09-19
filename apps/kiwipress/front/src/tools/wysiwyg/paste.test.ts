import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeAttr, sanitizeHref, sanitizeHtml, stripDangerousHtml } from "./paste.ts";

describe("wysiwyg paste cleanup", () => {
    it("keeps basic writing tags and strips scripts, styles, and handlers", () => {
        const cleaned = sanitizeHtml(
            `<p onclick="alert(1)">Hello <strong>there</strong></p>`
            + `<script>alert(1)</script>`
            + `<style>p{color:red}</style>`
            + `<h2>Title</h2>`
        );

        assert.match(cleaned, /<p>Hello <strong>there<\/strong><\/p>/);
        assert.match(cleaned, /<h2>Title<\/h2>/);
        assert.doesNotMatch(cleaned, /script/i);
        assert.doesNotMatch(cleaned, /style/i);
        assert.doesNotMatch(cleaned, /onclick/i);
    });

    it("unwraps unknown tags and turns divs into paragraphs", () => {
        const cleaned = sanitizeHtml(`<div>One</div><span>Two</span><o:p></o:p>`);
        assert.equal(cleaned, "<p>One</p>Two");
    });

    it("keeps only safe link hrefs", () => {
        assert.equal(
            sanitizeHtml(`<a href="https://example.com">Safe</a>`),
            `<a href="https://example.com">Safe</a>`
        );
        assert.equal(
            sanitizeHtml(`<a href="javascript:alert(1)">Bad</a>`),
            "<a>Bad</a>"
        );
        assert.equal(sanitizeHref("javascript:alert(1)"), "");
        assert.equal(sanitizeHref("/about"), "/about");
        assert.equal(sanitizeHref("mailto:hi@example.com"), "mailto:hi@example.com");
        assert.equal(escapeAttr(`https://x.com?q="a"`), "https://x.com?q=&quot;a&quot;");
    });

    it("always allows plain text through", () => {
        assert.equal(sanitizeHtml("Just a line"), "Just a line");
        assert.equal(sanitizeHtml(""), "");
    });

    it("strips dangerous hosts on load without flattening existing markup", () => {
        const loaded = stripDangerousHtml(
            `<p class="wp-block">Keep</p><script>alert(1)</script><img src="https://x.test/a.jpg">`
        );
        assert.match(loaded, /class="wp-block"/);
        assert.match(loaded, /<img src="https:\/\/x.test\/a.jpg">/);
        assert.doesNotMatch(loaded, /script/i);
    });
});
