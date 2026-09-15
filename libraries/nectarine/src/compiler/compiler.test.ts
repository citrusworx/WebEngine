import path from "node:path";
import { describe, expect, it } from "vitest";
import { parser } from "../util/util.js";
import { CCompiler, QueryCompileError, compileQuery } from "./compiler.js";

const userYml = path.resolve(
    import.meta.dirname,
    "../../models/user/db/pg/user.yml",
);

function compileNamed(type: string, method: string, query: string): string {
    const compiler = new CCompiler();
    const parsed = compiler.parse_config(userYml);
    const cleaned = compiler.clean_parse(parsed, type, method);
    return compiler.buildQuery(cleaned, query);
}

describe("CCompiler", () => {
    it("compiles SELECT with a WHERE predicate", () => {
        expect(compileNamed("user", "get", "UserById")).toBe(
            "SELECT id FROM users WHERE id = $1",
        );
        expect(compileNamed("user", "get", "UserByAge")).toBe(
            "SELECT id, name FROM users WHERE age > $1",
        );
    });

    it("compiles SELECT without WHERE", () => {
        expect(compileNamed("user", "get", "AllUsers")).toBe("SELECT * FROM users");
    });

    it("compiles INSERT with NOW()", () => {
        expect(compileNamed("user", "create", "NewUser")).toBe(
            "INSERT INTO users (email, password, name, created_at) VALUES ($1, $2, $3, NOW())",
        );
    });

    it("compiles UPDATE with placeholders and NOW()", () => {
        expect(compileNamed("user", "update", "UserById")).toBe(
            "UPDATE users SET name = $1, age = $2, updated_at = NOW() WHERE id = $3",
        );
    });

    it("compiles DELETE with a WHERE predicate", () => {
        expect(compileNamed("user", "delete", "User")).toBe(
            "DELETE FROM users WHERE id = $1",
        );
    });

    it("compiles the remaining user.yml query names", () => {
        expect(compileNamed("user", "get", "UsersByEmail")).toBe(
            "SELECT email FROM users WHERE email = $1",
        );
        expect(compileNamed("user", "get", "UserLogin")).toBe(
            "SELECT id, name, password FROM users WHERE email = $1",
        );
        expect(compileNamed("user", "update", "UserPassword")).toBe(
            "UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2",
        );
    });

    it("throws on an unknown operator", () => {
        const compiler = new CCompiler();
        const cleaned = {
            UserById: {
                select: ["id"],
                from: "users",
                where: { column: "id", operator: "like", value: "$1" },
            },
        };

        expect(() => compiler.buildQuery(cleaned, "UserById", "get")).toThrowError(
            QueryCompileError,
        );
        expect(() => compiler.buildQuery(cleaned, "UserById", "get")).toThrowError(
            /Unknown operator: like/,
        );
    });

    it("throws when the named query is missing", () => {
        const compiler = new CCompiler();
        const parsed = compiler.parse_config(userYml);
        const cleaned = compiler.clean_parse(parsed, "user", "get");

        expect(() => compiler.buildQuery(cleaned, "DoesNotExist")).toThrowError(
            QueryCompileError,
        );
        expect(() => compiler.buildQuery(cleaned, "DoesNotExist")).toThrowError(
            /Query not found: DoesNotExist/,
        );
    });

    it("indexes YAML as type → method (user.get), matching genSQL", () => {
        const compiler = new CCompiler();
        const parsed = compiler.parse_config(userYml);
        const cleaned = compiler.clean_parse(parsed, "user", "get");

        expect(cleaned.method).toBe("get");
        expect(cleaned.queries).toHaveProperty("UserById");
        expect(cleaned.queries).toHaveProperty("AllUsers");
        expect(() => compiler.clean_parse(parsed, "get", "user")).toThrowError(
            /Unknown CRUD method: user|SQL configuration not found for type: get/,
        );
    });

    it("throws on an incomplete GET shape instead of emitting DELETE", () => {
        const compiler = new CCompiler();
        const incomplete = {
            from: "users",
            where: { column: "id", operator: "eq", value: "$1" },
        };

        expect(() => compiler.buildQuery({ Broken: incomplete }, "Broken", "get")).toThrowError(
            QueryCompileError,
        );
        expect(() => compiler.buildQuery({ Broken: incomplete }, "Broken", "get")).toThrowError(
            /GET query requires select/,
        );
        expect(() => compileQuery(incomplete)).toThrowError(QueryCompileError);
        expect(() => compileQuery(incomplete)).toThrowError(
            /Unsupported or ambiguous query shape/,
        );
        expect(compileQuery(incomplete, "delete")).toBe(
            "DELETE FROM users WHERE id = $1",
        );
    });

    it("compiles a tightly allowlisted $N::jsonb bind cast", () => {
        const compiler = new CCompiler();
        const insert = {
            NewPayload: {
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", "$2::jsonb"],
                },
            },
        };

        expect(compiler.buildQuery(insert, "NewPayload", "create")).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb)",
        );
        expect(
            compileQuery({
                select: ["payload"],
                from: "products",
                where: { column: "payload", operator: "eq", value: "$1::JSONB" },
            }),
        ).toBe("SELECT payload FROM products WHERE payload = $1::jsonb");
    });

    it("rejects unbound casts and unknown cast types", () => {
        expect(() =>
            compileQuery({
                select: ["payload"],
                from: "products",
                where: { column: "payload", operator: "eq", value: "$1::jsonb; DROP TABLE products" },
            }),
        ).toThrowError(QueryCompileError);
        expect(() =>
            compileQuery({
                select: ["id"],
                from: "products",
                where: { column: "id", operator: "eq", value: "$1::int" },
            }),
        ).toThrowError(QueryCompileError);
    });

    it("compiles a validated jsonb object bind cast", () => {
        expect(
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", { value: "$2", cast: "jsonb" }],
                },
            }),
        ).toBe("INSERT INTO products (id, payload) VALUES ($1, $2::jsonb)");
    });

    it("rejects an unsafe or unknown object cast", () => {
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", { value: "$2", cast: "int" }],
                },
            }),
        ).toThrowError(/Unsupported cast "int"/);
        expect(() =>
            compileQuery({
                insert: {
                    into: "products",
                    columns: ["id", "payload"],
                    values: ["$1", { value: "$2", cast: "jsonb; DROP TABLE products" }],
                },
            }),
        ).toThrowError(/Unsupported cast/);
    });

    it("rejects number and boolean literals", () => {
        const compiler = new CCompiler();
        const withNumber = {
            UserById: {
                select: ["id"],
                from: "users",
                where: { column: "id", operator: "eq", value: 1 },
            },
        };
        const withBoolean = {
            UserById: {
                select: ["id"],
                from: "users",
                where: { column: "id", operator: "eq", value: true },
            },
        };

        expect(() => compiler.buildQuery(withNumber, "UserById", "get")).toThrowError(
            QueryCompileError,
        );
        expect(() => compiler.buildQuery(withNumber, "UserById", "get")).toThrowError(
            /Unsupported value 1/,
        );
        expect(() => compiler.buildQuery(withBoolean, "UserById", "get")).toThrowError(
            /Unsupported value true/,
        );
    });

    it("shares compilation with parser.buildSQL / genSQL", () => {
        const query = parser.genSQL(userYml, "user", "get", "UserById");
        expect(parser.buildSQL(query)).toBe("SELECT id FROM users WHERE id = $1");
        expect(compileQuery(query)).toBe("SELECT id FROM users WHERE id = $1");

        const del = parser.genSQL(userYml, "user", "delete", "User");
        expect(parser.buildSQL(del, "delete")).toBe("DELETE FROM users WHERE id = $1");
        expect(() => parser.buildSQL(del)).toThrowError(QueryCompileError);
    });
});
