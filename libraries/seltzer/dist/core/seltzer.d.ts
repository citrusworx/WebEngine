import http from "node:http";
import { isExplicitResponse, isResponseData, response, send, type ResponseData } from "./response.js";
import type { HandlerConfig, ListenOptions, RequestContext, Route } from "./types.js";
import { type Stage, type StageName } from "../pipeline/index.js";
export type { CorsOptions, Endpoint, ListenOptions, RequestContext, Route, RouteContract, } from "./types.js";
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
    listen<TLocals = unknown>(port: number, options?: ListenOptions<TLocals>): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    private handleRequest;
}
