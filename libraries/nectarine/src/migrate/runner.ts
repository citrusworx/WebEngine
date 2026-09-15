/**
 * Apply schema bootstrap + versioned migrations through an adapter `query()`.
 *
 * Order (greenfield and existing volumes):
 * 1. Ledger table (`nectarine_schema_migrations`)
 * 2. `CREATE TABLE IF NOT EXISTS` / indexes from current `*Schema.yml`
 * 3. Pending versioned migrations (rename / drop / type change) with skip-if-already-there
 * 4. Additive `ADD COLUMN IF NOT EXISTS` (Postgres) for genuinely new columns
 *
 * Additive ALTER runs *after* renames so a schema that already uses the new
 * column name does not ADD the new name beside the old one.
 *
 * Not Flyway: no down migrations, no raw SQL scripts, no silent schema-diff.
 */

import {
    compileSchemasPlan,
    schemaPlanStatements,
    type DdlVendor,
} from "../compiler/ddl.js";
import {
    compileMigrations,
    MigrationCompileError,
    type CompiledMigration,
    type CompiledMigrationOp,
} from "../compiler/migration.js";
import { isRecord } from "../compiler/errors.js";
import {
    columnExistsSql,
    ledgerCreateTableSql,
    ledgerInsertSql,
    ledgerListSql,
} from "./ledger.js";

export class MigrationRunError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MigrationRunError";
    }
}

export type MigrationExecutor = {
    query: (sql: string, params?: readonly unknown[]) => Promise<unknown>;
};

export type ProtectedColumn = {
    table: string;
    column: string;
};

export type ApplyMigrationsOptions = {
    execute: MigrationExecutor;
    vendor?: DdlVendor | string;
    /** Current `*Schema.yml` documents (parsed objects or paths). */
    schemas?: unknown[];
    /** Versioned migration documents (parsed objects, paths, or directory-loaded). */
    migrations?: unknown[];
    /**
     * Catalog / schema used for information_schema lookups.
     * Postgres default `public`. MySQL callers should pass the database name.
     */
    tableSchema?: string;
    /** Columns the runner will refuse to rename, drop, or retype. */
    protectedColumns?: readonly ProtectedColumn[];
};

export type MigrationRunResult = {
    applied: string[];
    skipped: string[];
};

function resultRows(result: unknown): Record<string, unknown>[] {
    if (!isRecord(result) || !("rows" in result)) {
        return [];
    }
    const rows = result.rows;
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.filter(isRecord);
}

function rowField(row: Record<string, unknown>, name: string): unknown {
    if (row[name] !== undefined) {
        return row[name];
    }
    const match = Object.keys(row).find((key) => key.toLowerCase() === name.toLowerCase());
    return match === undefined ? undefined : row[match];
}

async function columnExists(
    execute: MigrationExecutor,
    tableSchema: string,
    table: string,
    column: string,
): Promise<boolean> {
    const result = await execute.query(columnExistsSql, [tableSchema, table, column]);
    return resultRows(result).length > 0;
}

function isProtected(
    protectedColumns: readonly ProtectedColumn[],
    table: string,
    column: string,
): boolean {
    return protectedColumns.some((entry) => entry.table === table && entry.column === column);
}

function protectedTarget(op: CompiledMigrationOp): { table: string; column: string } {
    switch (op.kind) {
        case "renameColumn":
            return { table: op.table, column: op.from };
        case "dropColumn":
            return { table: op.table, column: op.column };
        case "changeType":
            return { table: op.table, column: op.column };
    }
}

