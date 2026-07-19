import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

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
    json: (data: unknown, status?: number) => void;
};

export type Route<TContext = RequestContext> = {
    method: string;
    path: string;
    handler: (ctx: TContext) => unknown | Promise<unknown>;
};

type HandlerConfig = {
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

type CompiledRoute = Route & {
    keys: string[];
    regex: RegExp;
};

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compilePath(routePath: string) {
    const keys: string[] = [];
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

function normalizeHeaders(headers: IncomingMessage["headers"]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        if (typeof value === "string") {
            result[key.toLowerCase()] = value;
        } else if (Array.isArray(value)) {
            result[key.toLowerCase()] = value.join(", ");
        }
    }
    return result;
}

function queryFromUrl(url: URL): Record<string, string> {
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
        query[key] = value;
    });
    return query;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
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
            return JSON.parse(raw) as unknown;
        } catch {
            throw new Error("Invalid JSON body");
        }
    }

    return raw;
}

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
    private routes: CompiledRoute[] = [];
    private config: HandlerConfig | null = null;

    static init() {
        return new Seltzer();
    }

    /** Register a single object-based route. Do not model APIs as promise chains. */
    route<TContext extends RequestContext<any> = RequestContext>(route: Route<TContext>) {
        this.routes.push({
            ...(route as Route),
            ...compilePath(route.path),
        });
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
            res.writeHead(204);
            res.end();
            return;
        }

        const url = new URL(req.url || "/", `http://${req.headers.host ?? "localhost"}`);
        const method = req.method ?? "GET";

        const match = this.routes.find(
            (route) => route.method === method && route.regex.test(url.pathname),
        );

        const json = (data: unknown, status = 200) => {
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
        const params: Record<string, string> = {};
        match.keys.forEach((key, index) => {
            params[key] = decodeURIComponent(paramMatch?.[index + 1] ?? "");
        });

        let body: unknown;
        try {
            if (method !== "GET" && method !== "HEAD") {
                body = await readBody(req);
            }
        } catch {
            json({ error: "Invalid JSON body" }, 400);
            return;
        }

        const ctx: RequestContext<TLocals> = {
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
        } catch (error) {
            if (!res.headersSent) {
                json(
                    {
                        error: "Internal Server Error",
                        message: error instanceof Error ? error.message : String(error),
                    },
                    500,
                );
            }
        }
    }
}
