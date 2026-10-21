export type BridgeErrorCode = "bad_credentials" | "insufficient_role" | "plugin_missing" | "site_unreachable" | "request_failed";
/**
 * Typed failure from the KiwiPress Bridge client.
 *
 * - `bad_credentials` — WordPress rejected the username or application password (HTTP 401).
 * - `insufficient_role` — the user is authenticated but lacks `manage_options`.
 * - `plugin_missing` — `kiwipress/v1` returned HTTP 404.
 * - `site_unreachable` — the site did not answer (DNS, connection, or timeout).
 * - `request_failed` — WordPress answered with some other unexpected result.
 */
export declare class BridgeError extends Error {
    readonly code: BridgeErrorCode;
    readonly status?: number;
    constructor(code: BridgeErrorCode, message: string, status?: number);
}
export declare function isBridgeError(error: unknown): error is BridgeError;
