import { type ClientCallOptions, type Endpoint } from "../types.js";
/**
 * Non-2xx HTTP response.
 * `body` is parsed with the same Content-Type rules as a success result.
 * `headers` keys are lowercase, as Fetch reports them.
 */
export declare class HttpError extends Error {
    readonly code: "HTTP_ERROR";
    readonly status: number;
    readonly statusText: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly body: unknown;
    constructor(status: number, statusText: string, headers: Record<string, string>, body: unknown, rawText: string);
}
/** The deadline elapsed. Not an `HttpError`: the server may still be working. */
export declare class TimeoutError extends Error {
    readonly code: "TIMEOUT";
    readonly timeoutMs: number;
    constructor(timeoutMs: number);
}
/** The caller's `AbortSignal` aborted the request. Checked before the timeout. */
export declare class AbortError extends Error {
    readonly code: "ABORTED";
    readonly reason: unknown;
    constructor(reason?: unknown);
}
/** DNS, connection, or other transport failure. The response never arrived. */
export declare class NetworkError extends Error {
    readonly code: "NETWORK";
    readonly cause?: unknown;
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
/** `baseUrl` / `path` could not be turned into an http(s) URL. No request was sent. */
export declare class UrlError extends Error {
    readonly code: "INVALID_URL";
    constructor(message: string);
}
export type ClientConfig = {
    /**
     * Milliseconds for every call. Default {@link DEFAULT_CLIENT_TIMEOUT_MS} (30s).
     * `0` disables. A call's `options.timeout` overrides this, including `0`.
     */
    timeout?: number;
    /** Used when a call does not set `options.baseUrl`. */
    baseUrl?: string;
    /** Sent on every call. Per-call `options.headers` override the same name. */
    headers?: Record<string, string>;
};
export type SeltzerClient = {
    get(endpoint: Endpoint): Promise<unknown>;
    head(endpoint: Endpoint): Promise<unknown>;
    post(endpoint: Endpoint, data?: unknown): Promise<unknown>;
    put(endpoint: Endpoint, data?: unknown): Promise<unknown>;
    patch(endpoint: Endpoint, data?: unknown): Promise<unknown>;
    delete(endpoint: Endpoint): Promise<unknown>;
};
/**
 * Build a client. There is no retry loop: a 5xx, a timeout, and a dropped
 * connection are each one attempt. Repeat the call yourself.
 * Server-side idempotency is not implemented here. Send `Idempotency-Key`
 * by putting it in `headers` if the server understands it.
 */
export declare function createClient(config?: ClientConfig): SeltzerClient;
/** Default client: 30s timeout, no base URL, no extra headers, no retries. */
export declare const client: SeltzerClient;
/**
 * Join `baseUrl` and `path` with one slash at the boundary.
 * A base path is kept: `/api/v1` + `users` is `/api/v1/users`.
 * Leading slashes on `path` and trailing slashes on the base path are the boundary.
 * Other slashes, including a trailing slash on `path`, are preserved.
 * The path is not re-encoded. `options.query` is appended.
 * An absolute `path` throws unless `allowAbsoluteUrl` is set.
 */
export declare function resolveRequestUrl(baseUrl: string | undefined, path: string, options?: ClientCallOptions): string;
