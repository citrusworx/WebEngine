import { describe, expect, it } from "vitest";
import type { Route } from "../core/types.js";
import { validateStage } from "./stages.js";
import type { PipelineContext } from "./types.js";

const noop: Route["handler"] = () => ({ body: { ok: true } });

function fakeCtx(overrides: Partial<PipelineContext> = {}): PipelineContext {
    return {
        req: {} as PipelineContext["req"],
        res: {} as PipelineContext["res"],
        method: "POST",
        path: "/api/waitlist",
        query: {},
        params: {},
        body: undefined,
        headers: {},
        locals: {},
        ...overrides,
    };
}

function routeWithBody(body?: Record<string, string>): Route {
    return {
        method: "POST",
        path: "/api/waitlist",
        handler: noop,
        contract: {
            resource: "waitlist",
            name: "joinWaitlist",
            ...(body ? { body } : {}),
        },
    };
}

describe("validateStage", () => {
    it("no-ops when the matched route has no body specs", () => {
        expect(
            validateStage(
                fakeCtx({
                    method: "GET",
                    path: "/api/products",
                    route: { method: "GET", path: "/api/products", handler: noop },
                }),
            ),
        ).toBeUndefined();
        expect(
            validateStage(
                fakeCtx({
                    body: { name: "Ada" },
                    route: routeWithBody(),
                }),
            ),
        ).toBeUndefined();
    });

    it("returns 400 when a .required body field is missing", () => {
        expect(
            validateStage(
                fakeCtx({
                    body: { name: "Ada" },
                    route: routeWithBody({ name: "string", email: "string.required" }),
                }),
            ),
        ).toEqual({
            status: 400,
            body: { error: "Missing required field: email" },
        });
    });

    it("returns 400 when a required field is empty or whitespace", () => {
        const route = routeWithBody({ email: "string.required" });

        expect(validateStage(fakeCtx({ body: { email: "" }, route }))).toEqual({
            status: 400,
            body: { error: "Missing required field: email" },
        });
        expect(validateStage(fakeCtx({ body: { email: "   " }, route }))).toEqual({
            status: 400,
            body: { error: "Missing required field: email" },
        });
        expect(validateStage(fakeCtx({ body: { email: null }, route }))).toEqual({
            status: 400,
            body: { error: "Missing required field: email" },
        });
    });

    it("returns 400 listing every missing required field", () => {
        expect(
            validateStage(
                fakeCtx({
                    body: {},
                    route: routeWithBody({
                        email: "string.required",
                        name: "string.required",
                    }),
                }),
            ),
        ).toEqual({
            status: 400,
            body: { error: "Missing required fields: email, name" },
        });
    });

    it("returns 400 when required specs exist but the body is not an object", () => {
        const route = routeWithBody({ email: "string.required" });

        expect(validateStage(fakeCtx({ body: undefined, route }))).toEqual({
            status: 400,
            body: { error: "Request body must be an object" },
        });
        expect(validateStage(fakeCtx({ body: "ada@example.com", route }))).toEqual({
            status: 400,
            body: { error: "Request body must be an object" },
        });
        expect(validateStage(fakeCtx({ body: ["ada@example.com"], route }))).toEqual({
            status: 400,
            body: { error: "Request body must be an object" },
        });
    });

    it("continues when required keys are present and non-empty", () => {
        expect(
            validateStage(
                fakeCtx({
                    body: { email: "ada@example.com", name: "Ada" },
                    route: routeWithBody({
                        name: "string",
                        email: "string.required",
                    }),
                }),
            ),
        ).toBeUndefined();
    });

    it("no-ops for body specs that have no .required keys", () => {
        expect(
            validateStage(
                fakeCtx({
                    body: {},
                    route: routeWithBody({ name: "string", interest: "string" }),
                }),
            ),
        ).toBeUndefined();
    });
});
