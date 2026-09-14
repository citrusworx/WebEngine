import { describe, expect, it } from "vitest";
import { isResponseData } from "../core/response.js";
import { Pipeline } from "./index.js";
import type { PipelineContext, StageName } from "./types.js";
import { STAGE_NAMES } from "./types.js";

function fakeCtx(overrides: Partial<PipelineContext> = {}): PipelineContext {
    return {
        req: {} as PipelineContext["req"],
        res: {} as PipelineContext["res"],
        method: "GET",
        path: "/",
        query: {},
        params: {},
        body: undefined,
        headers: {},
        locals: {},
        ...overrides,
    };
}

function namesFrom(pipeline: Pipeline): string[] {
    return (pipeline as unknown as { entries: { name: StageName; builtin?: boolean }[] }).entries.map(
        (entry) => `${entry.name}${entry.builtin ? "*" : ""}`,
    );
}

describe("Pipeline", () => {
    it("runs builtin stages in the named order", async () => {
        const ran: string[] = [];
        const pipeline = new Pipeline(
            STAGE_NAMES.map((name) => ({
                name,
                builtin: true,
                stage: (ctx) => {
                    ran.push(name);
                    if (name === "send") {
                        ctx.response = { status: 200, body: { ok: true } };
                    }
                },
            })),
        );

        await pipeline.run(fakeCtx());
        expect(ran).toEqual([...STAGE_NAMES]);
    });

    it("inserts before('handle') immediately before the builtin handle stage", () => {
        const pipeline = new Pipeline(
            STAGE_NAMES.map((name) => ({
                name,
                builtin: true,
                stage: () => undefined,
            })),
        );

        pipeline.before("handle", () => undefined);
        pipeline.before("handle", () => undefined);

        expect(namesFrom(pipeline)).toEqual([
            "parse*",
            "context*",
            "route*",
            "validate*",
            "handle",
            "handle",
            "handle*",
            "response*",
            "send*",
        ]);
    });

    it("short-circuits remaining stages except send when a stage returns ResponseData", async () => {
        const ran: string[] = [];
        const pipeline = new Pipeline(
            STAGE_NAMES.map((name) => ({
                name,
                builtin: true,
                stage: (ctx) => {
                    ran.push(name);
                    if (name === "send") {
                        expect(isResponseData(ctx.response)).toBe(true);
                        expect(ctx.response).toEqual({
                            status: 401,
                            body: { error: "Unauthorized" },
                        });
                    }
                },
            })),
        );

        pipeline.before("handle", () => ({
            status: 401,
            body: { error: "Unauthorized" },
        }));

        await pipeline.run(fakeCtx());
        expect(ran).toEqual(["parse", "context", "route", "validate", "send"]);
    });

    it("treats validate as a named no-op that still occupies a slot", async () => {
        const ran: string[] = [];
        const pipeline = new Pipeline([
            { name: "validate", builtin: true, stage: () => undefined },
            {
                name: "handle",
                builtin: true,
                stage: () => {
                    ran.push("handle");
                },
            },
            { name: "send", builtin: true, stage: () => undefined },
        ]);

        pipeline.before("validate", () => {
            ran.push("before-validate");
        });

        await pipeline.run(fakeCtx());
        expect(ran).toEqual(["before-validate", "handle"]);
    });

    it("throws for an unknown stage name", () => {
        const pipeline = new Pipeline([
            { name: "handle", builtin: true, stage: () => undefined },
        ]);

        expect(() => pipeline.before("parse", () => undefined)).toThrow(
            /Unknown pipeline stage "parse"/,
        );
        expect(() => pipeline.replace("parse", () => undefined)).toThrow(
            /Unknown pipeline stage "parse"/,
        );
    });

    it("replace('validate') swaps the builtin while keeping before working", async () => {
        const ran: string[] = [];
        const pipeline = new Pipeline(
            STAGE_NAMES.map((name) => ({
                name,
                builtin: true,
                stage: () => {
                    ran.push(name);
                },
            })),
        );

        pipeline.before("validate", () => {
            ran.push("before-validate");
        });
        pipeline.replace("validate", () => {
            ran.push("custom-validate");
        });

        expect(namesFrom(pipeline)).toEqual([
            "parse*",
            "context*",
            "route*",
            "validate",
            "validate*",
            "handle*",
            "response*",
            "send*",
        ]);

        await pipeline.run(fakeCtx());
        expect(ran).toEqual([
            "parse",
            "context",
            "route",
            "before-validate",
            "custom-validate",
            "handle",
            "response",
            "send",
        ]);
    });
});
