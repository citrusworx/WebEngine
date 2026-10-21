import http from "node:http";
import type { RequestListener } from "node:http";
import { isExplicitResponse, isResponseData, response, send, type ResponseData, type SendOptions } from "./response.js";
import { type HandlerConfig, type InitOptions, type ListenOptions, type RequestContext, type Route } from "./types.js";
import { type Stage, type StageName } from "../pipeline/index.js";
export type { ClientCallOptions, CorsOptions, Endpoint, HostOptions, InitOptions, ListenOptions, QueryInput, QueryPrimitive, QueryValue, RequestContext, Route, RouteContract, ValidatedInput, } from "./types.js";
export { DEFAULT_BODY_LIMIT_BYTES, DEFAULT_CLIENT_TIMEOUT_MS, DEFAULT_HEADERS_TIMEOUT_MS, DEFAULT_KEEP_ALIVE_TIMEOUT_MS, DEFAULT_LISTEN_HOST, DEFAULT_REQUEST_TIMEOUT_MS, } from "./types.js";
export type { PipelineContext, Stage, StageName } from "../pipeline/index.js";
export { STAGE_NAMES } from "../pipeline/index.js";
export type { ResponseData, SendOptions };
export type { SeltzerLogger } from "./log.js";
export type { ValidationIssue } from "./validation.js";
export { validationError } from "./validation.js";
export { isExplicitResponse, isResponseData, response, send };
export declare class Seltzer {
    private routes;
    private config;
    private foundation;
    /**
     * Set only for the synchronous `handler()` call inside `listen`, so that
     * server snapshots listen overrides without changing later `app.handler()` calls.
     */
    private listenerOverride;
    private readonly pipeline;
    constructor();
    /**
     * Create an app. Pass `bodyLimit`, `cors`, `logger`, `debug`, and `locals`
     * here when every server for this app should share them.
     * `credentials: true` with `origin: "*"` throws here, before `listen`.
     * A non-integer or negative `bodyLimit` throws here when you pass it.
     */
    static init<TLocals = unknown>(options?: InitOptions<TLocals>): Seltzer;
    /** Register a single object-based route. Do not model APIs as promise chains. */
    route<TContext extends RequestContext<any> = RequestContext>(route: Route<TContext>): this;
    /**
     * Insert a stage immediately before the builtin stage named `name`.
     * Returning `ResponseData` short-circuits remaining stages and jumps to `send`.
     */
    before(name: StageName, stage: Stage): this;
    /**
     * Swap the builtin stage named `name`. `before` still inserts ahead of it.
     * Hosts use this to hang richer checks on `validate`. That replacement
     * removes the builtin, including `.required` presence checks.
     */
    replace(name: StageName, stage: Stage): this;
    /**
     * Two calls share this name. The argument decides which one runs.
     *
     * `handler()` with no arguments returns a Node request listener,
     * `(req, res) => void`. Mount it on a server the host owns:
     * `http.createServer(app.handler())` or
     * `https.createServer(tlsOptions, app.handler())`.
     * That listener runs the same pipeline as `listen`. It uses `bodyLimit`,
     * `cors`, `logger`, `debug`, and `locals` from `init`. It does not bind
     * a port and it does not set server timeouts. The host owns those.
     * A `listen` override applies only to the server `listen` creates.
     * Calling `handler()` again still returns a listener from `init`.
     *
     * `handler(config)` stores `config` and returns this app. `config.options`
     * is copied onto `ctx.options`. `adapter` is unused inbound. That call is
     * not a request listener. Passing a config object never returns a function.
     */
    handler(): RequestListener;
    handler(config: HandlerConfig): this;
    /**
     * Bind a Node `http.Server`.
     *
     * This is `http.createServer` of the same listener `handler()` returns,
     * plus the loopback default and the timeout defaults. Default host is
     * `127.0.0.1`. Pass `host: "0.0.0.0"` (or `"::"`) to accept connections
     * from other machines. Header, request, and keep-alive timeouts are on
     * by default; pass `0` on an option to disable that timer. Those timers
     * belong to this server. `handler()` does not set them.
     *
     * `bodyLimit`, `cors`, `logger`, `debug`, and `locals` passed here replace
     * the `init` values for this server only. An omitted field keeps the init
     * value. `cors` is replaced as a whole object, not merged field by field.
     * `app.handler()` keeps using `init`.
     *
     * The return value is the real `http.Server`. `server.close()` stops
     * accepting new connections. The close callback waits for open
     * connections; idle keep-alive sockets hold it until
     * `keepAliveTimeout` unless the host also calls
     * `server.closeIdleConnections()`.
     *
     * CORS headers are off unless `cors` is set on `init` or here. When it
     * is set, `OPTIONS` is a 204 preflight before the pipeline. `bodyLimit`
     * defaults to 1 MB (`0` is unlimited). A larger body is 413 and is not
     * read further.
     *
     * `logger` receives one line for a bad handler/hook return or a thrown
     * error. The default is `console.error`. `debug: true` adds stack traces
     * to those lines. The HTTP body of a thrown error stays generic.
     */
    listen<TLocals = unknown>(port: number, options?: ListenOptions<TLocals>): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    private requestListener;
    private handleRequest;
}
