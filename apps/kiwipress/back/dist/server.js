import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DNS, ResellerClub } from "@citrusworx/dns";
import { Pages, Posts } from "@citrusworx/kiwipress";
import { Seltzer } from "@citrusworx/seltzer";
const DEFAULT_TLDS = ["com", "io", "app", "dev", "co", "net"];
const envPath = resolve(process.cwd(), ".env");
loadEnvFile(envPath);
const port = Number(process.env.KIWIPRESS_BACK_PORT ?? process.env.PORT ?? "8787");
const host = process.env.KIWIPRESS_BACK_HOST?.trim() || "0.0.0.0";
const rsAuthUserId = Number(process.env.RS_AUTH_USERID ?? "");
const rsApiKey = process.env.RS_API ?? "";
const dns = rsAuthUserId && rsApiKey
    ? new DNS(new ResellerClub(rsAuthUserId, rsApiKey))
    : null;
function loadEnvFile(path) {
    if (!existsSync(path)) {
        return;
    }
    const lines = readFileSync(path, "utf8").split(/\r?\n/u);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const separator = trimmed.indexOf("=");
        if (separator < 0) {
            continue;
        }
        const key = trimmed.slice(0, separator).trim();
        const rawValue = trimmed.slice(separator + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, "");
        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}
async function readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) {
        return {};
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function createClient(kind) {
    return kind === "posts" ? new Posts() : new Pages();
}
const app = Seltzer.init();
app.route({
    method: "GET",
    path: "/__kiwipress/health",
    handler: (ctx) => {
        ctx.json({ ok: true });
    }
});
app.route({
    method: "GET",
    path: "/__kiwipress/dns/search",
    handler: async (ctx) => {
        if (!dns) {
            ctx.json({ error: "DNS provider not configured. Set RS_API and RS_AUTH_USERID in apps/kiwipress/back/.env" }, 500);
            return;
        }
        const raw = ctx.url.searchParams.get("name")?.trim().toLowerCase() ?? "";
        const name = raw.replace(/^https?:\/\//u, "").replace(/\/.*$/u, "").split(".")[0] ?? "";
        const tldsParam = ctx.url.searchParams.get("tlds");
        const tlds = (tldsParam ? tldsParam.split(",") : DEFAULT_TLDS);
        if (!name) {
            ctx.json({ error: "Missing `name` query parameter" }, 400);
            return;
        }
        const results = await dns.availability({ name, tlds });
        ctx.json({ results });
    }
});
app.route({
    method: "POST",
    path: "/__kiwipress/posts/create",
    handler: async (ctx) => {
        const payload = await readJsonBody(ctx.req);
        const posts = new Posts();
        const created = await posts.create(payload);
        ctx.json(created);
    }
});
app.route({
    method: "GET",
    path: "/__kiwipress/content/:kind",
    handler: async (ctx) => {
        const kind = ctx.params.kind;
        if (kind !== "posts" && kind !== "pages") {
            ctx.json({ error: "Not found." }, 404);
            return;
        }
        const client = createClient(kind);
        const items = await client.getAll();
        ctx.json(items);
    }
});
app.route({
    method: "PATCH",
    path: "/__kiwipress/content/:kind/:id",
    handler: async (ctx) => {
        const kind = ctx.params.kind;
        if (kind !== "posts" && kind !== "pages") {
            ctx.json({ error: "Not found." }, 404);
            return;
        }
        const payload = await readJsonBody(ctx.req);
        const client = createClient(kind);
        const updated = await client.update(ctx.params.id, payload);
        ctx.json(updated);
    }
});
app.route({
    method: "DELETE",
    path: "/__kiwipress/content/:kind/:id",
    handler: async (ctx) => {
        const kind = ctx.params.kind;
        if (kind !== "posts" && kind !== "pages") {
            ctx.json({ error: "Not found." }, 404);
            return;
        }
        const client = createClient(kind);
        const deleted = await client.delete(ctx.params.id);
        ctx.json(deleted);
    }
});
app.listen(port);
console.log(`[kiwipress-back] listening on http://${host}:${port}`);
//# sourceMappingURL=server.js.map