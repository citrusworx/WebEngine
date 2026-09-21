const CONTENT_TYPES = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    mjs: "text/javascript; charset=utf-8",
    json: "application/json",
    map: "application/json",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml",
    webmanifest: "application/manifest+json",
    pdf: "application/pdf",
    wasm: "application/wasm"
};
/** Content-Type for a static-site object key. Unknown extensions are octet-stream. */
export function contentTypeForKey(key) {
    const base = key.split("/").pop() ?? key;
    const dot = base.lastIndexOf(".");
    if (dot <= 0) {
        return "application/octet-stream";
    }
    const extension = base.slice(dot + 1).toLowerCase();
    return CONTENT_TYPES[extension] ?? "application/octet-stream";
}
//# sourceMappingURL=content-type.js.map