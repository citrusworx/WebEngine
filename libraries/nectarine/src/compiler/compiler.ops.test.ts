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

    it("rejects COUNT with orderBy", () => {
        expect(() =>
            compileQuery({
                type: "SELECT",
                table: "products",
                count: true,
                orderBy: "created_at ASC",
            }),
        ).toThrowError(/COUNT cannot include orderBy/);
        expect(() =>
            compileQuery({
                select: [{ fn: "count" }],
                from: "products",
                orderBy: [{ column: "created_at", direction: "ASC" }],
            }),
        ).toThrowError(/COUNT cannot include orderBy/);
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

describe("compiler ops: ON CONFLICT", () => {
    it("compiles canonical DO NOTHING", () => {
        expect(
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", { value: "$2", cast: "jsonb" }],
                    onConflict: { target: ["id"], do: "nothing" },
                },
            }),
        ).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING",
        );
    });

    it("compiles canonical DO UPDATE SET EXCLUDED", () => {
        expect(
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", "$2::jsonb"],
                    onConflict: { target: ["id"], do: "update", set: ["payload"] },
                },
            }),
        ).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload",
        );
    });

    it("accepts query-root onConflict, action aliases, and string targets", () => {
        expect(
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", "$2::jsonb"],
                },
                onConflict: { target: "id", action: "do_nothing" },
                returning: ["payload"],
            }),
        ).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING RETURNING payload",
        );
        expect(
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", "$2::jsonb"],
                    onConflict: {
                        target: ["id", "catalog"],
                        action: "do_update",
                        set: ["payload"],
                    },
                },
            }),
        ).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id, catalog) DO UPDATE SET payload = EXCLUDED.payload",
        );
    });

    it("compiles Blackwater type: INSERT onConflict", () => {
        expect(
            compileQuery({
                type: "INSERT",
                table: "products",
                fields: ["id", "payload"],
                values: ["$1", { value: "$2", cast: "jsonb" }],
                onConflict: { target: "id", do: "nothing" },
            }),
        ).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING",
        );
        expect(
            compileQuery({
                type: "INSERT",
                table: "products",
                fields: ["id", "payload"],
                values: ["$1", "$2::jsonb"],
                onConflict: { target: ["id"], do: "update", set: ["payload"] },
                returning: ["payload"],
            }),
        ).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload RETURNING payload",
        );
    });

    it("quotes mixed-case conflict and EXCLUDED columns", () => {
        expect(
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "originalPrice"],
                    values: ["$1", "$2"],
                    onConflict: { target: ["id"], do: "update", set: ["originalPrice"] },
                },
            }),
        ).toBe(
            'INSERT INTO products (id, "originalPrice") VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET "originalPrice" = EXCLUDED."originalPrice"',
        );
    });

    it("rejects incomplete or open-ended onConflict YAML", () => {
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id"],
                    values: ["$1"],
                    onConflict: { do: "nothing" },
                },
            }),
        ).toThrowError(/onConflict.target/);
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id"],
                    values: ["$1"],
                    onConflict: { target: ["id"], do: "ignore" },
                },
            }),
        ).toThrowError(/Unknown onConflict action: ignore/);
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", "$2"],
                    onConflict: { target: ["id"], do: "nothing", set: ["payload"] },
                },
            }),
        ).toThrowError(/cannot include set/);
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", "$2"],
                    onConflict: { target: ["id"], do: "update" },
                },
            }),
        ).toThrowError(/onConflict.set/);
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id"],
                    values: ["$1"],
                    onConflict: { target: ["id"], do: "nothing", constraint: "products_pkey" },
                },
            }),
        ).toThrowError(/Unknown onConflict key: constraint/);
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id"],
                    values: ["$1"],
                    onConflict: { target: ["id"], do: "update", set: ["payload"], where: "id = $1" },
                },
            }),
        ).toThrowError(/Unknown onConflict key: where/);
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id"],
                    values: ["$1"],
                    onConflict: { target: "id); DROP TABLE products; --", do: "nothing" },
                },
            }),
        ).toThrowError(/Invalid onConflict.target/);
        expect(() =>
            compileQuery({
                type: "SELECT",
                table: "products",
                fields: "payload",
                onConflict: { target: "id", do: "nothing" },
            }),
        ).toThrowError(/only valid on INSERT/);
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id"],
                    values: ["$1"],
                    onConflict: { target: ["id"], do: "nothing", action: "do_update" },
                },
            }),
        ).toThrowError(/must agree/);
    });

    it("does not splice caller values into ON CONFLICT SQL", () => {
        const sql = compileQuery({
            insert: {
                into: "products",
                columns: ["id", "payload"],
                values: ["$1", "$2::jsonb"],
                onConflict: { target: ["id"], do: "update", set: ["payload"] },
            },
        });
        expect(sql).not.toContain("fuzzface");
        expect(sql).not.toContain("'; DROP");
        expect(sql).toMatch(/EXCLUDED\.payload$/);
    });
});
