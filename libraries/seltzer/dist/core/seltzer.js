import http from "node:http";
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function compilePath(routePath) {
    const keys = [];
    const pattern = routePath
        .split("/")
        .map((segment) => {
        if (segment.startsWith(":")) {
            keys.push(segment.slice(1));
            return "([^/]+)";
        }
        return escapeRegex(segment);
    })
        .join("/");
    return {
        keys,
        regex: new RegExp(`^${pattern}$`),
    };
}
function normalizeHeaders(headers) {
    const result = {};
    for (const [key, value] of Object.entries(headers)) {
        if (typeof value === "string") {
            result[key.toLowerCase()] = value;
        }
        else if (Array.isArray(value)) {
            result[key.toLowerCase()] = value.join(", ");
        }
    }
    return result;
}
function queryFromUrl(url) {
    const query = {};
    url.searchParams.forEach((value, key) => {
        query[key] = value;
    });
    return query;
}
async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) {
        return undefined;
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    const contentType = String(req.headers["content-type"] ?? "");
    if (contentType.includes("application/json")) {
        try {
            return JSON.parse(raw);
        }
        catch {
            throw new Error("Invalid JSON body");
        }
    }
    return raw;
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
    }
    static init() {
        return new Seltzer();
    }
    /** Register a single object-based route. Do not model APIs as promise chains. */
    route(route) {
        this.routes.push({
            ...route,
            ...compilePath(route.path),
        });
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
            res.writeHead(204);
            res.end();
            return;
        }
        const url = new URL(req.url || "/", `http://${req.headers.host ?? "localhost"}`);
        const method = req.method ?? "GET";
        const match = this.routes.find((route) => route.method === method && route.regex.test(url.pathname));
        const json = (data, status = 200) => {
            if (!res.headersSent) {
                res.writeHead(status, { "Content-Type": "application/json" });
            }
            res.end(JSON.stringify(data));
        };
        if (!match) {
            json({ error: "Not Found" }, 404);
            return;
        }
        const paramMatch = url.pathname.match(match.regex);
        const params = {};
        match.keys.forEach((key, index) => {
            params[key] = decodeURIComponent(paramMatch?.[index + 1] ?? "");
        });
        let body;
        try {
            if (method !== "GET" && method !== "HEAD") {
                body = await readBody(req);
            }
        }
        catch {
            json({ error: "Invalid JSON body" }, 400);
            return;
        }
        const ctx = {
            req,
            res,
            method,
            path: url.pathname,
            query: queryFromUrl(url),
            params,
            body,
            headers: normalizeHeaders(req.headers),
            locals,
            options: this.config?.options,
            json,
        };
        try {
            await match.handler(ctx);
        }
        catch (error) {
            if (!res.headersSent) {
                json({
                    error: "Internal Server Error",
                    message: error instanceof Error ? error.message : String(error),
                }, 500);
            }
        }
    }
}
//# sourceMappingURL=seltzer.js.map