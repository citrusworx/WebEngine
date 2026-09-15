import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileMigration } from "../compiler/migration.js";
import { LEDGER_TABLE } from "./ledger.js";
import { loadMigrationDocuments } from "./load.js";
import { applyMigrations, MigrationRunError } from "./runner.js";

const fixtureDir = path.resolve(
    import.meta.dirname,
    "../compiler/__fixtures__/migrations",
);

const usersSchema = {
    User: {
        table: "users",
        fields: {
            id: "string PRIMARY KEY",
            handle: "string",
            email: "string",
        },
    },
};

const productsSchema = {
    Product: {
        table: "products",
        fields: {
            id: "string PRIMARY KEY",
            payload: "jsonb NOT NULL",
            tags: "jsonb",
        },
    },
};

type LedgerRow = { version: string; checksum: string };

function createFakeExecutor(opts?: {
    columns?: Record<string, string[]>;
    ledger?: LedgerRow[];
}) {
    const columns = new Map<string, Set<string>>(
        Object.entries(opts?.columns ?? {}).map(([table, cols]) => [table, new Set(cols)]),
    );
    const ledger: LedgerRow[] = [...(opts?.ledger ?? [])];
    const executed: { sql: string; params: readonly unknown[] }[] = [];

    return {
        columns,
        ledger,
        executed,
        sqls() {
            return executed.map((entry) => entry.sql);
        },
        query: async (sql: string, params: readonly unknown[] = []) => {
            executed.push({ sql, params });
            const trimmed = sql.trim();

            if (trimmed.includes("information_schema.columns")) {
                const table = String(params[1]);
                const column = String(params[2]);
                const has = columns.get(table)?.has(column) === true;
                return { rows: has ? [{ column_name: column }] : [] };
            }

            if (trimmed.startsWith("SELECT") && trimmed.includes(LEDGER_TABLE)) {
                return { rows: ledger.map((row) => ({ ...row })) };
            }

            if (trimmed.startsWith("INSERT") && trimmed.includes(LEDGER_TABLE)) {
                ledger.push({ version: String(params[0]), checksum: String(params[1]) });
                return { rows: [] };
            }

            return { rows: [] };
        },
    };
}

