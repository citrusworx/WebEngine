import { mediaUploadFields } from "../types/api.js";
const CONTENT_TYPES_BY_EXTENSION = {
    avif: "image/avif",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    pdf: "application/pdf",
    png: "image/png",
    svg: "image/svg+xml",
    txt: "text/plain",
    webp: "image/webp"
};
export function guessMediaContentType(filename, explicit) {
    if (explicit && explicit.trim()) {
        return explicit.trim();
    }
    const extension = filename.split(".").pop()?.toLowerCase() ?? "";
    return CONTENT_TYPES_BY_EXTENSION[extension] ?? "application/octet-stream";
}
export function mediaUploadBasename(filename) {
    const normalized = filename.replace(/\\/g, "/").replace(/[\r\n]/g, "");
    const basename = normalized.split("/").filter(Boolean).pop() ?? normalized;
    return basename || "upload";
}
export function contentDispositionHeader(filename) {
    const basename = mediaUploadBasename(filename);
    const escaped = basename.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `attachment; filename="${escaped}"`;
}
function toArrayBuffer(file) {
    if (file instanceof ArrayBuffer) {
        return file;
    }
    if (ArrayBuffer.isView(file)) {
        const copy = new Uint8Array(file.byteLength);
        copy.set(new Uint8Array(file.buffer, file.byteOffset, file.byteLength));
        return copy.buffer;
    }
    throw new Error("Media upload file must be a Blob, ArrayBuffer, or typed array.");
}
function toBlob(file, contentType) {
    if (typeof Blob !== "undefined" && file instanceof Blob) {
        return file;
    }
    return new Blob([toArrayBuffer(file)], { type: contentType });
}
function appendUploadField(form, key, value) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        form.append(key, String(value));
        return;
    }
    form.append(key, JSON.stringify(value));
}
/**
 * WordPress `/wp/v2/media` create accepts either:
 * - raw binary + `Content-Type` + `Content-Disposition: attachment; filename="…"` (file-only)
 * - `multipart/form-data` with a `file` part plus metadata fields (title, alt_text, …)
 *
 * Do not set `Content-Type` for multipart — fetch must supply the boundary.
 */
export function createMediaUploadInit(payload) {
    const filename = mediaUploadBasename(payload.filename);
    const contentType = guessMediaContentType(filename, payload.contentType);
    const fields = mediaUploadFields(payload);
    if (Object.keys(fields).length === 0) {
        return {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": contentDispositionHeader(filename)
            },
            body: toBlob(payload.file, contentType)
        };
    }
    const form = new FormData();
    form.append("file", toBlob(payload.file, contentType), filename);
    for (const [key, value] of Object.entries(fields)) {
        appendUploadField(form, key, value);
    }
    return {
        headers: {},
        body: form
    };
}
//# sourceMappingURL=upload.js.map