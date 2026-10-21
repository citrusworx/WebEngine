export type BridgeErrorCode =
    | "bad_credentials"
    | "insufficient_role"
    | "plugin_missing"
    | "site_unreachable"
    | "request_failed";

/**
 * Typed failure from the KiwiPress Bridge client.
 *
 * - `bad_credentials` — WordPress rejected the username or application password (HTTP 401).
 * - `insufficient_role` — the user is authenticated but lacks `manage_options`.
 * - `plugin_missing` — `kiwipress/v1` returned HTTP 404.
 * - `site_unreachable` — the site did not answer (DNS, connection, or timeout).
 * - `request_failed` — WordPress answered with some other unexpected result.
 */
export class BridgeError extends Error {
    readonly code: BridgeErrorCode;
    readonly status?: number;

    constructor(code: BridgeErrorCode, message: string, status?: number) {
        super(message);
        this.name = "BridgeError";
        this.code = code;
        this.status = status;
    }
}

export function isBridgeError(error: unknown): error is BridgeError {
    return error instanceof BridgeError;
}