describe("applyMigrations runner", () => {
    it("creates tables additively, applies rename + drop, and records a ledger", async () => {
        const exec = createFakeExecutor({
            columns: {
                users: ["id", "nickname", "legacy_flag", "email"],
                products: ["id", "payload", "tags"],
            },
        });

        const result = await applyMigrations({
            execute: exec,
            schemas: [usersSchema, productsSchema],
            migrations: loadMigrationDocuments(fixtureDir),
            protectedColumns: [{ table: "products", column: "payload" }],
        });

        expect(result.applied).toEqual(["001_rename_nickname", "002_drop_legacy_flag"]);
        expect(result.skipped).toEqual([]);
        expect(exec.sqls().some((sql) => sql.startsWith("CREATE TABLE IF NOT EXISTS nectarine_schema_migrations"))).toBe(
            true,
        );
        expect(exec.sqls()).toContain("CREATE TABLE IF NOT EXISTS users (\n  id TEXT PRIMARY KEY,\n  handle TEXT,\n  email TEXT\n);");
        expect(exec.sqls()).toContain("CREATE TABLE IF NOT EXISTS products (\n  id TEXT PRIMARY KEY,\n  payload JSONB NOT NULL,\n  tags JSONB\n);");
        expect(exec.sqls()).toContain("ALTER TABLE users RENAME COLUMN nickname TO handle;");
        expect(exec.sqls()).toContain("ALTER TABLE users DROP COLUMN legacy_flag;");
        expect(exec.sqls().some((sql) => sql.includes("ADD COLUMN IF NOT EXISTS"))).toBe(true);
        expect(exec.ledger.map((row) => row.version)).toEqual([
            "001_rename_nickname",
            "002_drop_legacy_flag",
        ]);

        const createProducts = exec.sqls().find((sql) => sql.includes("CREATE TABLE IF NOT EXISTS products"));
        expect(createProducts).toContain("payload JSONB NOT NULL");
        expect(exec.sqls().some((sql) => /DROP COLUMN payload/i.test(sql))).toBe(false);
    });

    it("skips rename when the destination already exists (greenfield current schema)", async () => {
        const exec = createFakeExecutor({
            columns: { users: ["id", "handle", "email"] },
        });

        const result = await applyMigrations({
            execute: exec,
            schemas: [usersSchema],
            migrations: [path.join(fixtureDir, "001_rename_nickname.yml")],
        });

        expect(result.applied).toEqual(["001_rename_nickname"]);
        expect(exec.sqls().some((sql) => sql.includes("RENAME COLUMN"))).toBe(false);
    });

    it("skips drop when the column is already gone", async () => {
        const exec = createFakeExecutor({
            columns: { users: ["id", "handle", "email"] },
        });

        const result = await applyMigrations({
            execute: exec,
            schemas: [usersSchema],
            migrations: [path.join(fixtureDir, "002_drop_legacy_flag.yml")],
        });

        expect(result.applied).toEqual(["002_drop_legacy_flag"]);
        expect(exec.sqls().some((sql) => sql.includes("DROP COLUMN"))).toBe(false);
    });

    it("does not re-apply recorded versions and detects checksum drift", async () => {
        const first = compileMigration(path.join(fixtureDir, "001_rename_nickname.yml"));
        const exec = createFakeExecutor({
            columns: { users: ["id", "handle"] },
            ledger: [{ version: first.version, checksum: first.checksum }],
        });

        const result = await applyMigrations({
            execute: exec,
            schemas: [usersSchema],
            migrations: [path.join(fixtureDir, "001_rename_nickname.yml")],
        });
        expect(result.skipped).toEqual(["001_rename_nickname"]);
        expect(result.applied).toEqual([]);

        const drifted = createFakeExecutor({
            columns: { users: ["id", "handle"] },
            ledger: [{ version: first.version, checksum: "0".repeat(64) }],
        });
        await expect(
            applyMigrations({
                execute: drifted,
                migrations: [path.join(fixtureDir, "001_rename_nickname.yml")],
            }),
        ).rejects.toThrowError(/checksum mismatch/);
    });

    it("refuses protected JSONB payload mutations", async () => {
        const exec = createFakeExecutor({
            columns: { products: ["id", "payload"] },
        });

        await expect(
            applyMigrations({
                execute: exec,
                schemas: [productsSchema],
                protectedColumns: [{ table: "products", column: "payload" }],
                migrations: [
                    {
                        version: "001_drop_payload",
                        destructive: true,
                        operations: [
                            {
                                dropColumn: {
                                    table: "products",
                                    column: "payload",
                                    confirm: "dropColumn",
                                },
                            },
                        ],
                    },
                ],
            }),
        ).rejects.toThrow(MigrationRunError);
    });

    it("applies changeType through the executor", async () => {
        const exec = createFakeExecutor({
            columns: { products: ["id", "payload", "tags"] },
        });

        const result = await applyMigrations({
            execute: exec,
            schemas: [productsSchema],
            protectedColumns: [{ table: "products", column: "payload" }],
            migrations: [
                {
                    version: "004_tags_jsonb",
                    destructive: true,
                    operations: [
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
            ],
        });

        expect(result.applied).toEqual(["004_tags_jsonb"]);
        expect(exec.sqls()).toContain(
            "ALTER TABLE products ALTER COLUMN tags TYPE JSONB USING tags::JSONB;",
        );
    });

    it("loadMigrationDocuments returns [] for a missing directory and reads YAML files", () => {
        expect(loadMigrationDocuments(path.join(os.tmpdir(), "nectarine-no-such-migrations"))).toEqual(
            [],
        );
        const docs = loadMigrationDocuments(fixtureDir);
        expect(docs).toHaveLength(2);
        expect(docs[0]).toMatchObject({ version: "001_rename_nickname" });
    });

    it("runs additive CREATE TABLE with no versioned files", async () => {
        const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "nectarine-empty-mig-"));
        const exec = createFakeExecutor();
        const result = await applyMigrations({
            execute: exec,
            schemas: [usersSchema],
            migrations: loadMigrationDocuments(emptyDir),
        });
        expect(result.applied).toEqual([]);
        expect(exec.sqls().some((sql) => sql.startsWith("CREATE TABLE IF NOT EXISTS users"))).toBe(
            true,
        );
        fs.rmSync(emptyDir, { recursive: true, force: true });
    });
});
