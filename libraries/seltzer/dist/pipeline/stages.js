import { isResponseData, send } from "../core/response.js";
import { matchRoute, paramsFromMatch } from "./router.js";
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
/** Read the request body. Invalid JSON short-circuits with 400. */
export async function parseStage(ctx) {
    const method = ctx.req.method ?? "GET";
    try {
        if (method !== "GET" && method !== "HEAD") {
            ctx.body = await readBody(ctx.req);
        }
    }
    catch {
        return { status: 400, body: { error: "Invalid JSON body" } };
    }
}
/** Normalize method, path, query, and headers onto ctx. */
export function contextStage(ctx) {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host ?? "localhost"}`);
    ctx.method = ctx.req.method ?? "GET";
    ctx.path = url.pathname;
    ctx.query = queryFromUrl(url);
    ctx.headers = normalizeHeaders(ctx.req.headers);
}
export function createRouteStage(getRoutes) {
    return (ctx) => {
        const match = matchRoute(getRoutes(), ctx.method, ctx.path);
        if (!match) {
            return { status: 404, body: { error: "Not Found" } };
        }
        ctx.params = paramsFromMatch(match, ctx.path);
        ctx.route = match;
    };
}
/** Stub for Nectarine contract validation. */
export function validateStage(_ctx) { }
export async function handleStage(ctx) {
    if (!ctx.route) {
        return;
    }
    ctx.response = await ctx.route.handler(ctx);
}
/** Reject non-ResponseData handler results with 500. Defaults live in `send`. */
export function responseStage(ctx) {
    if (!isResponseData(ctx.response)) {
        ctx.response = {
            status: 500,
            body: {
                error: "Internal Server Error",
                message: "Handler must return ResponseData ({ status?, headers?, body? }). Bare values are not wrapped.",
            },
        };
    }
}
export function sendStage(ctx) {
    send(ctx.res, ctx.response ?? {
        status: 500,
        body: { error: "Internal Server Error" },
    });
}
//# sourceMappingURL=stages.js.map