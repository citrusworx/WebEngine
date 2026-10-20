import http from "node:http";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { generateRoutes, type ApiOperation } from "../generate/index.js";
import { STAGE_NAMES, type PipelineContext, type Stage } from "../pipeline/index.js";
import { isResponseData, type ResponseData } from "./response.js";
import { Seltzer } from "./seltzer.js";
import type { RequestContext, ValidatedInput } from "./types.js";
import { validationError, type ValidationIssue } from "./validation.js";

const servers: http.Server[] = [];

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    if (!server.listening) {
                        resolve();
                        return;
                    }
                    server.close((error) => (error ? reject(error) : resolve()));
                    server.closeIdleConnections();
                }),
        ),
    );
});

function waitListening(server: http.Server): Promise<void> {
    if (server.listening) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        server.once("listening", () => resolve());
        server.once("error", reject);
    });
}

async function listen(app: Seltzer, options: Parameters<Seltzer["listen"]>[1] = {}) {
    const server = app.listen(0, {
        ...options,
        onListening: options.onListening ?? (() => undefined),
    });
    servers.push(server);
    await waitListening(server);
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }
    return `http://127.0.0.1:${address.port}`;
}

async function request(url: string, init: RequestInit = {}) {
    const res = await fetch(url, init);
    const text = await res.text();
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status: res.status, headers: res.headers, text, json };
}

