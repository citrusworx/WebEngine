import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CCompiler, compileSchema, compileSchemas, SchemaCompileError } from "./compiler.js";

const schemas = path.resolve(
    import.meta.dirname,
    "../../../../apps/blackwatersound/back/src/schemas",
);
const initSqlPath = path.resolve(
    import.meta.dirname,
    "../../../../apps/blackwatersound/docker/postgres/init.sql",
);

const BLACKWATER_SCHEMA_FILES = [
    "client/clientSchema.yml",
    "coach/coachSchema.yml",
    "product/productSchema.yml",
    "waitlist/waitlistSchema.yml",
    "course/courseSchema.yml",
    "order/orderSchema.yml",
    "session/sessionSchema.yml",
    "lesson/lessonSchema.yml",
    "enrollment/enrollmentSchema.yml",
    "booking/bookingSchema.yml",
    "mix_review/mixReviewSchema.yml",
] as const;

function compileFile(file: string): string {
    const compiler = new CCompiler();
    return compiler.buildDdl(compiler.parse_config(path.join(schemas, file)));
}

function stripSqlComments(sql: string): string {
    return sql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim();
}

describe("Blackwater schema YAML DDL", () => {
    it("compiles the live products table with a first-class JSONB payload column", () => {
        const sql = compileFile("product/productSchema.yml");
        expect(sql).toMatch(/^CREATE TABLE IF NOT EXISTS products \(/);
        expect(sql).toContain("id TEXT PRIMARY KEY");
        expect(sql).toContain("payload JSONB NOT NULL");
        expect(sql).toContain("tags JSON");
        expect(sql).toContain("created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
        expect(sql).toContain("updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
        expect(sql).not.toMatch(/;--;|\/\*/);
    });

    it("compiles waitlist with source_app / interest and waitlist_email_idx", () => {
        const sql = compileFile("waitlist/waitlistSchema.yml");
        expect(sql).toContain("CREATE TABLE IF NOT EXISTS waitlist");
        expect(sql).toContain("source_app TEXT CHECK (source_app IN");
        expect(sql).toContain("'www'");
        expect(sql).toContain("interest TEXT");
        expect(sql).toContain("email TEXT NOT NULL UNIQUE");
        expect(sql).toContain(
            "CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);",
        );
    });

    it("compiles every Blackwater *Schema.yml file", () => {
        const compiler = new CCompiler();
        const tables: string[] = [];

        for (const file of BLACKWATER_SCHEMA_FILES) {
            const parsed = compiler.parse_config(path.join(schemas, file));
            const sql = compiler.buildDdl(parsed);
            expect(sql, file).toMatch(/^CREATE TABLE IF NOT EXISTS /);
            expect(sql, file).not.toMatch(/; DROP |--;|\/\*/);
            tables.push(file);
        }

        expect(tables).toHaveLength(BLACKWATER_SCHEMA_FILES.length);
    });

    it("orders foreign keys so referenced tables are created first", () => {
        const compiler = new CCompiler();
        const docs = BLACKWATER_SCHEMA_FILES.map((file) =>
            compiler.parse_config(path.join(schemas, file)),
        );
        const sql = compileSchemas(docs, "postgres");

        expect(sql.indexOf("CREATE TABLE IF NOT EXISTS clients")).toBeGreaterThanOrEqual(0);
        expect(sql.indexOf("CREATE TABLE IF NOT EXISTS clients")).toBeLessThan(
            sql.indexOf("CREATE TABLE IF NOT EXISTS bookings"),
        );
        expect(sql.indexOf("CREATE TABLE IF NOT EXISTS coaches")).toBeLessThan(
            sql.indexOf("CREATE TABLE IF NOT EXISTS courses"),
        );
        expect(sql.indexOf("CREATE TABLE IF NOT EXISTS courses")).toBeLessThan(
            sql.indexOf("CREATE TABLE IF NOT EXISTS lessons"),
        );
        expect(sql.indexOf("CREATE TABLE IF NOT EXISTS products")).toBeLessThan(
            sql.indexOf("CREATE TABLE IF NOT EXISTS order_items"),
        );
        expect(sql.indexOf("CREATE TABLE IF NOT EXISTS sessions")).toBeLessThan(
            sql.indexOf("CREATE TABLE IF NOT EXISTS mix_reviews"),
        );
        expect(sql).toContain("payload JSONB NOT NULL");
        expect(sql).toContain("source_app TEXT CHECK (source_app IN");
    });

    it("keeps docker init.sql in lockstep with compiled live-bootstrap schemas", () => {
        const compiler = new CCompiler();
        const live = compileSchemas(
            [
                compiler.parse_config(path.join(schemas, "product/productSchema.yml")),
                compiler.parse_config(path.join(schemas, "waitlist/waitlistSchema.yml")),
            ],
            "postgres",
        );
        const initSql = stripSqlComments(fs.readFileSync(initSqlPath, "utf8"));
        expect(initSql).toBe(live);
        expect(initSql).toContain("payload JSONB NOT NULL");
    });

    it("does not treat schema YAML as raw SQL scripts", () => {
        expect(() =>
            compileSchema({
                Product: {
                    table: "products",
                    fields: { id: "string PRIMARY KEY; DROP TABLE products" },
                },
            }),
        ).toThrowError(SchemaCompileError);
    });
});
