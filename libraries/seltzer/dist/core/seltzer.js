import http from "node:http";
import { installRemovedResponseMethods } from "./raw-response.js";
import { isExplicitResponse, isResponseData, response, send, } from "./response.js";
import { DEFAULT_BODY_LIMIT_BYTES, DEFAULT_HEADERS_TIMEOUT_MS, DEFAULT_KEEP_ALIVE_TIMEOUT_MS, DEFAULT_LISTEN_HOST, DEFAULT_REQUEST_TIMEOUT_MS, } from "./types.js";
import { compileRoute, createDefaultPipeline, } from "../pipeline/index.js";
export { DEFAULT_BODY_LIMIT_BYTES, DEFAULT_CLIENT_TIMEOUT_MS, DEFAULT_HEADERS_TIMEOUT_MS, DEFAULT_KEEP_ALIVE_TIMEOUT_MS, DEFAULT_LISTEN_HOST, DEFAULT_REQUEST_TIMEOUT_MS, } from "./types.js";
export { STAGE_NAMES } from "../pipeline/index.js";
export { validationError } from "./validation.js";
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
const DEFAULT_CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_CORS_HEADERS = ["Content-Type"];
function assertCors(cors, site) {
    if (!cors) {
        return;
    }
    if (cors.credentials === true && cors.origin === "*") {
        throw new Error(`${site} cors credentials: true cannot be combined with origin "*". Name a specific origin, or omit origin to reflect the request Origin.`);
    }
    if (cors.maxAge !== undefined && (!Number.isInteger(cors.maxAge) || cors.maxAge < 0)) {
        throw new Error(`${site} cors maxAge must be a non-negative integer of seconds.`);
    }
}
function resolveBodyLimit(bodyLimit, site) {
    const limit = bodyLimit ?? DEFAULT_BODY_LIMIT_BYTES;
    if (!Number.isInteger(limit) || limit < 0) {
        throw new Error(`${site} bodyLimit must be a non-negative integer of bytes. 0 means unlimited.`);
    }
    return limit;
}
/**
 * Listen wins per field when the field is passed. Omitted listen fields keep
 * the init value. `cors` is replaced as a whole object, not merged.
 */
function foundationFromListen(init, options) {
    return {
        bodyLimit: options.bodyLimit !== undefined ? options.bodyLimit : init.bodyLimit,
        cors: options.cors !== undefined ? options.cors : init.cors,
        logger: options.logger !== undefined ? options.logger : init.logger,
        debug: options.debug !== undefined ? options.debug : init.debug,
        locals: options.locals !== undefined ? options.locals : init.locals,
    };
}
const HANDLER_CONFIG_DEPRECATION = "app.handler(config) is deprecated. Use app.adapter(config). This alias will be removed in the next minor after 0.10.0.";
/** Once per process. Further `handler(config)` calls stay silent. */
let handlerConfigDeprecationEmitted = false;
/**
 * `handler(config)` is a deprecated alias of `adapter(config)`.
 * The warning is `process.emitWarning` with code `SELTZER_DEP_HANDLER_CONFIG`
 * and type `DeprecationWarning`. It is not sent to the `init` / `listen` logger.
 * Node prints it to stderr unless a `warning` listener is attached, or
 * deprecation warnings are disabled (`--no-deprecation`).
 */
function warnHandlerConfigDeprecated() {
    if (handlerConfigDeprecationEmitted) {
        return;
    }
    handlerConfigDeprecationEmitted = true;
    if (typeof process === "undefined" || typeof process.emitWarning !== "function") {
        return;
    }
    process.emitWarning(HANDLER_CONFIG_DEPRECATION, {
        type: "DeprecationWarning",
        code: "SELTZER_DEP_HANDLER_CONFIG",
    });
}
/**
 * CORS headers are applied only when `cors` was passed to `init` or `listen`.
 * `Vary: Origin` is set when the allow-origin value is a specific origin
 * (configured or reflected). It is omitted for `origin: "*"`.
 */
function applyCors(req, res, cors) {
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
    res.setHeader("Access-Control-Allow-Methods", (cors.methods ?? DEFAULT_CORS_METHODS).join(","));
    res.setHeader("Access-Control-Allow-Headers", (cors.headers ?? DEFAULT_CORS_HEADERS).join(","));
    if (cors.credentials === true) {
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    if (cors.maxAge !== undefined) {
        res.setHeader("Access-Control-Max-Age", String(cors.maxAge));
    }
}
export class Seltzer {
    constructor() {
        this.routes = [];
        this.config = null;
        this.foundation = {};
        /**
         * Set only for the synchronous `handler()` call inside `listen`, so that
         * server snapshots listen overrides without changing later `app.handler()` calls.
         */
        this.listenerOverride = null;
        this.pipeline = createDefaultPipeline(() => this.routes);
    }
    /**
     * Create an app. Pass `bodyLimit`, `cors`, `logger`, `debug`, and `locals`
     * here when every server for this app should share them.
     * `credentials: true` with `origin: "*"` throws here, before `listen`.
     * A non-integer or negative `bodyLimit` throws here when you pass it.
     */
    static init(options = {}) {
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
     * Hosts use this to hang richer checks on `validate`. That replacement
     * removes the builtin, including `.required` presence checks.
     */
    replace(name, stage) {
        this.pipeline.replace(name, stage);
        return this;
    }
    /**
     * Store `{ adapter, options }` and return this app.
     * `options` is copied onto inbound `ctx.options`. `adapter` is unused inbound.
     * Last call wins. This is not a request listener.
     * `handler(config)` is a deprecated alias of this method.
     */
    adapter(config) {
        this.config = config;
        return this;
    }
    handler(config) {
        if (config !== undefined) {
            warnHandlerConfigDeprecated();
            return this.adapter(config);
        }
        if (typeof process === "undefined" || !process.versions?.node) {
            throw new Error("Seltzer.handler requires a Node.js runtime.");
        }
        const override = this.listenerOverride;
        return this.requestListener(override?.foundation ?? this.foundation, override?.site ?? "Seltzer.init");
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
    listen(port, options = {}) {
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
        let listener;
        try {
            listener = this.handler();
        }
        finally {
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
    requestListener(foundation, site) {
        const bodyLimit = resolveBodyLimit(foundation.bodyLimit, site);
        const locals = foundation.locals ?? {};
        return (req, res) => {
            void this.handleRequest(req, res, locals, foundation, bodyLimit);
        };
    }
    async handleRequest(req, res, locals, options, bodyLimit) {
        if (options.cors) {
            applyCors(req, res, options.cors);
            if (req.method === "OPTIONS") {
                send(res, { status: 204 });
                return;
            }
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
            bodyLimit,
            logger: options.logger,
            debug: options.debug === true,
        };
        installRemovedResponseMethods(ctx);
        await this.pipeline.run(ctx);
    }
}
//# sourceMappingURL=seltzer.js.map