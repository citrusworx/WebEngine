import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
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
    req: IncomingMessage;
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
    json: (data: unknown, status?: number) => void;
};
export type Route<TContext = RequestContext> = {
    method: string;
    path: string;
    handler: (ctx: TContext) => unknown | Promise<unknown>;
};
type HandlerConfig = {
    adapter: string;
    options: {
        baseUrl?: string;
        headers?: Record<string, string>;
        allowSelfSigned?: boolean;
    };
};
export type CorsOptions = {
    /** Exact allowed origin, or omit to reflect request Origin when present. */
    origin?: string;
    methods?: string[];
    headers?: string[];
};
export type ListenOptions<TLocals = unknown> = {
    locals?: TLocals;
    cors?: CorsOptions;
    onListening?: (port: number) => void;
};
export declare class Seltzer {
    private routes;
    private config;
    static init(): Seltzer;
    /** Register a single object-based route. Do not model APIs as promise chains. */
    route<TContext extends RequestContext<any> = RequestContext>(route: Route<TContext>): this;
    handler(config: HandlerConfig): this;
    listen<TLocals = unknown>(port: number, options?: ListenOptions<TLocals>): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    private handleRequest;
}
export {};
