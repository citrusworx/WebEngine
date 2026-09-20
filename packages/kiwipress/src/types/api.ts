export type ApiDefinition = {
    method: string;
    endpoint: string;
};

export type WordPressPayload = Record<string, unknown>;

export type MediaFileBytes = Blob | ArrayBuffer | ArrayBufferView;

export type MediaUploadPayload = WordPressPayload & {
    file: MediaFileBytes;
    filename: string;
    contentType?: string;
};

const MEDIA_UPLOAD_META_KEYS = new Set(["file", "filename", "contentType"]);

export function isMediaFileBytes(value: unknown): value is MediaFileBytes {
    if (value == null) {
        return false;
    }

    if (typeof Blob !== "undefined" && value instanceof Blob) {
        return true;
    }

    return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

export function isMediaUploadPayload(value: unknown): value is MediaUploadPayload {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate.filename === "string"
        && candidate.filename.length > 0
        && isMediaFileBytes(candidate.file);
}

export function mediaUploadFields(payload: MediaUploadPayload): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
        if (MEDIA_UPLOAD_META_KEYS.has(key) || value === undefined) {
            continue;
        }

        fields[key] = value;
    }

    return fields;
}
