export type BridgeErrorCode = "bad_credentials" | "insufficient_role" | "plugin_missing" | "site_unreachable" | "request_failed" | "preview_missing" | "preview_invalid" | "preview_expired" | "preview_forbidden" | "preview_disabled" | "preview_not_found";
/**
 * Typed failure from the KiwiPress Bridge client.
 *
 * - `bad_credentials` — WordPress rejected the username or application password (HTTP 401).
 * - `insufficient_role` — the user is authenticated but lacks `manage_options`.
 * - `plugin_missing` — `kiwipress/v1` returned HTTP 404.
 * - `site_unreachable` — the site did not answer (DNS, connection, or timeout).
 * - `request_failed` — WordPress answered with some other unexpected result.
 * - `preview_missing` — `GET /preview` had no `X-KiwiPress-Preview` token.
 * - `preview_invalid` — the preview token is malformed or the signature does not match.
 * - `preview_expired` — the signature matched and the token is past its expiry (plus skew).
 * - `preview_forbidden` — the embedded user can no longer edit the post.
 * - `preview_disabled` — the site is not paired, so draft preview is off.
 * - `preview_not_found` — the post is missing, trashed, or not exposed in REST.
 */
export declare class BridgeError extends Error {
    readonly code: BridgeErrorCode;
    readonly status?: number;
    constructor(code: BridgeErrorCode, message: string, status?: number);
}
export declare function isBridgeError(error: unknown): error is BridgeError;
