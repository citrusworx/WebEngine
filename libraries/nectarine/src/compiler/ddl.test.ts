import path from "node:path";
import { describe, expect, it } from "vitest";
import { CCompiler, compileSchema, compileSchemas, compileTable, SchemaCompileError } from "./compiler.js";

const fixtureProduct = path.resolve(
    import.meta.dirname,
    "../config/__fixtures__/schemas/product/productSchema.yml",
);

describe("schema DDL compiler", () => {
    it("compiles a string-field schema to Postgres CREATE TABLE", () => {
        const sql = compileSchema(fixtureProduct, "postgres");
        expect(sql).toBe(
            [
                "CREATE TABLE IF NOT EXISTS products (",
                "  id TEXT PRIMARY KEY,",
                "  name TEXT NOT NULL",
                ");",
            ].join("\n"),
        );
    });

    it("keeps JSONB first-class and emits CHECK enums, defaults, and indexes", () => {
        const schema = {
            Product: {
                table: "products",
                fields: {
                    id: "string PRIMARY KEY",
                    payload: "jsonb NOT NULL",
                    tags: "json",
                    status: "enum(draft, published) DEFAULT 'draft'",
                    created_at: "timestamp NOT NULL DEFAULT NOW()",
                },
            },
            WaitlistEntry: {
                table: "waitlist",
                fields: {
                    id: "string PRIMARY KEY",
                    name: "string NOT NULL DEFAULT ''",
                    email: "string NOT NULL UNIQUE",
                    source_app: "enum(www, gear, software)",
                },
                indexes: {
                    waitlist_email_idx: { columns: ["email"] },
                },
            },
        };

        const sql = compileSchema(schema, "postgres");
        expect(sql).toContain("payload JSONB NOT NULL");
        expect(sql).toContain("tags JSON");
        expect(sql).toContain("CHECK (status IN ('draft', 'published'))");
        expect(sql).toContain("DEFAULT NOW()");
        expect(sql).toContain("name TEXT NOT NULL DEFAULT ''");
        expect(sql).toContain("email TEXT NOT NULL UNIQUE");
        expect(sql).toContain(
            "CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);",
        );
        expect(sql.indexOf("CREATE TABLE IF NOT EXISTS products")).toBeLessThan(
            sql.indexOf("CREATE TABLE IF NOT EXISTS waitlist"),
        );
    });

    it("quotes mixed-case identifiers so Postgres does not fold them", () => {
        const sql = compileSchema(
            {
                Product: {
                    table: "products",
                    fields: {
                        id: "string PRIMARY KEY",
                        originalPrice: "string",
                        isNew: "boolean DEFAULT false",
                        isActive: "boolean DEFAULT true",
                    },
                },
            },
            "postgres",
        );

        expect(sql).toContain('"originalPrice" TEXT');
        expect(sql).toContain('"isNew" BOOLEAN DEFAULT FALSE');
        expect(sql).toContain('"isActive" BOOLEAN DEFAULT TRUE');
        expect(sql).not.toMatch(/(?:^|[^"])originalPrice TEXT/);
        expect(sql).not.toContain("originalprice");
        expect(sql).not.toContain("isnew");
        expect(sql).not.toContain("isactive");

        const mysql = compileSchema(
            {
                Product: {
                    table: "products",
                    fields: { isNew: "boolean" },
                },
            },
            "mysql",
        );
        expect(mysql).toContain("`isNew` BOOLEAN");
    });

    it("emits SERIAL PRIMARY KEY and inline REFERENCES, ordered by foreign keys", () => {
        const sql = compileSchemas(
            [
                {
                    Comment: {
                        table: "comments",
                        fields: {
                            id: "int PRIMARY KEY AUTO_INCREMENT",
                            post_id: "int FOREIGN KEY REFERENCES posts(id) NOT NULL",
                            body: "text NOT NULL",
                        },
                    },
                },
                {
                    Post: {
                        table: "posts",
                        fields: {
                            id: "int PRIMARY KEY AUTO_INCREMENT",
                            title: "VARCHAR(255) NOT NULL",
                        },
                    },
                },
            ],
            "postgres",
        );

        expect(sql).toMatch(
            /CREATE TABLE IF NOT EXISTS posts \([\s\S]*id SERIAL PRIMARY KEY/,
        );
        expect(sql).toContain("post_id INTEGER NOT NULL REFERENCES posts(id)");
        expect(sql.indexOf("CREATE TABLE IF NOT EXISTS posts")).toBeLessThan(
            sql.indexOf("CREATE TABLE IF NOT EXISTS comments"),
        );
    });

    it("compiles object-shaped fields and MySQL types", () => {
        const schema = {
            User: {
                table: "users",
                fields: {
                    id: { type: "int", primaryKey: true, autoIncrement: true },
                    username: { type: "VARCHAR", length: 55, unique: true, null: false },
                    role: "enum(admin, user) DEFAULT 'user'",
                    created_at: "timestamp DEFAULT NOW()",
                },
            },
        };

        expect(compileSchema(schema, "postgres")).toContain("id SERIAL PRIMARY KEY");
        expect(compileSchema(schema, "postgres")).toContain("username VARCHAR(55) NOT NULL UNIQUE");

        const mysql = compileSchema(schema, "mysql");
        expect(mysql).toContain("id INT PRIMARY KEY AUTO_INCREMENT");
        expect(mysql).toContain("ENUM('admin', 'user')");
        expect(mysql).toContain("created_at DATETIME DEFAULT NOW()");
    });

    it("emits Postgres IF NOT EXISTS indexes and MySQL CREATE INDEX without IF NOT EXISTS", () => {
        const schema = {
            WaitlistEntry: {
                table: "waitlist",
                fields: { id: "string PRIMARY KEY", email: "string NOT NULL UNIQUE" },
                indexes: { waitlist_email_idx: { columns: ["email"] } },
            },
        };

        expect(compileSchema(schema, "postgres")).toContain(
            "CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);",
        );
        expect(compileSchema(schema, "mysql")).toContain(
            "CREATE INDEX waitlist_email_idx ON waitlist (email);",
        );
        expect(compileSchema(schema, "mysql")).not.toContain("IF NOT EXISTS waitlist_email_idx");
    });

    it("emits additive ADD COLUMN IF NOT EXISTS for existing Postgres tables", () => {
        const schema = {
            WaitlistEntry: {
                table: "waitlist",
                fields: {
                    id: "string PRIMARY KEY",
                    name: "string NOT NULL DEFAULT ''",
                    source_app: "enum(www, gear, software)",
                    interest: "string",
                },
            },
        };

        const created = compileSchema(schema, "postgres");
        expect(created).not.toContain("ALTER TABLE");

        const additive = compileSchema(schema, "postgres", { additive: true });
        expect(additive).toContain(
            "ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';",
        );
        expect(additive).toContain(
            "ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS source_app TEXT CHECK (source_app IN ('www', 'gear', 'software'));",
        );
        expect(additive).toContain(
            "ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS interest TEXT;",
        );
        expect(additive).not.toContain("ADD COLUMN IF NOT EXISTS id ");
    });

    it("exposes CCompiler.buildDdl / buildTable as the phonics entry", () => {
        const compiler = new CCompiler();
        const parsed = compiler.parse_config(fixtureProduct);
        expect(compiler.buildDdl(parsed)).toBe(compileSchema(parsed, "postgres"));
        expect(compiler.buildTable(parsed, "Product")).toBe(
            compileTable(parsed, "Product", "postgres"),
        );
    });

    it("rejects identifier injection, unknown vendors, and empty schemas", () => {
        expect(() =>
            compileSchema({
                Evil: { table: "products; DROP TABLE waitlist", fields: { id: "string" } },
            }),
        ).toThrowError(SchemaCompileError);

        expect(() =>
            compileSchema({
                Product: { table: "products", fields: { "id;drop": "string PRIMARY KEY" } },
            }),
        ).toThrowError(/Invalid column/);

        expect(() => compileSchema({ Product: { table: "products", fields: {} } })).toThrowError(
            SchemaCompileError,
        );

        expect(() => compileSchema({ Product: { table: "products", fields: { id: "string" } } }, "mongodb")).toThrowError(
            /MongoDB is not SQL/,
        );
    });
});
