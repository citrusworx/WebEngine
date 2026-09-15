import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const blackwaterDb = path.resolve(
    import.meta.dirname,
    "../../../../apps/blackwatersound/back/src/db",
);
const blackwaterStore = path.resolve(
    import.meta.dirname,
    "../../../../apps/blackwatersound/back/src/store",
);

const SQL_LITERAL =
    /(['"`])(?:(?!\1)[\s\S])*?\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b(?:(?!\1)[\s\S])*?\1/;

function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function listTsFiles(dir: string): string[] {
    return fs
        .readdirSync(dir)
        .filter((name) => name.endsWith(".ts"))
        .map((name) => path.join(dir, name));
}

describe("Blackwater data access has no hard-coded SQL", () => {
    it("db and store modules contain no DML or DDL string literals", () => {
        const files = [...listTsFiles(blackwaterDb), ...listTsFiles(blackwaterStore)];
        expect(files.length).toBeGreaterThan(2);
        expect(files.some((file) => file.endsWith("named-ddl.ts"))).toBe(true);
        expect(files.some((file) => file.endsWith("phase3-ddl.ts"))).toBe(false);

        const namedDdlSrc = fs.readFileSync(path.join(blackwaterDb, "named-ddl.ts"), "utf8");
        expect(namedDdlSrc).toContain("applyMigrations");
        expect(namedDdlSrc).toContain("loadMigrationDocuments");
        expect(namedDdlSrc).toContain('table: "products"');
        expect(namedDdlSrc).toContain('column: "payload"');

        const postgresSrc = fs.readFileSync(path.join(blackwaterDb, "postgres.ts"), "utf8");
        expect(postgresSrc).toContain("applyNamedMigrations");
        expect(postgresSrc).not.toContain("runNamedDdl");

        for (const file of files) {
            const src = stripComments(fs.readFileSync(file, "utf8"));
            const relative = path.relative(blackwaterDb, file);
            expect(src, relative).not.toMatch(SQL_LITERAL);
            expect(src, relative).not.toMatch(/\bCREATE TABLE\b/);
        }
    });
});
