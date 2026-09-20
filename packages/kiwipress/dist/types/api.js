const MEDIA_UPLOAD_META_KEYS = new Set(["file", "filename", "contentType"]);
export function isMediaFileBytes(value) {
    if (value == null) {
        return false;
    }
    if (typeof Blob !== "undefined" && value instanceof Blob) {
        return true;
    }
    return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}
export function isMediaUploadPayload(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return typeof candidate.filename === "string"
        && candidate.filename.length > 0
        && isMediaFileBytes(candidate.file);
}
export function mediaUploadFields(payload) {
    const fields = {};
    for (const [key, value] of Object.entries(payload)) {
        if (MEDIA_UPLOAD_META_KEYS.has(key) || value === undefined) {
            continue;
        }
        fields[key] = value;
    }
    return fields;
}
//# sourceMappingURL=api.js.map