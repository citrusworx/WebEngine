import { defineConfig, loadEnv } from "vite";
import { Posts } from "../../packages/kiwipress/src/posts/posts";
import { Pages } from "../../packages/kiwipress/src/pages/pages";
import { DNS, ResellerClub } from "../../libraries/dns/src/index";
import type { TLDs } from "../../libraries/dns/src/index";

type ContentKind = "posts" | "pages";

const DEFAULT_TLDS: TLDs[] = ["com", "io", "app", "dev", "co", "net"];

async function readJsonBody(req: NodeJS.ReadableStream): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length === 0) {
        return {};
    }

    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function createClient(kind: ContentKind) {
    return kind === "posts" ? new Posts() : new Pages();
}

function parseContentRoute(url: string | undefined) {
    const parsed = new URL(url ?? "/", "http://localhost");
    const match = parsed.pathname.match(/^\/__kiwipress\/content\/(posts|pages)(?:\/([^/]+))?$/);

    if (!match) {
        return null;
    }

    return {
        kind: match[1] as ContentKind,
        id: match[2]
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const rsAuthUserId = Number(env.RS_AUTH_USERID ?? "");
    const rsApiKey = env.RS_API ?? "";
    const dns = rsAuthUserId && rsApiKey
        ? new DNS(new ResellerClub(rsAuthUserId, rsApiKey))
        : null;

    return {
    plugins: [
        {
            name: "kiwipress-dev-endpoints",
            configureServer(server) {
                server.middlewares.use(async (req, res, next) => {
                    if (req.method === "GET" && req.url?.startsWith("/__kiwipress/dns/search")) {
                        try {
                            if (!dns) {
                                res.statusCode = 500;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ error: "DNS provider not configured. Set RS_API and RS_AUTH_USERID in apps/kiwipress/.env" }));
                                return;
                            }

                            const parsed = new URL(req.url, "http://localhost");
                            const raw = parsed.searchParams.get("name")?.trim().toLowerCase() ?? "";
                            const name = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").split(".")[0] ?? "";
                            const tldsParam = parsed.searchParams.get("tlds");
                            const tlds = (tldsParam ? tldsParam.split(",") : DEFAULT_TLDS) as TLDs[];

                            if (!name) {
                                res.statusCode = 400;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ error: "Missing `name` query parameter" }));
                                return;
                            }

                            console.log(`[dns/search] name=${name} tlds=${tlds.join(",")}`);
                            const results = await dns.availability({ name, tlds });
                            console.log(`[dns/search] ok: ${results.length} result(s)`);

                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({ results }));
                        } catch (error) {
                            const message = error instanceof Error ? error.message : String(error);
                            console.error("[dns/search] error:", message);
                            res.statusCode = 500;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({ error: message }));
                        }

                        return;
                    }

                    if (req.method === "POST" && req.url === "/__kiwipress/posts/create") {
                        try {
                            const payload = await readJsonBody(req);
                            const posts = new Posts();
                            const created = await posts.create(payload);

                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify(created));
                        } catch (error) {
                            const message = error instanceof Error ? error.message : String(error);
                            res.statusCode = 500;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({ error: message }));
                        }

                        return;
                    }

                    const route = parseContentRoute(req.url);

                    if (!route) {
                        next();
                        return;
                    }

                    try {
                        const client = createClient(route.kind);

                        if (req.method === "GET" && !route.id) {
                            const items = await client.getAll();
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify(items));
                            return;
                        }

                        if (req.method === "PATCH" && route.id) {
                            const payload = await readJsonBody(req);
                            const updated = await client.update(route.id, payload);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify(updated));
                            return;
                        }

                        if (req.method === "DELETE" && route.id) {
                            const deleted = await client.delete(route.id);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify(deleted));
                            return;
                        }

                        res.statusCode = 405;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({ error: "Method not allowed." }));
                    } catch (error) {
                        const message = error instanceof Error ? error.message : String(error);
                        res.statusCode = 500;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({ error: message }));
                    }
                });
            }
        }
    ],
    server: {
        host: "0.0.0.0",
        port: 5173,
        proxy: {
            "/wp-json": {
                target: "https://wp.local.citrusworx.test",
                changeOrigin: true,
                secure: false
            }
        },
        allowedHosts: [
            "app.local.citrusworx.test",
            "frontend.kiwi.local",
            "localhost"
        ]
    }
    };
});
