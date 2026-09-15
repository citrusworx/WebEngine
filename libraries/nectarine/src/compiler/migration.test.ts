import path from "node:path";
import { describe, expect, it } from "vitest";
import { CCompiler } from "./compiler.js";
import {
    compileMigration,
    compileMigrations,
    MigrationCompileError,
} from "./migration.js";

const fixtures = path.resolve(import.meta.dirname, "__fixtures__/migrations");

describe("migration YAML compiler", () => {
    it("compiles renameColumn for Postgres and quotes mixed-case names", () => {
        const compiled = compileMigration({
            version: "001_rename_nickname",
            operations: [
                {
                    renameColumn: {
                        table: "users",
                        from: "nickname",
                        to: "handle",
                    },
                },
                {
                    renameColumn: {
                        table: "products",
                        from: "originalPrice",
                        to: "listPrice",
                    },
                },
            ],
        });

        expect(compiled.version).toBe("001_rename_nickname");
        expect(compiled.destructive).toBe(false);
        expect(compiled.operations[0]?.sql).toBe(
            "ALTER TABLE users RENAME COLUMN nickname TO handle;",
        );
        expect(compiled.operations[1]?.sql).toBe(
            'ALTER TABLE products RENAME COLUMN "originalPrice" TO "listPrice";',
        );
        expect(compiled.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it("compiles dropColumn and changeType with destructive gates", () => {
        const compiled = compileMigration({
            version: "002_tags_jsonb",
            destructive: true,
            operations: [
                {
                    dropColumn: {
                        table: "users",
                        column: "legacy_flag",
                        confirm: "dropColumn",
                    },
                },
                {
                    changeType: {
                        table: "products",
                        column: "tags",
                        type: "jsonb",
                        confirm: "changeType",
                    },
                },
            ],
        });

        expect(compiled.operations[0]?.sql).toBe("ALTER TABLE users DROP COLUMN legacy_flag;");
        expect(compiled.operations[1]?.sql).toBe(
            "ALTER TABLE products ALTER COLUMN tags TYPE JSONB USING tags::JSONB;",
        );
    });

    it("emits MySQL RENAME / DROP / MODIFY without breaking shared APIs", () => {
        const compiled = compileMigration(
            {
                version: "003_mysql_ops",
                destructive: true,
                operations: [
                    { renameColumn: { table: "users", from: "nickname", to: "handle" } },
                    {
                        dropColumn: {
                            table: "users",
                            column: "legacy_flag",
                            confirm: "dropColumn",
                        },
                    },
                    {
                        changeType: {
                            table: "products",
                            column: "tags",
                            type: "jsonb",
                            confirm: "changeType",
                        },
                    },
                ],
            },
            "mysql",
        );

        expect(compiled.operations[0]?.sql).toBe(
            "ALTER TABLE users RENAME COLUMN nickname TO handle;",
        );
        expect(compiled.operations[1]?.sql).toBe("ALTER TABLE users DROP COLUMN legacy_flag;");
        expect(compiled.operations[2]?.sql).toBe(
            "ALTER TABLE products MODIFY COLUMN tags JSON;",
        );
    });

    it("loads fixture YAML from disk and sorts compiled versions", () => {
        const compiled = compileMigrations([
            path.join(fixtures, "002_drop_legacy_flag.yml"),
            path.join(fixtures, "001_rename_nickname.yml"),
        ]);
        expect(compiled.map((entry) => entry.version)).toEqual([
            "001_rename_nickname",
            "002_drop_legacy_flag",
        ]);
        expect(compiled[0]?.operations[0]?.kind).toBe("renameColumn");
        expect(compiled[1]?.operations[0]?.kind).toBe("dropColumn");
    });

    it("exposes CCompiler.buildMigration", () => {
        const compiler = new CCompiler();
        const doc = compiler.parse_config(path.join(fixtures, "001_rename_nickname.yml"));
        expect(compiler.buildMigration(doc).operations[0]?.sql).toBe(
            compileMigration(doc).operations[0]?.sql,
        );
    });

    it("refuses unconfirmed destructive ops, raw sql, and bad versions", () => {
        expect(() =>
            compileMigration({
                version: "001_drop",
                operations: [{ dropColumn: { table: "users", column: "x" } }],
            }),
        ).toThrowError(/confirm: dropColumn/);

        expect(() =>
            compileMigration({
                version: "001_drop",
                destructive: true,
                operations: [
                    { dropColumn: { table: "users", column: "x", confirm: "dropColumn" } },
                ],
            }),
        ).not.toThrow();

        expect(() =>
            compileMigration({
                version: "001_drop",
                operations: [
                    { dropColumn: { table: "users", column: "x", confirm: "dropColumn" } },
                ],
            }),
        ).toThrowError(/destructive: true/);

        expect(() =>
            compileMigration({
                version: "001_sql",
                operations: [{ sql: "DROP TABLE users" }],
            }),
        ).toThrowError(MigrationCompileError);

        expect(() =>
            compileMigration({
                version: "1_too_short",
                operations: [{ renameColumn: { table: "users", from: "a", to: "b" } }],
            }),
        ).toThrowError(/zero-padded prefix/);

        expect(() =>
            compileMigrations([
                {
                    version: "001_dup",
                    operations: [{ renameColumn: { table: "users", from: "a", to: "b" } }],
                },
                {
                    version: "001_dup",
                    operations: [{ renameColumn: { table: "users", from: "c", to: "d" } }],
                },
            ]),
        ).toThrowError(/Duplicate migration version/);

        expect(() =>
            compileMigration(
                {
                    version: "001_mongo",
                    operations: [{ renameColumn: { table: "users", from: "a", to: "b" } }],
                },
                "mongodb",
            ),
        ).toThrowError(/MongoDB is not SQL/);
    });
});
