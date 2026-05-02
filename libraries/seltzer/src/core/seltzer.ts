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

export type Route<TContext = any> = {
    method: string;
    path: string;
    handler: (ctx: TContext) => any;
};

type HandlerConfig = {
    adapter: string;
    options: {
        baseUrl?: string;
        headers?: Record<string, string>;
        allowSelfSigned?: boolean;
    };
};

export class Seltzer {
    private routes: Route[] = [];
    private config: HandlerConfig | null = null;

    static init() {
        return new Seltzer();
    }

    route(route: Route){
        this.routes.push(route);
        return this;
    }

    handler(config: HandlerConfig) {
        this.config = config;
        return this;
    }

    listen(port: number){
        const requireFn = Function("return typeof require !== 'undefined' ? require : null;")() as
            | ((id: string) => any)
            | null;

        if (!requireFn) {
            throw new Error("Seltzer.listen requires a Node.js runtime.");
        }

        const http = requireFn("node:http");
        const server = http.createServer(
            (req: any, res: any) => {
                const url = new URL(req.url || "/", `http://${req.headers.host}`);
            const match = this.routes.find(
                (route) => route.method === req.method && route.path === url.pathname
            );
            const ctx = {
                req,
                res,
                options: this.config?.options,
                json(data: unknown, status = 200){
                    res.writeHead(status, {"Content-Type": "application/json"});
                    res.end(JSON.stringify(data));
                }
            }

            if(!match){
                return ctx.json({ error: "Not Found"}, 404);
            }
            return match?.handler(ctx)
        });
        server.listen(port);
    }
}
