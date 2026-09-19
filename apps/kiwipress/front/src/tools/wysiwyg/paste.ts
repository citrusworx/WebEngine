const ALLOWED_TAGS = new Set([
    "p",
    "br",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "pre",
    "code",
    "ul",
    "ol",
    "li",
    "a",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "img"
]);

const VOID_TAGS = new Set(["br", "img"]);
const BLOCK_AS_PARAGRAPH = new Set(["div", "section", "article", "header", "footer"]);

const TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b([^>]*)\/?>/g;
const DANGEROUS_BLOCK = /<(script|style|noscript|iframe|object|embed|form|textarea|input|button|link|meta|xml)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
const DANGEROUS_VOID = /<(script|style|noscript|iframe|object|embed|form|input|button|link|meta|xml)(\s[^>]*)?\/?>/gi;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

export function sanitizeHref(value: string): string {
    const href = value.trim();
    if (!href) {
        return "";
    }

    if (/^(javascript|data|vbscript):/i.test(href)) {
        return "";
    }

    if (
        /^https?:\/\//i.test(href)
        || /^mailto:/i.test(href)
        || /^tel:/i.test(href)
        || href.startsWith("#")
        || href.startsWith("/")
    ) {
        return href;
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
        return "";
    }

    return href;
}

export function escapeAttr(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function readAttr(attrs: string, name: string): string {
    const patterned = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
    const match = patterned.exec(attrs);
    if (!match) {
        return "";
    }

    return decodeBasicEntities(match[1] ?? match[2] ?? match[3] ?? "");
}

function decodeBasicEntities(value: string): string {
    return value
        .replace(/&quot;/gi, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&amp;/gi, "&");
}

function rewriteTag(raw: string, tag: string, attrs: string): string {
    const name = tag.toLowerCase();
    const closing = raw.startsWith("</");

    if (BLOCK_AS_PARAGRAPH.has(name)) {
        return closing ? "</p>" : "<p>";
    }

    if (!ALLOWED_TAGS.has(name)) {
        return "";
    }

    if (closing) {
        return VOID_TAGS.has(name) ? "" : `</${name}>`;
    }

    if (name === "a") {
        const href = sanitizeHref(readAttr(attrs, "href"));
        return href ? `<a href="${escapeAttr(href)}">` : "<a>";
    }

    if (name === "img") {
        const src = sanitizeHref(readAttr(attrs, "src"));
        return src ? `<img src="${escapeAttr(src)}">` : "";
    }

    if (VOID_TAGS.has(name)) {
        return `<${name}>`;
    }

    return `<${name}>`;
}

export function stripDangerousHtml(input: string): string {
    if (!input.trim()) {
        return "";
    }

    return input
        .replace(HTML_COMMENT, "")
        .replace(DANGEROUS_BLOCK, "")
        .replace(DANGEROUS_VOID, "")
        .trim();
}

export function sanitizeHtml(input: string): string {
    const stripped = stripDangerousHtml(input)
        .replace(/<\/?(html|head|body|font)(\s[^>]*)?>/gi, "");

    if (!stripped) {
        return "";
    }

    return stripped.replace(TAG_PATTERN, (raw, tag: string, attrs: string) => {
        return rewriteTag(raw, tag, attrs ?? "");
    }).trim();
}
