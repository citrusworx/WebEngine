import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { isResponseData, send, type ResponseData } from "./response.js";
import type {
    CorsOptions,
    HandlerConfig,
    ListenOptions,
    RequestContext,
    Route,
} from "./types.js";
import {
    compileRoute,
    createDefaultPipeline,
    Pipeline,
    type PipelineContext,
    type Stage,
    type StageName,
} from "../pipeline/index.js";

export type {
    CorsOptions,
    Endpoint,
    ListenOptions,
    RequestContext,
    Route,
} from "./types.js";
export type { PipelineContext, Stage, StageName } from "../pipeline/index.js";
export { STAGE_NAMES } from "../pipeline/index.js";
export type { ResponseData };
export { isResponseData, send };

function applyCors(
    req: IncomingMessage,
    res: ServerResponse,
    cors: CorsOptions | undefined,
) {
    if (!cors) {
        return;
    }

    const requestOrigin = req.headers.origin;
    if (!requestOrigin) {
        return;
    }

    if (cors.origin && requestOrigin !== cors.origin) {
        return;
    }

    res.setHeader("Access-Control-Allow-Origin", cors.origin ?? requestOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
        "Access-Control-Allow-Methods",
        (cors.methods ?? ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]).join(","),
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        (cors.headers ?? ["Content-Type"]).join(","),
    );
}

export class Seltzer {
    private routes: ReturnType<typeof compileRoute>[] = [];
    private config: HandlerConfig | null = null;
    private readonly pipeline: Pipeline;

    constructor() {
        this.pipeline = createDefaultPipeline(() => this.routes);
    }

    static init() {
        return new Seltzer();
    }

    /** Register a single object-based route. Do not model APIs as promise chains. */
    route<TContext extends RequestContext<any> = RequestContext>(route: Route<TContext>) {
        this.routes.push(compileRoute(route as Route));
        return this;
    }

    /**
     * Insert a stage immediately before the builtin stage named `name`.
     * Returning `ResponseData` short-circuits remaining stages and jumps to `send`.
     */
    before(name: StageName, stage: Stage) {
        this.pipeline.before(name, stage);
        return this;
    }

    handler(config: HandlerConfig) {
        this.config = config;
        return this;
    }

    listen<TLocals = unknown>(port: number, options: ListenOptions<TLocals> = {}) {
        if (typeof process === "undefined" || !process.versions?.node) {
            throw new Error("Seltzer.listen requires a Node.js runtime.");
        }

        const locals = (options.locals ?? {}) as TLocals;

        const server = http.createServer((req, res) => {
            void this.handleRequest(req, res, locals, options.cors);
        });

        server.listen(port, () => {
            if (options.onListening) {
                options.onListening(port);
            } else {
                console.log(`Seltzer server listening on port ${port}`);
            }
        });

        return server;
    }

    private async handleRequest<TLocals>(
        req: IncomingMessage,
        res: ServerResponse,
        locals: TLocals,
        cors: CorsOptions | undefined,
    ) {
        applyCors(req, res, cors);

        if (req.method === "OPTIONS") {
            send(res, { status: 204 });
            return;
        }

        const ctx: PipelineContext<TLocals> = {
            req,
            res,
            method: req.method ?? "GET",
            path: "",
            query: {},
            params: {},
            body: undefined,
            headers: {},
            locals,
            options: this.config?.options,
        };

        await this.pipeline.run(ctx);
    }
}
