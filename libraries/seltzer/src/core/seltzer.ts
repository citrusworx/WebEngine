import http from "node:http";
import type { IncomingMessage, RequestListener, ServerResponse } from "node:http";
import { installRemovedResponseMethods } from "./raw-response.js";
import {
    isExplicitResponse,
    isResponseData,
    response,
    send,
    type ResponseData,
    type SendOptions,
} from "./response.js";
import {
    DEFAULT_BODY_LIMIT_BYTES,
    DEFAULT_HEADERS_TIMEOUT_MS,
    DEFAULT_KEEP_ALIVE_TIMEOUT_MS,
    DEFAULT_LISTEN_HOST,
    DEFAULT_REQUEST_TIMEOUT_MS,
    type CorsOptions,
    type HandlerConfig,
    type InitOptions,
    type ListenOptions,
    type RequestContext,
    type Route,
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
    ClientCallOptions,
    CorsOptions,
    Endpoint,
    HostOptions,
    InitOptions,
    ListenOptions,
    QueryInput,
    QueryPrimitive,
    QueryValue,
    RequestContext,
    Route,
    RouteContract,
    ValidatedInput,
} from "./types.js";
export {
    DEFAULT_BODY_LIMIT_BYTES,
    DEFAULT_CLIENT_TIMEOUT_MS,
    DEFAULT_HEADERS_TIMEOUT_MS,
    DEFAULT_KEEP_ALIVE_TIMEOUT_MS,
    DEFAULT_LISTEN_HOST,
    DEFAULT_REQUEST_TIMEOUT_MS,
} from "./types.js";
export type { PipelineContext, Stage, StageName } from "../pipeline/index.js";
export { STAGE_NAMES } from "../pipeline/index.js";
export type { ResponseData, SendOptions };
export type { SeltzerLogger } from "./log.js";
export type { ValidationIssue } from "./validation.js";
export { validationError } from "./validation.js";
export { isExplicitResponse, isResponseData, response, send };

function resolveListenHost(host: string | undefined): string {
    if (host === undefined) {
        return DEFAULT_LISTEN_HOST;
    }

    if (typeof host !== "string") {
        throw new Error(
            'Seltzer.listen host must be a non-empty address. The default is "127.0.0.1". Pass "0.0.0.0" to bind every IPv4 interface.',
        );
    }

    const trimmed = host.trim();
    if (trimmed.length === 0) {
        throw new Error(
            'Seltzer.listen host must be a non-empty address. The default is "127.0.0.1". Pass "0.0.0.0" to bind every IPv4 interface.',
        );
    }

    return trimmed;
}

function requireTimeout(name: string, value: number): number {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(
            `Seltzer.listen ${name} must be a non-negative integer of milliseconds.`,
        );
    }

    return value;
}

function resolveListenTimeouts(options: ListenOptions): {
    headersTimeout: number;
    requestTimeout: number;
    keepAliveTimeout: number;
} {
    const headersTimeout = requireTimeout(
        "headersTimeout",
        options.headersTimeout ?? DEFAULT_HEADERS_TIMEOUT_MS,
    );
    const requestTimeout = requireTimeout(
        "requestTimeout",
        options.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT_MS,
    );
    const keepAliveTimeout = requireTimeout(
        "keepAliveTimeout",
        options.keepAliveTimeout ?? DEFAULT_KEEP_ALIVE_TIMEOUT_MS,
    );

    if (headersTimeout !== 0 && keepAliveTimeout >= headersTimeout) {
        throw new Error(
            "Seltzer.listen keepAliveTimeout must be less than headersTimeout. Node answers keep-alive sockets with 408 when it is not.",
        );
    }

    if (requestTimeout !== 0 && headersTimeout !== 0 && requestTimeout < headersTimeout) {
        throw new Error(
            "Seltzer.listen requestTimeout must be 0 (disabled) or greater than or equal to headersTimeout.",
        );
    }

    return { headersTimeout, requestTimeout, keepAliveTimeout };
}

function formatListenUrl(host: string, port: number): string {
    const shown = host.includes(":") ? `[${host}]` : host;
    return `http://${shown}:${port}`;
}

const DEFAULT_CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_CORS_HEADERS = ["Content-Type"];

type OptionSite = "Seltzer.init" | "Seltzer.listen";

function assertCors(cors: CorsOptions | undefined, site: OptionSite): void {
    if (!cors) {
        return;
    }

    if (cors.credentials === true && cors.origin === "*") {
        throw new Error(
            `${site} cors credentials: true cannot be combined with origin "*". Name a specific origin, or omit origin to reflect the request Origin.`,
        );
    }

    if (cors.maxAge !== undefined && (!Number.isInteger(cors.maxAge) || cors.maxAge < 0)) {
        throw new Error(`${site} cors maxAge must be a non-negative integer of seconds.`);
    }
}

function resolveBodyLimit(bodyLimit: number | undefined, site: OptionSite): number {
    const limit = bodyLimit ?? DEFAULT_BODY_LIMIT_BYTES;
    if (!Number.isInteger(limit) || limit < 0) {
        throw new Error(
            `${site} bodyLimit must be a non-negative integer of bytes. 0 means unlimited.`,
        );
    }

    return limit;
}

/**
 * Listen wins per field when the field is passed. Omitted listen fields keep
 * the init value. `cors` is replaced as a whole object, not merged.
 */
function foundationFromListen(init: InitOptions, options: ListenOptions): InitOptions {
    return {
        bodyLimit: options.bodyLimit !== undefined ? options.bodyLimit : init.bodyLimit,
        cors: options.cors !== undefined ? options.cors : init.cors,
        logger: options.logger !== undefined ? options.logger : init.logger,
        debug: options.debug !== undefined ? options.debug : init.debug,
        locals: options.locals !== undefined ? options.locals : init.locals,
    };
}