async function applyOperation(
    execute: MigrationExecutor,
    tableSchema: string,
    op: CompiledMigrationOp,
    version: string,
): Promise<"ran" | "skipped"> {
    switch (op.kind) {
        case "renameColumn": {
            const fromExists = await columnExists(execute, tableSchema, op.table, op.from);
            const toExists = await columnExists(execute, tableSchema, op.table, op.to);
            if (fromExists && !toExists) {
                await execute.query(op.sql);
                return "ran";
            }
            if (!fromExists && toExists) {
                return "skipped";
            }
            if (fromExists && toExists) {
                throw new MigrationRunError(
                    `Migration ${version}: cannot rename ${op.table}.${op.from} to ${op.to}; both columns exist`,
                );
            }
            throw new MigrationRunError(
                `Migration ${version}: cannot rename ${op.table}.${op.from} to ${op.to}; neither column exists`,
            );
        }
        case "dropColumn": {
            const exists = await columnExists(execute, tableSchema, op.table, op.column);
            if (!exists) {
                return "skipped";
            }
            await execute.query(op.sql);
            return "ran";
        }
        case "changeType": {
            const exists = await columnExists(execute, tableSchema, op.table, op.column);
            if (!exists) {
                throw new MigrationRunError(
                    `Migration ${version}: cannot change type of ${op.table}.${op.column}; column does not exist`,
                );
            }
            await execute.query(op.sql);
            return "ran";
        }
    }
}

/**
 * Apply pending compiled migrations, then record versions in the ledger.
 */
export async function applyMigrations(options: ApplyMigrationsOptions): Promise<MigrationRunResult> {
    const execute = options.execute;
    if (!execute || typeof execute.query !== "function") {
        throw new MigrationRunError("applyMigrations requires execute.query");
    }

    const vendor = options.vendor ?? "postgres";
    const tableSchema = options.tableSchema ?? "public";
    const protectedColumns = options.protectedColumns ?? [];
    const schemas = options.schemas ?? [];
    const compiled = compileMigrations(options.migrations ?? [], vendor);

    await execute.query(ledgerCreateTableSql(vendor));

    if (schemas.length > 0) {
        const plan = compileSchemasPlan(schemas, vendor);
        for (const sql of schemaPlanStatements(plan, "create")) {
            await execute.query(sql);
        }
        for (const sql of schemaPlanStatements(plan, "indexes")) {
            await execute.query(sql);
        }
    }

    const listed = resultRows(await execute.query(ledgerListSql));
    const appliedByVersion = new Map<string, string>();
    for (const row of listed) {
        const version = rowField(row, "version");
        const checksum = rowField(row, "checksum");
        if (typeof version !== "string" || typeof checksum !== "string") {
            throw new MigrationRunError("nectarine_schema_migrations rows must include version and checksum");
        }
        appliedByVersion.set(version, checksum);
    }

    const applied: string[] = [];
    const skipped: string[] = [];

    for (const migration of compiled) {
        const recorded = appliedByVersion.get(migration.version);
        if (recorded !== undefined) {
            if (recorded !== migration.checksum) {
                throw new MigrationRunError(
                    `Migration ${migration.version} checksum mismatch; refuse to re-run an edited applied migration`,
                );
            }
            skipped.push(migration.version);
            continue;
        }

        for (const op of migration.operations) {
            const target = protectedTarget(op);
            if (isProtected(protectedColumns, target.table, target.column)) {
                throw new MigrationRunError(
                    `Migration ${migration.version}: ${op.kind} on ${target.table}.${target.column} is protected`,
                );
            }
            if (op.kind === "renameColumn" && isProtected(protectedColumns, op.table, op.to)) {
                throw new MigrationRunError(
                    `Migration ${migration.version}: rename onto protected ${op.table}.${op.to} is not allowed`,
                );
            }
            await applyOperation(execute, tableSchema, op, migration.version);
        }

        await execute.query(ledgerInsertSql, [migration.version, migration.checksum]);
        applied.push(migration.version);
    }

    if (schemas.length > 0 && vendor === "postgres") {
        const plan = compileSchemasPlan(schemas, vendor);
        for (const sql of schemaPlanStatements(plan, "additive")) {
            await execute.query(sql);
        }
    }

    return { applied, skipped };
}

export { MigrationCompileError };
export type { CompiledMigration, CompiledMigrationOp };
