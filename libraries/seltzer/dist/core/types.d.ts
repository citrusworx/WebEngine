import type { IncomingMessage, ServerResponse } from "node:http";
import type { SeltzerLogger } from "./log.js";
import type { ResponseData } from "./response.js";
/**
 * Options stored by `adapter(config)` and copied onto inbound `ctx.options`.
 * `handler(config)` is a deprecated alias of that call. This is not the
 * `app.handler()` request listener. The config call returns the app.
 * The outbound client does not read this object unless you pass it on an `Endpoint`.
 */
export type HostOptions = {
    baseUrl?: string;
    headers?: Record<string, string>;
};
/** A single query value. `null` and `undefined` are omitted. */
export type QueryPrimitive = string | number | boolean | null | undefined;
/** A query value, or an array of values that repeat the same key. */
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[];
/**
 * Query string appended by the client.
 * `null` and `undefined` (including inside arrays) are omitted.
 * Arrays repeat the key. Objects are rejected.
 * Values are encoded with `URLSearchParams` (`+` for spaces).
 */
export type QueryInput = Record<string, QueryValue>;
/**
 * Per-call options for `client` / `createClient`.
 * `timeout` overrides the client default. `0` disables the timer.
 */
export type ClientCallOptions = HostOptions & {
    timeout?: number;
    /** Merged with the timeout. Caller abort wins over the deadline. */
    signal?: AbortSignal;
    query?: QueryInput;
    /**
     * When true, an `http:` or `https:` `path` is fetched as-is and `baseUrl`
     * is not joined. Otherwise an absolute `path` throws `UrlError`.
     */
    allowAbsoluteUrl?: boolean;
};
export type Endpoint = {
    route?: Route;
    path: string;
    endpoint: string;
    options?: ClientCallOptions;
};
/**
 * Values produced by a replacement `validate` stage.
 * Each field is optional because a stage may parse only the body,
 * only params, or only the query string.
 */
export type ValidatedInput<TBody = unknown, TParams = unknown, TQuery = unknown> = {
    body?: TBody;
    params?: TParams;
    query?: TQuery;
};
export type RequestContext<TLocals = unknown, TValid extends ValidatedInput = ValidatedInput> = {
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
    /**
     * Raw body from `parse`. JSON values, a UTF-8 string, or `undefined`.
     * A replacement validator must not replace this with its parsed output;
     * that output belongs on `valid`.
     */
    body: unknown;
    /**
     * Parsed input from a replacement `validate` stage.
     * The default stage does not assign this. On a normal request it stays
     * `undefined` unless an earlier hook set it. `body`, `params`, and
     * `query` on this object are the parsed values; the same-named fields
     * on the context stay raw.
     */
    valid?: TValid;
    headers: Record<string, string>;
    locals: TLocals;
    options?: HostOptions;
};
/**
 * Optional contract metadata for the `validate` stage.
 * `generateRoutes` copies `ApiOperation` `resource` / `name` / `body` here.
 * These are YAML field specs, not schemas. A replacement validator dispatches
 * on `method` + `path` or on `name` / `resource` itself.
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
/**
 * Stored by `adapter(config)`. `options` is copied onto `ctx.options`.
 * `adapter` is unused inbound. `handler(config)` is a deprecated alias.
 */
export type HandlerConfig = {
    adapter: string;
    options: HostOptions;
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
     * Throws at `init` or `listen` if combined with `origin: "*"`.
     */
    credentials?: boolean;
};
/** Default request body limit. `bodyLimit: 0` on `init` or `listen` means unlimited. */
export declare const DEFAULT_BODY_LIMIT_BYTES = 1048576;
/** Default `listen` bind. Public interfaces require an explicit `host`. */
export declare const DEFAULT_LISTEN_HOST = "127.0.0.1";
/**
 * Milliseconds to receive complete HTTP headers.
 * Greater than {@link DEFAULT_KEEP_ALIVE_TIMEOUT_MS} so Node does not
 * answer idle keep-alive sockets with 408.
 */
export declare const DEFAULT_HEADERS_TIMEOUT_MS = 20000;
/**
 * Milliseconds for the entire request, including the body.
 * Tighter than Node's 5-minute default. `0` disables the timer.
 */
export declare const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
/**
 * Default outbound client deadline. Same number as {@link DEFAULT_REQUEST_TIMEOUT_MS}.
 * `createClient({ timeout: 0 })` or `options.timeout: 0` disables it.
 */
export declare const DEFAULT_CLIENT_TIMEOUT_MS = 30000;
/** Milliseconds an idle keep-alive socket may wait for the next request. */
export declare const DEFAULT_KEEP_ALIVE_TIMEOUT_MS = 5000;
/**
 * Request options for `Seltzer.init`.
 * `listen` still accepts each field. A field passed to `listen` replaces the
 * init value for that server. `cors` is replaced as a whole object.
 * Bind address, port, and server timeouts are not here: they belong to `listen`
 * or to the host-owned server.
 */
export type InitOptions<TLocals = unknown> = {
    /** Copied onto `ctx.locals`. `listen({ locals })` replaces this for that server. */
    locals?: TLocals;
    cors?: CorsOptions;
    /**
     * Maximum request body size in bytes for methods other than GET and HEAD.
     * Default {@link DEFAULT_BODY_LIMIT_BYTES} (1 MB). `0` means unlimited.
     * A larger body is 413 and is not read to completion.
     * Checked when `init` is called if you pass it, and again for the listener.
     */
    bodyLimit?: number;
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
export type ListenOptions<TLocals = unknown> = {
    /**
     * Bind address. Default {@link DEFAULT_LISTEN_HOST} (`127.0.0.1`).
     * Pass `"0.0.0.0"` or `"::"` to accept connections from other machines.
     * Not an `init` option. A host-owned server chooses its own address.
     */
    host?: string;
    /**
     * Replaces `init({ locals })` for this server when passed.
     * Omit to keep the init value (`{}` when init omitted it).
     */
    locals?: TLocals;
    /**
     * Replaces `init({ cors })` for this server when passed.
     * The object is not merged field by field. Omit to keep the init value.
     */
    cors?: CorsOptions;
    /**
     * Maximum request body size in bytes for methods other than GET and HEAD.
     * Default {@link DEFAULT_BODY_LIMIT_BYTES} (1 MB) unless `init({ bodyLimit })`
     * set another value. Passed here, this replaces the init value for this server.
     * `0` means unlimited. A larger body is 413 and is not read to completion.
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
     * Default is `console.error`, or the `init({ logger })` function when that
     * was set and this field is omitted. Passed here, this replaces it for this server.
     * The HTTP body never includes the stack.
     */
    logger?: SeltzerLogger;
    /**
     * When true, logged thrown errors include the stack trace.
     * Off by default. Does not change the HTTP body.
     * Passed here, including `false`, this replaces `init({ debug })` for this server.
     */
    debug?: boolean;
};
