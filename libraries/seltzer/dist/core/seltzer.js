import http from "node:http";
import { isExplicitResponse, isResponseData, response, send } from "./response.js";
import { DEFAULT_HEADERS_TIMEOUT_MS, DEFAULT_KEEP_ALIVE_TIMEOUT_MS, DEFAULT_LISTEN_HOST, DEFAULT_REQUEST_TIMEOUT_MS, } from "./types.js";
import { compileRoute, createDefaultPipeline, } from "../pipeline/index.js";
export { DEFAULT_HEADERS_TIMEOUT_MS, DEFAULT_KEEP_ALIVE_TIMEOUT_MS, DEFAULT_LISTEN_HOST, DEFAULT_REQUEST_TIMEOUT_MS, } from "./types.js";
export { STAGE_NAMES } from "../pipeline/index.js";
export { isExplicitResponse, isResponseData, response, send };
function resolveListenHost(host) {
    if (host === undefined) {
        return DEFAULT_LISTEN_HOST;
    }
    if (typeof host !== "string") {
        throw new Error('Seltzer.listen host must be a non-empty address. The default is "127.0.0.1". Pass "0.0.0.0" to bind every IPv4 interface.');
    }
    const trimmed = host.trim();
    if (trimmed.length === 0) {
        throw new Error('Seltzer.listen host must be a non-empty address. The default is "127.0.0.1". Pass "0.0.0.0" to bind every IPv4 interface.');
    }
    return trimmed;
}
function requireTimeout(name, value) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Seltzer.listen ${name} must be a non-negative integer of milliseconds.`);
    }
    return value;
}
function resolveListenTimeouts(options) {
    const headersTimeout = requireTimeout("headersTimeout", options.headersTimeout ?? DEFAULT_HEADERS_TIMEOUT_MS);
    const requestTimeout = requireTimeout("requestTimeout", options.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT_MS);
    const keepAliveTimeout = requireTimeout("keepAliveTimeout", options.keepAliveTimeout ?? DEFAULT_KEEP_ALIVE_TIMEOUT_MS);
    if (headersTimeout !== 0 && keepAliveTimeout >= headersTimeout) {
        throw new Error("Seltzer.listen keepAliveTimeout must be less than headersTimeout. Node answers keep-alive sockets with 408 when it is not.");
    }
    if (requestTimeout !== 0 && headersTimeout !== 0 && requestTimeout < headersTimeout) {
        throw new Error("Seltzer.listen requestTimeout must be 0 (disabled) or greater than or equal to headersTimeout.");
    }
    return { headersTimeout, requestTimeout, keepAliveTimeout };
}
function formatListenUrl(host, port) {
    const shown = host.includes(":") ? `[${host}]` : host;
    return `http://${shown}:${port}`;
}
function applyCors(req, res, cors) {
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
    res.setHeader("Access-Control-Allow-Methods", (cors.methods ?? ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]).join(","));
    res.setHeader("Access-Control-Allow-Headers", (cors.headers ?? ["Content-Type"]).join(","));
}
export class Seltzer {
    constructor() {
        this.routes = [];
        this.config = null;
        this.pipeline = createDefaultPipeline(() => this.routes);
    }
    static init() {
        return new Seltzer();
    }
    /** Register a single object-based route. Do not model APIs as promise chains. */
    route(route) {
        this.routes.push(compileRoute(route));
        return this;
    }
    /**
     * Insert a stage immediately before the builtin stage named `name`.
     * Returning `ResponseData` short-circuits remaining stages and jumps to `send`.
     */
    before(name, stage) {
        this.pipeline.before(name, stage);
        return this;
    }
    /**
     * Swap the builtin stage named `name`. `before` still inserts ahead of it.
     * Nectarine uses this to hang full contract checks on `validate`.
     */
    replace(name, stage) {
        this.pipeline.replace(name, stage);
        return this;
    }
    handler(config) {
        this.config = config;
        return this;
    }
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
     */
    listen(port, options = {}) {
        if (typeof process === "undefined" || !process.versions?.node) {
            throw new Error("Seltzer.listen requires a Node.js runtime.");
        }
        const host = resolveListenHost(options.host);
        const timeouts = resolveListenTimeouts(options);
        const locals = (options.locals ?? {});
        const server = http.createServer((req, res) => {
            void this.handleRequest(req, res, locals, options.cors);
        });
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
    async handleRequest(req, res, locals, cors) {
        applyCors(req, res, cors);
        if (req.method === "OPTIONS") {
            send(res, { status: 204 });
            return;
        }
        const ctx = {
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
//# sourceMappingURL=seltzer.js.map