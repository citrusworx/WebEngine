import http from "node:http";

type Route = {
    method: string;
    path: string;
    handler: (ctx: any) => any;
}

export class Seltzer {
    private routes: Route[] = [];

    static init() {
        return new Seltzer();
    }

    route(route: Route){
        this.routes.push(route);
        return this;
    }

    handler(config: {adapter: string, options: object}){
    
    }

    listen(port: number){
        const server = http.createServer(
            (req , res: http.ServerResponse) => {
                const url = new URL(req.url || "/", `http://${req.headers.host}`);
            const match = this.routes.find(
                (route) => route.method === req.method && route.path === url.pathname
            );
            const ctx = {
                req,
                res,
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