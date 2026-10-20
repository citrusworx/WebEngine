import type { IncomingMessage, ServerResponse } from "node:http";
import type { SeltzerLogger } from "./log.js";
import type { ResponseData } from "./response.js";

export type Endpoint = {
    route?: Route;
    path: string;
    endpoint: string;
    options?: {
        baseUrl?: string;
        headers?: Record<string, string>;
        allowSelfSigned?: boolean;
    };
};

export type RequestContext<TLocals = unknown> = {
    /**
     * Inbound message. Read `socket` or raw headers when the normalized
     * context is not enough. The body stream is already consumed by `parse`.
     * This is not a response API.
     */
    req: IncomingMessage;
    /**
     * Node response. Handlers and hooks must not write it: `writeHead`,
     * `end`, `write`, `setHeader`, and assignment throw. Return `ResponseData`.
     * `ctx.json` and `ctx.send` are not on this type; calling them throws.
     */
    res: ServerResponse;
    method: string;
    path: string;
    query: Record<string, string>;
    params: Record<string, string>;
    body: unknown;
    headers: Record<string, string>;
    locals: TLocals;
    options?: {
        baseUrl?: string;
        headers?: Record<string, string>;
        allowSelfSigned?: boolean;
    };
};

/**
 * Optional contract metadata for the `validate` stage.
 * `generateRoutes` copies `ApiOperation` `resource` / `name` / `body` here.
 * Nectarine can later `replace("validate", …)` and read the same field.
 */
export type RouteContract = {
    resource?: string;
    name?: string;
    /** YAML body field specs, e.g. `{ email: "string.required" }`. */
    body?: Record<string, string>;
};

export type Route<TContext = RequestContext> = {
    method: string;
    path: string;
    handler: (ctx: TContext) => ResponseData | Promise<ResponseData>;
    contract?: RouteContract;
};

export type HandlerConfig = {
    adapter: string;
    options: {
        baseUrl?: string;
        headers?: Record<string, string>;
        allowSelfSigned?: boolean;
    };
};

export type CorsOptions = {
    /**
     * Allowed origin. A specific origin must equal the request `Origin`.
     * `"*"` sends `Access-Control-Allow-Origin: *` and cannot be combined
     * with `credentials: true`. Omit to reflect the request `Origin`.
     */
    origin?: string;
    methods?: string[];
    headers?: string[];
    /**
     * Seconds for `Access-Control-Max-Age` on CORS responses.
     * Omit to leave the header off. `0` is sent as `0`.
     */
    maxAge?: number;
    /**
     * When true, send `Access-Control-Allow-Credentials: true`.
     * Throws at `listen` if combined with `origin: "*"`.
     */
    credentials?: boolean;
};

/** Default request body limit. `listen({ bodyLimit: 0 })` means unlimited. */
export const DEFAULT_BODY_LIMIT_BYTES = 1_048_576;

/** Default `listen` bind. Public interfaces require an explicit `host`. */
export const DEFAULT_LISTEN_HOST = "127.0.0.1";

/**
 * Milliseconds to receive complete HTTP headers.
 * Greater than {@link DEFAULT_KEEP_ALIVE_TIMEOUT_MS} so Node does not
 * answer idle keep-alive sockets with 408.
 */
export const DEFAULT_HEADERS_TIMEOUT_MS = 20_000;

/**
 * Milliseconds for the entire request, including the body.
 * Tighter than Node's 5-minute default. `0` disables the timer.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/** Milliseconds an idle keep-alive socket may wait for the next request. */
export const DEFAULT_KEEP_ALIVE_TIMEOUT_MS = 5_000;

export type ListenOptions<TLocals = unknown> = {
    /**
     * Bind address. Default {@link DEFAULT_LISTEN_HOST} (`127.0.0.1`).
     * Pass `"0.0.0.0"` or `"::"` to accept connections from other machines.
     */
    host?: string;
    locals?: TLocals;
    cors?: CorsOptions;
    /**
     * Maximum request body size in bytes for methods other than GET and HEAD.
     * Default {@link DEFAULT_BODY_LIMIT_BYTES} (1 MB). `0` means unlimited.
     * A larger body is 413 and is not read to completion.
     */
    bodyLimit?: number;
    /**
     * Milliseconds to receive the complete HTTP headers.
     * Default {@link DEFAULT_HEADERS_TIMEOUT_MS}. `0` disables the timer.
     */
    headersTimeout?: number;
    /**
     * Milliseconds for the entire request, including the body.
     * Default {@link DEFAULT_REQUEST_TIMEOUT_MS}. `0` disables the timer.
     * Must be `0` or greater than or equal to `headersTimeout`.
     */
    requestTimeout?: number;
    /**
     * Milliseconds an idle keep-alive socket may wait for the next request.
     * Default {@link DEFAULT_KEEP_ALIVE_TIMEOUT_MS}. `0` disables the timer.
     * When `headersTimeout` is non-zero, this must be smaller.
     */
    keepAliveTimeout?: number;
    /**
     * Called with the bound TCP port once the server is listening.
     * `listen(0)` reports the ephemeral port, not `0`.
     */
    onListening?: (port: number) => void;
    /**
     * Receives one formatted line for handler/hook failures.
     * Default is `console.error`. The HTTP body never includes the stack.
     */
    logger?: SeltzerLogger;
    /**
     * When true, logged thrown errors include the stack trace.
     * Off by default. Does not change the HTTP body.
     */
    debug?: boolean;
};
