import { describe, expect, it } from "vitest";
import { compileQuery, QueryCompileError } from "./compiler.js";

describe("compiler ops: COUNT", () => {
    it("compiles canonical { fn: count }", () => {
        expect(
            compileQuery({
                select: [{ fn: "count" }],
                from: "products",
            }),
        ).toBe("SELECT COUNT(*) FROM products");
    });

    it("compiles COUNT(column) with an alias", () => {
        expect(
            compileQuery({
                select: [{ fn: "count", column: "id", as: "n" }],
                from: "waitlist",
                where: { column: "email", operator: "eq", value: "$1" },
            }),
        ).toBe("SELECT COUNT(id) AS n FROM waitlist WHERE email = $1");
    });

    it("compiles Blackwater count: true", () => {
        expect(
            compileQuery({
                type: "SELECT",
                table: "products",
                count: true,
            }),
        ).toBe("SELECT COUNT(*) FROM products");
        expect(
            compileQuery({
                type: "SELECT",
                table: "products",
                count: true,
                where: "payload->>'catalog' = $1",
            }),
        ).toBe("SELECT COUNT(*) FROM products WHERE payload->>'catalog' = $1");
    });

    it("rejects mixing COUNT with other columns", () => {
        expect(() =>
            compileQuery({
                select: [{ fn: "count" }, "id"],
                from: "products",
            }),
        ).toThrowError(/COUNT cannot mix with other select columns/);
    });

    it("rejects count: true with fields", () => {
        expect(() =>
            compileQuery({
                type: "SELECT",
                table: "products",
                count: true,
                fields: "payload",
            }),
        ).toThrowError(/count: true cannot include fields/);
    });
});

describe("compiler ops: EXISTS", () => {
    it("compiles exists: true with a where clause", () => {
        expect(
            compileQuery({
                exists: true,
                from: "waitlist",
                where: { column: "email", operator: "eq", value: "$1" },
            }),
        ).toBe("SELECT EXISTS(SELECT 1 FROM waitlist WHERE email = $1)");
    });

    it("compiles exists as a nested object", () => {
        expect(
            compileQuery({
                exists: {
                    from: "products",
                    where: { column: "id", operator: "eq", value: "$1" },
                },
            }),
        ).toBe("SELECT EXISTS(SELECT 1 FROM products WHERE id = $1)");
    });

    it("compiles EXISTS without WHERE (non-empty table)", () => {
        expect(
            compileQuery({
                exists: true,
                from: "products",
            }),
        ).toBe("SELECT EXISTS(SELECT 1 FROM products)");
    });

    it("compiles Blackwater exists: true", () => {
        expect(
            compileQuery({
                type: "SELECT",
                table: "waitlist",
                exists: true,
                where: "email = $1",
            }),
        ).toBe("SELECT EXISTS(SELECT 1 FROM waitlist WHERE email = $1)");
    });

    it("rejects EXISTS mixed with select or orderBy", () => {
        expect(() =>
            compileQuery({
                exists: true,
                select: ["id"],
                from: "waitlist",
            }),
        ).toThrowError(/Ambiguous query shape|EXISTS cannot include select/);
        expect(() =>
            compileQuery({
                type: "SELECT",
                table: "waitlist",
                exists: true,
                orderBy: "created_at ASC",
            }),
        ).toThrowError(/EXISTS cannot include orderBy/);
        expect(() =>
            compileQuery({
                type: "SELECT",
                table: "waitlist",
                exists: true,
                count: true,
            }),
        ).toThrowError(/cannot mix count and exists/);
    });
});

describe("compiler ops: JSONB", () => {
    it("compiles contains (@>) with a jsonb bind", () => {
        expect(
            compileQuery({
                select: ["payload"],
                from: "products",
                where: { column: "payload", operator: "contains", value: "$1::jsonb" },
            }),
        ).toBe("SELECT payload FROM products WHERE payload @> $1::jsonb");
    });

    it("compiles has_key (?)", () => {
        expect(
            compileQuery({
                select: ["payload"],
                from: "products",
                where: { column: "payload", operator: "has_key", value: "$1" },
            }),
        ).toBe("SELECT payload FROM products WHERE payload ? $1");
    });

    it("compiles ->> text path for equality", () => {
        expect(
            compileQuery({
                select: ["payload"],
                from: "products",
                where: { column: "payload", path: "catalog", operator: "eq", value: "$1" },
            }),
        ).toBe("SELECT payload FROM products WHERE payload->>'catalog' = $1");
        expect(
            compileQuery({
                select: ["payload"],
                from: "products",
                where: {
                    column: "payload",
                    path: ["specs", "color"],
                    operator: "eq",
                    value: "$1",
                },
            }),
        ).toBe("SELECT payload FROM products WHERE payload->'specs'->>'color' = $1");
    });

    it("keeps jsonb (->) for contains/has_key with a path", () => {
        expect(
            compileQuery({
                select: ["payload"],
                from: "products",
                where: {
                    column: "payload",
                    path: "tags",
                    operator: "contains",
                    value: "$1::jsonb",
                },
            }),
        ).toBe("SELECT payload FROM products WHERE payload->'tags' @> $1::jsonb");
        expect(
            compileQuery({
                select: ["payload"],
                from: "products",
                where: { column: "payload", path: "meta", operator: "has_key", value: "$1" },
            }),
        ).toBe("SELECT payload FROM products WHERE payload->'meta' ? $1");
    });

    it("compiles Blackwater JSONB fragments", () => {
        expect(
            compileQuery({
                type: "SELECT",
                table: "products",
                fields: "payload",
                where: "payload->>'catalog' = $1",
            }),
        ).toBe("SELECT payload FROM products WHERE payload->>'catalog' = $1");
        expect(
            compileQuery({
                type: "SELECT",
                table: "products",
                fields: "payload",
                where: "payload @> $1::jsonb",
            }),
        ).toBe("SELECT payload FROM products WHERE payload @> $1::jsonb");
        expect(
            compileQuery({
                type: "SELECT",
                table: "products",
                fields: "payload",
                where: "payload ? $1",
            }),
        ).toBe("SELECT payload FROM products WHERE payload ? $1");
    });

    it("rejects a bound path key", () => {
        expect(() =>
            compileQuery({
                select: ["payload"],
                from: "products",
                where: { column: "payload", path: "$1", operator: "eq", value: "$2" },
            }),
        ).toThrowError(/YAML-authored constants/);
    });

    it("does not splice user input into JSONB SQL", () => {
        const sql = compileQuery({
            select: ["payload"],
            from: "products",
            where: { column: "payload", path: "catalog", operator: "eq", value: "$1" },
        });
        expect(sql).not.toContain("gear");
        expect(sql).not.toContain("'; DROP");
    });
});
