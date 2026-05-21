import http from "node:http";
export class Seltzer {
    constructor() {
        this.routes = [];
        this.config = null;
    }
    static init() {
        return new Seltzer();
    }
    route(route) {
        this.routes.push(route);
        return this;
    }
    handler(config) {
        this.config = config;
        return this;
    }
    listen(port) {
        if (typeof process === "undefined" || !process.versions?.node) {
            throw new Error("Seltzer.listen requires a Node.js runtime.");
        }
        // Server
        const server = http.createServer((req, res) => {
            const url = new URL(req.url || "/", `http://${req.headers.host}`);
            const match = this.routes.find((route) => route.method === req.method && route.path === url.pathname);
            const ctx = {
                req,
                res,
                options: this.config?.options,
                json(data, status = 200) {
                    res.writeHead(status, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(data));
                }
            };
            if (!match) {
                return ctx.json({ error: "Not Found" }, 404);
            }
            return match?.handler(ctx);
        });
        server.listen(port);
    }
}
//# sourceMappingURL=seltzer.js.map