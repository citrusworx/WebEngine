import type { IncomingMessage, ServerResponse } from "node:http";
import { DEFAULT_BODY_LIMIT_BYTES } from "../core/types.js";
import { isResponseData, send, type ResponseData } from "../core/response.js";
import type { CompiledRoute } from "./router.js";
import { allowedMethods, matchRoute, paramsFromMatch } from "./router.js";
import type { PipelineContext, Stage } from "./types.js";

class InvalidJsonError extends Error {
    constructor() {
        super("Invalid JSON body");
        this.name = "InvalidJsonError";
    }
}

class PayloadTooLargeError extends Error {
    constructor() {
        super("Payload Too Large");
        this.name = "PayloadTooLargeError";
    }
}

function declaredContentLength(req: IncomingMessage): number | undefined {
    const raw = req.headers["content-length"];
    if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
        return undefined;
    }

    const value = Number(raw);
    return Number.isSafeInteger(value) ? value : undefined;
}

/** Drop the rest of the socket after the response is written. Do not buffer it. */
function stopReading(req: IncomingMessage, res: ServerResponse): void {
    const destroy = () => {
        if (!req.destroyed) {
            req.destroy();
        }
    };

    req.on("error", () => undefined);

    if (res.writableFinished || res.destroyed) {
        destroy();
        return;
    }

    res.once("finish", destroy);
    res.once("close", destroy);
}

async function readBody(
    req: IncomingMessage,
    res: ServerResponse,
    limit: number,
): Promise<unknown> {
    if (limit !== 0) {
        const declared = declaredContentLength(req);
        if (declared !== undefined && declared > limit) {
            stopReading(req, res);
            throw new PayloadTooLargeError();
        }
    }

    const chunks: Buffer[] = [];
    let received = 0;

    for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        received += buf.length;
        if (limit !== 0 && received > limit) {
            stopReading(req, res);
            throw new PayloadTooLargeError();
        }
        chunks.push(buf);
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
            throw new InvalidJsonError();
        }
    }

    return raw;
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

/**
 * Read the request body.
 * Invalid JSON is 400. A body over `bodyLimit` is 413 and is not read further.
 * GET/HEAD skip the body. An empty body is `undefined`.
 * Non-JSON content types are a UTF-8 string (not 415).
 */
export async function parseStage(ctx: PipelineContext): Promise<ResponseData | void> {
    const method = ctx.req.method ?? "GET";
    if (method === "GET" || method === "HEAD") {
        return;
    }

    const limit = ctx.bodyLimit ?? DEFAULT_BODY_LIMIT_BYTES;

    try {
        ctx.body = await readBody(ctx.req, ctx.res, limit);
    } catch (error) {
        if (error instanceof PayloadTooLargeError) {
            return { status: 413, body: { error: "Payload Too Large" } };
        }

        if (error instanceof InvalidJsonError) {
            return { status: 400, body: { error: "Invalid JSON body" } };
        }

        throw error;
    }
}

/** Normalize method, path, query, and headers onto ctx. */
export function contextStage(ctx: PipelineContext): void {
    const url = new URL(ctx.req.url || "/", `http://${ctx.req.headers.host ?? "localhost"}`);
    ctx.method = ctx.req.method ?? "GET";
    ctx.path = url.pathname;
    ctx.query = queryFromUrl(url);
    ctx.headers = normalizeHeaders(ctx.req.headers);
}

export function createRouteStage(getRoutes: () => CompiledRoute[]): Stage {
    return (ctx) => {
        const routes = getRoutes();
        const match = matchRoute(routes, ctx.method, ctx.path);
        if (!match) {
            const allowed = allowedMethods(routes, ctx.path);
            if (allowed.length > 0) {
                return {
                    status: 405,
                    headers: { Allow: allowed.join(", ") },
                    body: { error: "Method Not Allowed" },
                };
            }

            return { status: 404, body: { error: "Not Found" } };
        }

        try {
            ctx.params = paramsFromMatch(match, ctx.path);
        } catch (error) {
            if (error instanceof URIError) {
                return { status: 400, body: { error: "Malformed path parameter" } };
            }

            throw error;
        }

        ctx.route = match;
    };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** YAML convention: `string.required`, `int.required`, … */
function isRequiredSpec(spec: string): boolean {
    return spec.split(".").includes("required");
}

function isPresent(value: unknown): boolean {
    if (value === undefined || value === null) {
        return false;
    }

    if (typeof value === "string") {
        return value.trim().length > 0;
    }

    return true;
}

/**
 * Enforce `.required` keys from `ctx.route.contract.body` on `ctx.body`.
 * No body specs → no-op (GET product/waitlist reads). Nectarine can
 * `replace("validate", …)` for richer contracts.
 */
export function validateStage(ctx: PipelineContext): ResponseData | void {
    const specs = ctx.route?.contract?.body;
    if (!specs) {
        return;
    }

    const required = Object.entries(specs)
        .filter(([, spec]) => isRequiredSpec(spec))
        .map(([field]) => field);

    if (required.length === 0) {
        return;
    }

    const payload = ctx.body;
    if (!isPlainObject(payload)) {
        return { status: 400, body: { error: "Request body must be an object" } };
    }

    const missing = required.filter((field) => !isPresent(payload[field]));
    if (missing.length === 0) {
        return;
    }

    const label = missing.length === 1 ? "field" : "fields";
    return {
        status: 400,
        body: { error: `Missing required ${label}: ${missing.join(", ")}` },
    };
}

export async function handleStage(ctx: PipelineContext): Promise<void> {
    if (!ctx.route) {
        return;
    }

    ctx.response = await ctx.route.handler(ctx);
}

/** Reject non-ResponseData handler results with 500. Defaults live in `send`. */
export function responseStage(ctx: PipelineContext): void {
    if (!isResponseData(ctx.response)) {
        ctx.response = {
            status: 500,
            body: {
                error: "Internal Server Error",
                message:
                    "Handler must return ResponseData ({ status?, headers?, body? }). Bare values are not wrapped.",
            },
        };
    }
}

export function sendStage(ctx: PipelineContext): void {
    send(ctx.res, ctx.response ?? {
        status: 500,
        body: { error: "Internal Server Error" },
    });
}