/**
 * CORS headers are applied only when `cors` was passed to `init` or `listen`.
 * `Vary: Origin` is set when the allow-origin value is a specific origin
 * (configured or reflected). It is omitted for `origin: "*"`.
 */
function applyCors(req: IncomingMessage, res: ServerResponse, cors: CorsOptions) {
    const requestOrigin = req.headers.origin;
    if (!requestOrigin) {
        return;
    }

    if (cors.origin && cors.origin !== "*" && requestOrigin !== cors.origin) {
        return;
    }

    const allowOrigin = cors.origin === "*" ? "*" : (cors.origin ?? requestOrigin);
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    if (allowOrigin !== "*") {
        res.setHeader("Vary", "Origin");
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        (cors.methods ?? DEFAULT_CORS_METHODS).join(","),
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        (cors.headers ?? DEFAULT_CORS_HEADERS).join(","),
    );

    if (cors.credentials === true) {
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    if (cors.maxAge !== undefined) {
        res.setHeader("Access-Control-Max-Age", String(cors.maxAge));
    }
}

export class Seltzer {
    private routes: ReturnType<typeof compileRoute>[] = [];
    private config: HandlerConfig | null = null;
    private foundation: InitOptions = {};
    /**
     * Set only for the synchronous `handler()` call inside `listen`, so that
     * server snapshots listen overrides without changing later `app.handler()` calls.
     */
    private listenerOverride: { foundation: InitOptions; site: OptionSite } | null = null;
    private readonly pipeline: Pipeline;

    constructor() {
        this.pipeline = createDefaultPipeline(() => this.routes);
    }

    /**
     * Create an app. Pass `bodyLimit`, `cors`, `logger`, `debug`, and `locals`
     * here when every server for this app should share them.
     * `credentials: true` with `origin: "*"` throws here, before `listen`.
     * A non-integer or negative `bodyLimit` throws here when you pass it.
     */
    static init<TLocals = unknown>(options: InitOptions<TLocals> = {}) {
        assertCors(options.cors, "Seltzer.init");
        if (options.bodyLimit !== undefined) {
            resolveBodyLimit(options.bodyLimit, "Seltzer.init");
        }

        const app = new Seltzer();
        app.foundation = {
            bodyLimit: options.bodyLimit,
            cors: options.cors,
            logger: options.logger,
            debug: options.debug,
            locals: options.locals,
        };
        return app;
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

    /**
     * Swap the builtin stage named `name`. `before` still inserts ahead of it.
     * Hosts use this to hang richer checks on `validate`. That replacement
     * removes the builtin, including `.required` presence checks.
     */
    replace(name: StageName, stage: Stage) {
        this.pipeline.replace(name, stage);
        return this;
    }

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
    handler(config?: HandlerConfig): this | RequestListener {
        if (config !== undefined) {
            this.config = config;
            return this;
        }

        if (typeof process === "undefined" || !process.versions?.node) {
            throw new Error("Seltzer.handler requires a Node.js runtime.");
        }

        const override = this.listenerOverride;
        return this.requestListener(
            override?.foundation ?? this.foundation,
            override?.site ?? "Seltzer.init",
        );
    }

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
    listen<TLocals = unknown>(port: number, options: ListenOptions<TLocals> = {}) {
        if (typeof process === "undefined" || !process.versions?.node) {
            throw new Error("Seltzer.listen requires a Node.js runtime.");
        }

        const host = resolveListenHost(options.host);
        const timeouts = resolveListenTimeouts(options);
        const foundation = foundationFromListen(this.foundation, options);
        assertCors(foundation.cors, "Seltzer.listen");

        // Snapshot listen overrides into this one listener. `handler()` reads
        // the override synchronously, then the override is cleared so a later
        // `app.handler()` still sees `init`.
        this.listenerOverride = { foundation, site: "Seltzer.listen" };
        let listener: RequestListener;
        try {
            listener = this.handler();
        } finally {
            this.listenerOverride = null;
        }

        const server = http.createServer(listener);

        server.headersTimeout = timeouts.headersTimeout;
        server.requestTimeout = timeouts.requestTimeout;
        server.keepAliveTimeout = timeouts.keepAliveTimeout;

        server.listen(port, host, () => {
            const bound = server.address();
            const boundPort = bound && typeof bound !== "string" ? bound.port : port;
            if (options.onListening) {
                options.onListening(boundPort);
                return;
            }

            const shownHost = bound && typeof bound !== "string" ? bound.address : host;
            console.log(`Seltzer server listening on ${formatListenUrl(shownHost, boundPort)}`);
        });

        return server;
    }

    private requestListener(foundation: InitOptions, site: OptionSite): RequestListener {
        const bodyLimit = resolveBodyLimit(foundation.bodyLimit, site);
        const locals = foundation.locals ?? {};
        return (req, res) => {
            void this.handleRequest(req, res, locals, foundation, bodyLimit);
        };
    }

    private async handleRequest<TLocals>(
        req: IncomingMessage,
        res: ServerResponse,
        locals: TLocals,
        options: Pick<InitOptions, "cors" | "logger" | "debug">,
        bodyLimit: number,
    ) {
        if (options.cors) {
            applyCors(req, res, options.cors);

            if (req.method === "OPTIONS") {
                send(res, { status: 204 });
                return;
            }
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
            bodyLimit,
            logger: options.logger,
            debug: options.debug === true,
        };
        installRemovedResponseMethods(ctx);

        await this.pipeline.run(ctx);
    }
}
