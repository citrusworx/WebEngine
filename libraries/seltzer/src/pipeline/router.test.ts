import { describe, expect, it } from "vitest";
import type { ResponseData } from "../core/response.js";
import { compileRoute, comparePathRank, matchRoute, rankPath } from "./router.js";

const ok =
    (label: string) =>
    (): ResponseData => ({ body: { route: label } });

describe("path rank", () => {
    it("ranks static prefixes ahead of :id", () => {
        expect(comparePathRank(rankPath("/api/products/catalog/:catalog"), rankPath("/api/products/:id"))).toBeLessThan(
            0,
        );
        expect(comparePathRank(rankPath("/api/products/slug/:slug"), rankPath("/api/products/:id"))).toBeLessThan(0);
        expect(comparePathRank(rankPath("/items/new"), rankPath("/items/:id"))).toBeLessThan(0);
    });
});

describe("matchRoute", () => {
    it("lets static-prefix product routes win even when :id is registered first", () => {
        const routes = [
            { method: "GET", path: "/api/products/:id", handler: ok("by-id") },
            { method: "GET", path: "/api/products/catalog/:catalog", handler: ok("catalog") },
            { method: "GET", path: "/api/products/slug/:slug", handler: ok("slug") },
        ].map(compileRoute);

        expect(matchRoute(routes, "GET", "/api/products/stinkrat")?.path).toBe("/api/products/:id");
        expect(matchRoute(routes, "GET", "/api/products/catalog/gear")?.path).toBe(
            "/api/products/catalog/:catalog",
        );
        expect(matchRoute(routes, "GET", "/api/products/slug/stink-rat")?.path).toBe(
            "/api/products/slug/:slug",
        );
    });

    it("lets a static sibling win over :id regardless of registration order", () => {
        const routes = [
            { method: "GET", path: "/items/:id", handler: ok("param") },
            { method: "GET", path: "/items/new", handler: ok("static") },
        ].map(compileRoute);

        expect(matchRoute(routes, "GET", "/items/new")?.path).toBe("/items/new");
        expect(matchRoute(routes, "GET", "/items/42")?.path).toBe("/items/:id");
    });

    it("preserves Route.contract through compile and match", () => {
        const contract = {
            resource: "waitlist",
            name: "joinWaitlist",
            body: { email: "string.required" },
        };
        const compiled = compileRoute({
            method: "POST",
            path: "/api/waitlist",
            handler: ok("join"),
            contract,
        });

        expect(compiled.contract).toEqual(contract);
        expect(matchRoute([compiled], "POST", "/api/waitlist")?.contract).toEqual(contract);
    });
});
