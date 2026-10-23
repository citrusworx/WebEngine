/**
 * Wire values for KiwiPress draft preview.
 *
 * The plugin signs the token. These helpers only find it and decode the
 * payload for routing. They do not check the HMAC. Call `Bridge.preview()`
 * before trusting anything in the claims.
 */
/** Query parameter on the frontend preview URL. */
export declare const PREVIEW_QUERY_PARAM = "kiwipress_preview";
/** Header `GET /wp-json/kiwipress/v1/preview` reads instead of an application password. */
export declare const PREVIEW_HEADER = "X-KiwiPress-Preview";
/** Response headers the plugin sets on the preview document and on token errors. */
export declare const PREVIEW_RESPONSE_HEADERS: {
    readonly "Cache-Control": "no-store, private";
    readonly "X-Robots-Tag": "noindex";
};
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
    title?: {
        raw?: string;
        rendered?: string;
    };
    content?: {
        raw?: string;
        rendered?: string;
    };
    excerpt?: {
        raw?: string;
        rendered?: string;
    };
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
/**
 * Pull `kiwipress_preview` off an absolute or relative URL.
 * Returns null when the parameter is missing or empty.
 */
export declare function previewTokenFromUrl(value: string, base?: string): string | null;
/**
 * Decode the payload of a `kp1.` token without checking the signature.
 * Use this for routing and expiry hints only.
 */
export declare function decodePreviewTokenUnverified(token: string): PreviewTokenClaims | null;
export declare function parsePreviewLink(body: unknown): PreviewLink | null;
export declare function parsePreviewDocument(body: unknown): PreviewDocument | null;
