import type { IncomingMessage, ServerResponse } from "node:http";
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