function post(url: string, body: unknown, query = "") {
    return request(`${url}${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

function walkTs(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
            files.push(...walkTs(full));
            continue;
        }
        if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
            files.push(full);
        }
    }
    return files;
}

/**
 * Zod-compatible `safeParse` result. The tests never import Zod.
 * `path` is `(string | number)[]`, the same shape `validationError` stores.
 */
type SafeParse<T> =
    | { success: true; data: T }
    | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } };

type EmailBody = { email: string };

function parseEmail(input: unknown): SafeParse<EmailBody> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return {
            success: false,
            error: { issues: [{ path: [], message: "Expected object" }] },
        };
    }

    const record = input as Record<string, unknown>;
    if (typeof record.email !== "string" || !/^[^\s@]+@[^\s@]+$/.test(record.email.trim())) {
        return {
            success: false,
            error: { issues: [{ path: ["email"], message: "Invalid email" }] },
        };
    }

    return { success: true, data: { email: record.email.trim().toLowerCase() } };
}

function parseNote(input: unknown): SafeParse<{ text: string; tags?: string[] }> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return {
            success: false,
            error: { issues: [{ path: [], message: "Expected object" }] },
        };
    }

    const record = input as Record<string, unknown>;
    const issues: { path: (string | number)[]; message: string }[] = [];
    if (typeof record.text !== "string" || record.text.trim().length === 0) {
        issues.push({ path: ["text"], message: "Expected non-empty string" });
    }
    if (record.tags !== undefined) {
        if (!Array.isArray(record.tags)) {
            issues.push({ path: ["tags"], message: "Expected array" });
        } else {
            record.tags.forEach((tag, index) => {
                if (typeof tag !== "string") {
                    issues.push({ path: ["tags", index], message: "Expected string" });
                }
            });
        }
    }
    if (issues.length > 0) {
        return { success: false, error: { issues } };
    }

    return {
        success: true,
        data: {
            text: (record.text as string).trim(),
            ...(Array.isArray(record.tags) ? { tags: record.tags as string[] } : {}),
        },
    };
}

/**
 * Same mapping the documented Zod recipe uses: copy `issue.path` and
 * `issue.message`, dropping anything that is not a string or number.
 */
function issuesFromSafeParse(
    issues: { path: (string | number)[]; message: string }[],
): ValidationIssue[] {
    return issues.map((issue) => ({
        path: issue.path.filter(
            (part): part is string | number => typeof part === "string" || typeof part === "number",
        ),
        message: issue.message,
    }));
}

type Schema = { safeParse: (input: unknown) => SafeParse<unknown> };

function validateBody(lookup: (ctx: PipelineContext) => Schema | undefined): Stage {
    return (ctx) => {
        const schema = lookup(ctx);
        if (!schema) {
            return;
        }

        const parsed = schema.safeParse(ctx.body);
        if (!parsed.success) {
            return validationError(issuesFromSafeParse(parsed.error.issues));
        }

        ctx.valid = { body: parsed.data };
    };
}

describe("validationError", () => {
    it("returns 400 with path arrays and does not share the input array", () => {
        const issues: ValidationIssue[] = [
            { path: ["email"], message: "Invalid email" },
            { path: ["items", 0, "qty"], message: "Expected number" },
            { path: [], message: "Expected object" },
        ];
        const result = validationError(issues);

        expect(isResponseData(result)).toBe(true);
        expect(result).toEqual({
            status: 400,
            body: {
                error: "Validation failed",
                issues: [
                    { path: ["email"], message: "Invalid email" },
                    { path: ["items", 0, "qty"], message: "Expected number" },
                    { path: [], message: "Expected object" },
                ],
            },
        });

        issues[0]?.path && (issues[0].path as string[]).push("mutated");
        expect((result.body as { issues: { path: string[] }[] }).issues[0]?.path).toEqual([
            "email",
        ]);
    });

    it("rejects a path that is not an array of strings and numbers", () => {
        expect(() => validationError(undefined as unknown as ValidationIssue[])).toThrow(
            /expects an array/,
        );
        expect(() =>
            validationError([{ path: "email" as unknown as string[], message: "no" }]),
        ).toThrow(/issues\[0\]/);
        expect(() =>
            validationError([{ path: ["email", Symbol("no") as unknown as string], message: "no" }]),
        ).toThrow(/issues\[0\]/);
    });
});

describe("default validate stage", () => {
    it("keeps the named pipeline and does not import WebEngine, Blackwater, or Zod", () => {
        expect([...STAGE_NAMES]).toEqual([
            "parse",
            "context",
            "route",
            "validate",
            "handle",
            "response",
            "send",
        ]);

        const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const sources = walkTs(srcRoot);
        expect(sources.length).toBeGreaterThan(0);
        for (const file of sources) {
            const source = readFileSync(file, "utf8");
            expect(source).not.toMatch(/@citrusworx\/(webengine|blackwater)/);
            expect(source).not.toMatch(/from\s+["'][^"']*blackwater/i);
            expect(source).not.toMatch(/from\s+["']zod["']/);
            expect(source).not.toMatch(/require\(\s*["']zod["']/);
        }

        const pkg = JSON.parse(
            readFileSync(path.resolve(srcRoot, "../package.json"), "utf8"),
        ) as {
            dependencies?: Record<string, string>;
            peerDependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
            optionalDependencies?: Record<string, string>;
        };
        const declared = [
            ...Object.keys(pkg.dependencies ?? {}),
            ...Object.keys(pkg.peerDependencies ?? {}),
            ...Object.keys(pkg.devDependencies ?? {}),
            ...Object.keys(pkg.optionalDependencies ?? {}),
        ];
        expect(declared).not.toContain("zod");
        expect(pkg.dependencies).toBeUndefined();
    });

    it("checks presence only, leaves ctx.valid unset, and keeps ctx.body raw", async () => {
        let handled = false;
        let seen: { valid: unknown; body: unknown } | undefined;
        const app = Seltzer.init().route({
            method: "POST",
            path: "/api/waitlist",
            contract: {
                body: { name: "string", email: "string.required" },
            },
            handler: (ctx): ResponseData => {
                handled = true;
                seen = { valid: ctx.valid, body: ctx.body };
                return { body: { ok: true } };
            },
        });
        const base = await listen(app);

        const missing = await post(`${base}/api/waitlist`, { name: "Ada" });
        expect(missing.status).toBe(400);
        expect(missing.json).toEqual({ error: "Missing required field: email" });
        expect(handled).toBe(false);

        const blank = await post(`${base}/api/waitlist`, { email: "   " });
        expect(blank.json).toEqual({ error: "Missing required field: email" });

        const empty = await post(`${base}/api/waitlist`, {});
        expect(empty.json).toEqual({ error: "Missing required field: email" });

        const notObject = await post(`${base}/api/waitlist`, ["ada@example.com"]);
        expect(notObject.status).toBe(400);
        expect(notObject.json).toEqual({ error: "Request body must be an object" });
        expect(handled).toBe(false);

        const present = await post(`${base}/api/waitlist`, {
            email: 12,
            name: "Ada",
            extra: true,
        });
        expect(present.status).toBe(200);
        expect(handled).toBe(true);
        expect(seen?.valid).toBeUndefined();
        expect(seen?.body).toEqual({ email: 12, name: "Ada", extra: true });
    });

    it("does not clobber ctx.valid assigned by an earlier hook", async () => {
        let seen: unknown;
        const app = Seltzer.init()
            .before("validate", (ctx) => {
                ctx.valid = { body: { from: "before" } };
            })
            .route({
                method: "POST",
                path: "/api/waitlist",
                contract: { body: { email: "string.required" } },
                handler: (ctx): ResponseData => {
                    seen = ctx.valid;
                    return { body: { ok: true } };
                },
            });
        const base = await listen(app);
        const res = await post(`${base}/api/waitlist`, { email: "ada@example.com" });
        expect(res.status).toBe(200);
        expect(seen).toEqual({ body: { from: "before" } });
    });
});

describe("replace validate", () => {
    it("gives the handler ctx.valid and leaves ctx.body, params, and query raw", async () => {
        let seen:
            | {
                  valid: RequestContext["valid"];
                  body: unknown;
                  params: Record<string, string>;
                  query: Record<string, string>;
              }
            | undefined;
        const app = Seltzer.init()
            .replace("validate", (ctx) => {
                const parsed = parseEmail(ctx.body);
                if (!parsed.success) {
                    return validationError(issuesFromSafeParse(parsed.error.issues));
                }
                const limit = Number(ctx.query.limit);
                if (!Number.isInteger(limit) || limit < 1) {
                    return validationError([{ path: ["limit"], message: "Expected integer" }]);
                }
                ctx.valid = {
                    body: parsed.data,
                    params: { id: ctx.params.id },
                    query: { limit },
                };
            })
            .route({
                method: "POST",
                path: "/people/:id",
                handler: (ctx): ResponseData => {
                    seen = {
                        valid: ctx.valid,
                        body: ctx.body,
                        params: ctx.params,
                        query: ctx.query,
                    };
                    return { body: { ok: true } };
                },
            });
        const base = await listen(app);
        const res = await post(
            `${base}/people/42`,
            { email: " Ada@Example.com ", extra: 1 },
            "?limit=10",
        );

        expect(res.status).toBe(200);
        expect(seen?.body).toEqual({ email: " Ada@Example.com ", extra: 1 });
        expect(seen?.params).toEqual({ id: "42" });
        expect(seen?.query).toEqual({ limit: "10" });
        expect(seen?.valid).toEqual({
            body: { email: "ada@example.com" },
            params: { id: "42" },
            query: { limit: 10 },
        });

        const typed: ValidatedInput<EmailBody, { id: string }, { limit: number }> | undefined =
            seen?.valid as ValidatedInput<EmailBody, { id: string }, { limit: number }>;
        expect(typed?.body?.email).toBe("ada@example.com");
        expect(typed?.query?.limit).toBe(10);
    });

    it("returns the standard 400 and does not run the handler", async () => {
        let handled = false;
        const app = Seltzer.init()
            .replace(
                "validate",
                validateBody(() => ({ safeParse: parseEmail })),
            )
            .route({
                method: "POST",
                path: "/waitlist",
                contract: { body: { email: "string.required" } },
                handler: (): ResponseData => {
                    handled = true;
                    return { body: { ok: true } };
                },
            });
        const base = await listen(app);
        const res = await post(`${base}/waitlist`, { email: "not-an-email" });

        expect(handled).toBe(false);
        expect(res.status).toBe(400);
        expect(res.json).toEqual({
            error: "Validation failed",
            issues: [{ path: ["email"], message: "Invalid email" }],
        });
    });

    it("dispatches per route inside the replacement; routes without a schema continue", async () => {
        const schemas = new Map<string, Schema>([
            ["POST /waitlist", { safeParse: parseEmail }],
            ["POST /notes", { safeParse: parseNote }],
        ]);
        let handled: string[] = [];
        const app = Seltzer.init()
            .replace("validate", validateBody((ctx) => schemas.get(`${ctx.route?.method} ${ctx.route?.path}`)))
            .route({
                method: "POST",
                path: "/waitlist",
                handler: (ctx): ResponseData => {
                    handled.push("waitlist");
                    return { body: { valid: ctx.valid ?? null } };
                },
            })
            .route({
                method: "POST",
                path: "/notes",
                handler: (ctx): ResponseData => {
                    handled.push("notes");
                    return { body: { valid: ctx.valid ?? null } };
                },
            })
            .route({
                method: "POST",
                path: "/open",
                contract: { body: { email: "string.required" } },
                handler: (ctx): ResponseData => {
                    handled.push("open");
                    return { body: { valid: ctx.valid ?? null, body: ctx.body } };
                },
            });
        const base = await listen(app);

        const badNote = await post(`${base}/notes`, { text: "hi", tags: ["a", 1] });
        expect(badNote.status).toBe(400);
        expect(badNote.json).toEqual({
            error: "Validation failed",
            issues: [{ path: ["tags", 1], message: "Expected string" }],
        });
        expect(handled).toEqual([]);

        const note = await post(`${base}/notes`, { text: "  hi  ", tags: ["a"] });
        expect(note.status).toBe(200);
        expect(note.json).toEqual({ valid: { body: { text: "hi", tags: ["a"] } } });

        const waitlist = await post(`${base}/waitlist`, { email: "ada@example.com" });
        expect(waitlist.json).toEqual({
            valid: { body: { email: "ada@example.com" } },
        });

        const open = await post(`${base}/open`, { extra: true });
        expect(open.status).toBe(200);
        expect(open.json).toEqual({ valid: null, body: { extra: true } });
        expect(handled).toEqual(["notes", "waitlist", "open"]);
    });

    it("logs a thrown validator as a generic 500 and does not run the handler", async () => {
        function gate4ValidateBoom(): never {
            throw new Error("gate4-validate-secret");
        }

        let handled = false;
        const logs: string[] = [];
        const app = Seltzer.init()
            .replace("validate", () => {
                gate4ValidateBoom();
            })
            .route({
                method: "POST",
                path: "/waitlist",
                handler: (): ResponseData => {
                    handled = true;
                    return { body: { ok: true } };
                },
            });

        const quiet = await listen(app, { logger: (message) => logs.push(message) });
        const res = await post(`${quiet}/waitlist`, { email: "ada@example.com" });
        expect(handled).toBe(false);
        expect(res.status).toBe(500);
        expect(res.json).toEqual({ error: "Internal Server Error" });
        expect(res.text).not.toContain("gate4-validate-secret");
        expect(res.text).not.toContain("gate4ValidateBoom");
        const line = logs.join("\n");
        expect(line).toContain('POST /waitlist hook "validate" threw: gate4-validate-secret');
        expect(line).not.toContain("gate4ValidateBoom");

        logs.length = 0;
        const verbose = await listen(app, {
            debug: true,
            logger: (message) => logs.push(message),
        });
        const debugRes = await post(`${verbose}/waitlist`, { email: "ada@example.com" });
        expect(debugRes.json).toEqual({ error: "Internal Server Error" });
        expect(debugRes.text).not.toContain("gate4ValidateBoom");
        expect(logs.join("\n")).toContain("gate4ValidateBoom");
    });

    it("turns a non-ResponseData validator return into 500 and does not run the handler", async () => {
        let handled = false;
        const logs: string[] = [];
        const app = Seltzer.init()
            .replace("validate", () => 42 as unknown as ResponseData)
            .route({
                method: "GET",
                path: "/waitlist",
                handler: (): ResponseData => {
                    handled = true;
                    return { body: { ok: true } };
                },
            });
        const base = await listen(app, { logger: (message) => logs.push(message) });
        const res = await request(`${base}/waitlist`);

        expect(handled).toBe(false);
        expect(res.status).toBe(500);
        expect(res.json).toEqual({
            error: "Internal Server Error",
            message:
                "Handler must return ResponseData ({ status?, headers?, body? }). Bare values are not wrapped.",
        });
        expect(logs.join("\n")).toContain('GET /waitlist hook "validate" returned number 42');
    });
});

describe("generateRoutes and validate", () => {
    const operations: ApiOperation[] = [
        {
            resource: "waitlist",
            crud: "create",
            name: "joinWaitlist",
            method: "POST",
            path: "/api/waitlist",
            query: "joinWaitlist",
            body: { name: "string", email: "string.required" },
        },
        {
            resource: "product",
            crud: "read",
            name: "allProducts",
            method: "GET",
            path: "/api/products",
            query: "allProducts",
        },
    ];

    it("still applies default .required checks and leaves ctx.valid unset", async () => {
        const calls: { query?: string; body: unknown; valid: unknown }[] = [];
        const app = Seltzer.init();
        for (const route of generateRoutes(operations, {
            execute: ({ query, body, ctx }) => {
                calls.push({ query, body, valid: ctx.valid });
                return { ok: true };
            },
        })) {
            app.route(route);
        }
        const base = await listen(app);

        const missing = await post(`${base}/api/waitlist`, { name: "Ada" });
        expect(missing.status).toBe(400);
        expect(missing.json).toEqual({ error: "Missing required field: email" });
        expect(calls).toEqual([]);

        const present = await post(`${base}/api/waitlist`, { email: 12, name: "Ada" });
        expect(present.status).toBe(200);
        expect(calls).toEqual([
            {
                query: "joinWaitlist",
                body: { email: 12, name: "Ada" },
                valid: undefined,
            },
        ]);

        const reads = await request(`${base}/api/products`);
        expect(reads.status).toBe(200);
        expect(calls[1]).toEqual({ query: "allProducts", body: undefined, valid: undefined });
    });

    it("lets a replacement dispatch on contract.name and drop the default presence check", async () => {
        const seenContracts: unknown[] = [];
        const calls: { body: unknown; valid: unknown }[] = [];
        const schemas: Record<string, Schema> = {
            joinWaitlist: { safeParse: parseEmail },
        };
        const app = Seltzer.init().replace(
            "validate",
            validateBody((ctx) => {
                seenContracts.push(ctx.route?.contract);
                const name = ctx.route?.contract?.name;
                return name ? schemas[name] : undefined;
            }),
        );
        for (const route of generateRoutes(operations, {
            execute: ({ body, ctx }) => {
                calls.push({ body, valid: ctx.valid });
                return { ok: true };
            },
        })) {
            app.route(route);
        }
        const base = await listen(app);

        const invalid = await post(`${base}/api/waitlist`, { email: "nope" });
        expect(invalid.status).toBe(400);
        expect(invalid.json).toEqual({
            error: "Validation failed",
            issues: [{ path: ["email"], message: "Invalid email" }],
        });
        expect(calls).toEqual([]);
        expect(seenContracts[0]).toEqual({
            resource: "waitlist",
            name: "joinWaitlist",
            body: { name: "string", email: "string.required" },
        });

        const valid = await post(`${base}/api/waitlist`, { email: " Ada@Example.com " });
        expect(valid.status).toBe(200);
        expect(calls).toEqual([
            {
                body: { email: " Ada@Example.com " },
                valid: { body: { email: "ada@example.com" } },
            },
        ]);

        calls.length = 0;
        const read = await request(`${base}/api/products`);
        expect(read.status).toBe(200);
        expect(calls).toEqual([{ body: undefined, valid: undefined }]);
    });
});
