import http from "node:http";
import { isExplicitResponse, isResponseData, response, send, type ResponseData } from "./response.js";
import { type HandlerConfig, type ListenOptions, type RequestContext, type Route } from "./types.js";
import { type Stage, type StageName } from "../pipeline/index.js";
export type { CorsOptions, Endpoint, ListenOptions, RequestContext, Route, RouteContract, } from "./types.js";
export { DEFAULT_BODY_LIMIT_BYTES, DEFAULT_HEADERS_TIMEOUT_MS, DEFAULT_KEEP_ALIVE_TIMEOUT_MS, DEFAULT_LISTEN_HOST, DEFAULT_REQUEST_TIMEOUT_MS, } from "./types.js";
export type { PipelineContext, Stage, StageName } from "../pipeline/index.js";
export { STAGE_NAMES } from "../pipeline/index.js";
export type { ResponseData };
export { isExplicitResponse, isResponseData, response, send };
export declare class Seltzer {
    private routes;
    private config;
    private readonly pipeline;
    constructor();
    static init(): Seltzer;
    /** Register a single object-based route. Do not model APIs as promise chains. */
    route<TContext extends RequestContext<any> = RequestContext>(route: Route<TContext>): this;
    /**
     * Insert a stage immediately before the builtin stage named `name`.
     * Returning `ResponseData` short-circuits remaining stages and jumps to `send`.
     */
    before(name: StageName, stage: Stage): this;
    /**
     * Swap the builtin stage named `name`. `before` still inserts ahead of it.
     * Nectarine uses this to hang full contract checks on `validate`.
     */
    replace(name: StageName, stage: Stage): this;
    handler(config: HandlerConfig): this;
    /**
     * Bind a Node `http.Server`.
     *
     * Default host is `127.0.0.1`. Pass `host: "0.0.0.0"` (or `"::"`) to
     * accept connections from other machines. Header, request, and
     * keep-alive timeouts are on by default; pass `0` on an option to
     * disable that timer.
     *
     * The return value is the real `http.Server`. `server.close()` stops
     * accepting new connections. The close callback waits for open
     * connections; idle keep-alive sockets hold it until
     * `keepAliveTimeout` unless the host also calls
     * `server.closeIdleConnections()`.
     *
     * CORS headers are off unless `cors` is set. When it is set, `OPTIONS`
     * is a 204 preflight before the pipeline. `bodyLimit` defaults to
     * 1 MB (`0` is unlimited). A larger body is 413 and is not read further.
     */
    listen<TLocals = unknown>(port: number, options?: ListenOptions<TLocals>): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    private handleRequest;
}
