import { describe, expect, it } from "vitest";
import { compileQuery } from "../../compiler/sql.js";
import { rewriteMysqlPlaceholders } from "./placeholders.js";

describe("rewriteMysqlPlaceholders", () => {
    it("passes through SQL that already uses ?", () => {
        expect(rewriteMysqlPlaceholders("SELECT id FROM users WHERE id = ?", [1])).toEqual({
            sql: "SELECT id FROM users WHERE id = ?",
            params: [1],
        });
    });

    it("passes through SQL with no binds", () => {
        expect(rewriteMysqlPlaceholders("SELECT * FROM users")).toEqual({
            sql: "SELECT * FROM users",
            params: [],
        });
    });

    it("rewrites sequential $1 $2 binds and keeps param order", () => {
        expect(
            rewriteMysqlPlaceholders(
                "INSERT INTO users (email, name) VALUES ($1, $2)",
                ["a@example.com", "Ada"],
            ),
        ).toEqual({
            sql: "INSERT INTO users (email, name) VALUES (?, ?)",
            params: ["a@example.com", "Ada"],
        });
    });

    it("rewrites $10 without treating it as $1", () => {
        const params = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        expect(
            rewriteMysqlPlaceholders("SELECT * FROM t WHERE a = $1 AND b = $10", params),
        ).toEqual({
            sql: "SELECT * FROM t WHERE a = ? AND b = ?",
            params: [1, 10],
        });
    });

    it("rebinds out-of-order and reused $N to appearance order", () => {
        expect(
            rewriteMysqlPlaceholders("SELECT * FROM t WHERE a = $2 AND b = $1 AND c = $2", [
                "first",
                "second",
            ]),
        ).toEqual({
            sql: "SELECT * FROM t WHERE a = ? AND b = ? AND c = ?",
            params: ["second", "first", "second"],
        });
    });

    it("maps $N::jsonb and $N::json to CAST(? AS JSON)", () => {
        expect(
            rewriteMysqlPlaceholders(
                "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb)",
                [1, { name: "amp" }],
            ),
        ).toEqual({
            sql: "INSERT INTO products (id, payload) VALUES (?, CAST(? AS JSON))",
            params: [1, '{"name":"amp"}'],
        });
        expect(
            rewriteMysqlPlaceholders("SELECT payload FROM products WHERE payload = $1::JSON", [
                { ok: true },
            ]),
        ).toEqual({
            sql: "SELECT payload FROM products WHERE payload = CAST(? AS JSON)",
            params: ['{"ok":true}'],
        });
        expect(
            rewriteMysqlPlaceholders("SELECT payload FROM products WHERE payload = $1::json", [
                ["amp", "cab"],
            ]),
        ).toEqual({
            sql: "SELECT payload FROM products WHERE payload = CAST(? AS JSON)",
            params: ['["amp","cab"]'],
        });
    });

    it("strips $N::text to ? and leaves string params as-is", () => {
        expect(
            rewriteMysqlPlaceholders("SELECT id FROM users WHERE email = $1::text", [
                "a@example.com",
            ]),
        ).toEqual({
            sql: "SELECT id FROM users WHERE email = ?",
            params: ["a@example.com"],
        });
    });

    it("does not stringify Date or Buffer JSON binds", () => {
        const when = new Date("2026-01-01T00:00:00.000Z");
        const buf = Buffer.from("{}");
        expect(rewriteMysqlPlaceholders("SELECT $1::json", [when])).toEqual({
            sql: "SELECT CAST(? AS JSON)",
            params: [when],
        });
        expect(rewriteMysqlPlaceholders("SELECT $1::jsonb", [buf])).toEqual({
            sql: "SELECT CAST(? AS JSON)",
            params: [buf],
        });
        expect(rewriteMysqlPlaceholders("SELECT $1::json", [null])).toEqual({
            sql: "SELECT CAST(? AS JSON)",
            params: [null],
        });
    });

    it("does not rewrite $1 inside quotes, backticks, or comments", () => {
        const sql =
            "SELECT '$1', \"id = $2\", `col$3` FROM t WHERE id = $1 -- $4\n/* $5 */ AND name = $2::jsonb";
        expect(rewriteMysqlPlaceholders(sql, [7, { x: 1 }])).toEqual({
            sql: "SELECT '$1', \"id = $2\", `col$3` FROM t WHERE id = ? -- $4\n/* $5 */ AND name = CAST(? AS JSON)",
            params: [7, '{"x":1}'],
        });
    });

    it("respects doubled quotes and backslash escapes", () => {
        expect(
            rewriteMysqlPlaceholders("SELECT 'it''s $1', 'say \\'$1\\'' WHERE id = $1", [3]),
        ).toEqual({
            sql: "SELECT 'it''s $1', 'say \\'$1\\'' WHERE id = ?",
            params: [3],
        });
    });

    it("rejects mixed $N and ? placeholders", () => {
        expect(() =>
            rewriteMysqlPlaceholders("SELECT * FROM t WHERE a = $1 AND b = ?", [1, 2]),
        ).toThrowError(/cannot mix \$N and \? placeholders/);
    });

    it("rejects a $N with no matching param", () => {
        expect(() => rewriteMysqlPlaceholders("SELECT * FROM t WHERE id = $2", [1])).toThrowError(
            /cannot bind \$2; received 1 parameter/,
        );
        expect(() => rewriteMysqlPlaceholders("SELECT * FROM t WHERE id = $1")).toThrowError(
            /cannot bind \$1; received 0 parameter/,
        );
    });

    it("rejects unknown bind casts instead of emitting ?::int", () => {
        expect(() =>
            rewriteMysqlPlaceholders("SELECT * FROM t WHERE id = $1::int", [1]),
        ).toThrowError(/unsupported bind cast \$1::int/);
    });

    it("rewrites compiler output while the compiler still emits $1", () => {
        const compiled = compileQuery({
            select: ["id"],
            from: "users",
            where: { column: "id", operator: "eq", value: "$1" },
        });
        expect(compiled).toBe("SELECT id FROM users WHERE id = $1");

        expect(rewriteMysqlPlaceholders(compiled, [42])).toEqual({
            sql: "SELECT id FROM users WHERE id = ?",
            params: [42],
        });

        const jsonb = compileQuery({
            insert: {
                into: "products",
                columns: ["id", "payload"],
                values: ["$1", "$2::jsonb"],
            },
        });
        expect(jsonb).toBe("INSERT INTO products (id, payload) VALUES ($1, $2::jsonb)");
        expect(rewriteMysqlPlaceholders(jsonb, ["sku-1", { sku: "sku-1" }])).toEqual({
            sql: "INSERT INTO products (id, payload) VALUES (?, CAST(? AS JSON))",
            params: ["sku-1", '{"sku":"sku-1"}'],
        });
    });

    it("rewrites JSONB ->> / @> / ? to MySQL JSON functions", () => {
        const path = compileQuery({
            select: ["payload"],
            from: "products",
            where: { column: "payload", path: "catalog", operator: "eq", value: "$1" },
        });
        expect(rewriteMysqlPlaceholders(path, ["gear"])).toEqual({
            sql: "SELECT payload FROM products WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.catalog')) = ?",
            params: ["gear"],
        });

        const contains = compileQuery({
            select: ["payload"],
            from: "products",
            where: { column: "payload", operator: "contains", value: "$1::jsonb" },
        });
        expect(rewriteMysqlPlaceholders(contains, [{ catalog: "gear" }])).toEqual({
            sql: "SELECT payload FROM products WHERE JSON_CONTAINS(payload, CAST(? AS JSON))",
            params: ['{"catalog":"gear"}'],
        });

        const hasKey = compileQuery({
            select: ["payload"],
            from: "products",
            where: { column: "payload", operator: "has_key", value: "$1" },
        });
        expect(rewriteMysqlPlaceholders(hasKey, ["slug"])).toEqual({
            sql: "SELECT payload FROM products WHERE JSON_CONTAINS_PATH(payload, 'one', CONCAT('$.', JSON_QUOTE(?)))",
            params: ["slug"],
        });
    });

    it("rewrites @> string constants and quotes bound has_key segments", () => {
        const containsConst = compileQuery({
            type: "SELECT",
            table: "products",
            fields: "payload",
            where: "payload @> '{\"catalog\":\"gear\"}'",
        });
        expect(rewriteMysqlPlaceholders(containsConst)).toEqual({
            sql: "SELECT payload FROM products WHERE JSON_CONTAINS(payload, CAST('{\"catalog\":\"gear\"}' AS JSON))",
            params: [],
        });

        const hasKey = compileQuery({
            select: ["payload"],
            from: "products",
            where: { column: "payload", operator: "has_key", value: "$1" },
        });
        expect(rewriteMysqlPlaceholders(hasKey, ["a.b"])).toEqual({
            sql: "SELECT payload FROM products WHERE JSON_CONTAINS_PATH(payload, 'one', CONCAT('$.', JSON_QUOTE(?)))",
            params: ["a.b"],
        });
        expect(rewriteMysqlPlaceholders(hasKey, ["source-app"])).toEqual({
            sql: "SELECT payload FROM products WHERE JSON_CONTAINS_PATH(payload, 'one', CONCAT('$.', JSON_QUOTE(?)))",
            params: ["source-app"],
        });
    });

    it("rewrites COUNT and EXISTS compiler SQL", () => {
        const count = compileQuery({ select: [{ fn: "count" }], from: "products" });
        expect(rewriteMysqlPlaceholders(count)).toEqual({
            sql: "SELECT COUNT(*) FROM products",
            params: [],
        });

        const exists = compileQuery({
            exists: true,
            from: "waitlist",
            where: { column: "email", operator: "eq", value: "$1" },
        });
        expect(rewriteMysqlPlaceholders(exists, ["a@example.com"])).toEqual({
            sql: "SELECT EXISTS(SELECT 1 FROM waitlist WHERE email = ?)",
            params: ["a@example.com"],
        });
    });
});
