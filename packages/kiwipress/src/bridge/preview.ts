/**
 * Wire values for KiwiPress draft preview.
 *
 * The plugin signs the token. These helpers only find it and decode the
 * payload for routing. They do not check the HMAC. Call `Bridge.preview()`
 * before trusting anything in the claims.
 */

/** Query parameter on the frontend preview URL. */
export const PREVIEW_QUERY_PARAM = "kiwipress_preview";

/** Header `GET /wp-json/kiwipress/v1/preview` reads instead of an application password. */
export const PREVIEW_HEADER = "X-KiwiPress-Preview";

/** Response headers the plugin sets on the preview document and on token errors. */
export const PREVIEW_RESPONSE_HEADERS = {
    "Cache-Control": "no-store, private",
    "X-Robots-Tag": "noindex"
} as const;

export type PreviewSource = "post" | "autosave";

/** Payload inside `kp1.<payload>.<signature>`. Signature is not checked here. */
export type PreviewTokenClaims = {
    v: number;
    iss: string;
    pid: number;
    pt: string;
    src: PreviewSource;
    uid: number;
    iat: number;
    exp: number;
    jti: string;
};

export type PreviewLinkSource = "auto" | "post" | "autosave";

export type PreviewLink = {
    token: string;
    url: string;
    expires_at: string;
};

export type PreviewPost = {
    id?: number;
    title?: { raw?: string; rendered?: string };
    content?: { raw?: string; rendered?: string };
    excerpt?: { raw?: string; rendered?: string };
    modified?: string;
    [key: string]: unknown;
};

export type PreviewDocument = {
    preview: true;
    source: PreviewSource;
    post_id: number;
    post_type: string;
    expires_at: string;
    post: PreviewPost;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function decodeBase64Url(value: string): string | null {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
        return null;
    }

    const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
    const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");

    try {
        if (typeof Buffer !== "undefined") {
            return Buffer.from(normalized, "base64").toString("utf8");
        }
        if (typeof atob !== "undefined") {
            const binary = atob(normalized);
            const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        }
    } catch {
        return null;
    }

    return null;
}

function isPreviewSource(value: unknown): value is PreviewSource {
    return value === "post" || value === "autosave";
}

/**
 * Pull `kiwipress_preview` off an absolute or relative URL.
 * Returns null when the parameter is missing or empty.
 */
export function previewTokenFromUrl(value: string, base = "http://kiwipress.local"): string | null {
    if (typeof value !== "string" || value.trim() === "") {
        return null;
    }

    try {
        const url = new URL(value, base);
        const token = url.searchParams.get(PREVIEW_QUERY_PARAM);
        if (!token || token.trim() === "") {
            return null;
        }
        return token;
    } catch {
        return null;
    }
}

/**
 * Decode the payload of a `kp1.` token without checking the signature.
 * Use this for routing and expiry hints only.
 */
export function decodePreviewTokenUnverified(token: string): PreviewTokenClaims | null {
    if (typeof token !== "string") {
        return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "kp1" || !parts[1] || !parts[2]) {
        return null;
    }

    const json = decodeBase64Url(parts[1]);
    if (!json) {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        return null;
    }

    if (!isRecord(parsed)) {
        return null;
    }

    const { v, iss, pid, pt, src, uid, iat, exp, jti } = parsed;
    if (v !== 1 || typeof iss !== "string" || iss === "") {
        return null;
    }
    if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0) {
        return null;
    }
    if (typeof pt !== "string" || pt === "" || !isPreviewSource(src)) {
        return null;
    }
    if (typeof uid !== "number" || !Number.isInteger(uid) || uid <= 0) {
        return null;
    }
    if (typeof iat !== "number" || typeof exp !== "number" || typeof jti !== "string" || jti === "") {
        return null;
    }

    return { v: 1, iss, pid, pt, src, uid, iat, exp, jti };
}

export function parsePreviewLink(body: unknown): PreviewLink | null {
    if (!isRecord(body) || typeof body.token !== "string" || typeof body.url !== "string" || typeof body.expires_at !== "string") {
        return null;
    }
    if (body.token === "" || body.expires_at === "") {
        return null;
    }

    try {
        const url = new URL(body.url);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return null;
        }
    } catch {
        return null;
    }

    return {
        token: body.token,
        url: body.url,
        expires_at: body.expires_at
    };
}

export function parsePreviewDocument(body: unknown): PreviewDocument | null {
    if (!isRecord(body) || body.preview !== true || !isPreviewSource(body.source)) {
        return null;
    }
    if (typeof body.post_id !== "number" || typeof body.post_type !== "string" || typeof body.expires_at !== "string") {
        return null;
    }
    if (!isRecord(body.post)) {
        return null;
    }

    return {
        preview: true,
        source: body.source,
        post_id: body.post_id,
        post_type: body.post_type,
        expires_at: body.expires_at,
        post: body.post
    };
}
