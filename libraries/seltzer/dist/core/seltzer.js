import http from "node:http";
import { isExplicitResponse, isResponseData, response, send } from "./response.js";
import { compileRoute, createDefaultPipeline, } from "../pipeline/index.js";
export { STAGE_NAMES } from "../pipeline/index.js";
export { isExplicitResponse, isResponseData, response, send };
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
    handler(config) {
        this.config = config;
        return this;
    }
    listen(port, options = {}) {
        if (typeof process === "undefined" || !process.versions?.node) {
            throw new Error("Seltzer.listen requires a Node.js runtime.");
        }
        const locals = (options.locals ?? {});
        const server = http.createServer((req, res) => {
            void this.handleRequest(req, res, locals, options.cors);
        });
        server.listen(port, () => {
            if (options.onListening) {
                options.onListening(port);
            }
            else {
                console.log(`Seltzer server listening on port ${port}`);
            }
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