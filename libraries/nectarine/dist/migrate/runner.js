"use strict";
/**
 * Apply schema bootstrap + versioned migrations through an adapter `query()`.
 *
 * Order (greenfield and existing volumes):
 * 1. Ledger table (`nectarine_schema_migrations`)
 * 2. `CREATE TABLE IF NOT EXISTS` from current `*Schema.yml`
 * 3. Pending versioned migrations (rename / drop / type change) with skip-if-already-there
 * 4. Additive `ADD COLUMN IF NOT EXISTS` (Postgres) for genuinely new columns
 * 5. `CREATE INDEX` from current schema (after rename, so existing volumes do
 *    not index a column that still has the old name)
 *
 * Each pending migration’s ops + ledger insert run in one transaction
 * (Postgres `BEGIN`/`COMMIT` on a pinned connection via `withTransaction`).
 * MySQL DDL implicit-commits, so a later op cannot undo an earlier ALTER.
 *
 * Not Flyway: no down migrations, no raw SQL scripts, no silent schema-diff.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationCompileError = exports.MigrationRunError = void 0;
exports.applyMigrations = applyMigrations;
const ddl_js_1 = require("../compiler/ddl.js");
const migration_js_1 = require("../compiler/migration.js");
Object.defineProperty(exports, "MigrationCompileError", { enumerable: true, get: function () { return migration_js_1.MigrationCompileError; } });
const errors_js_1 = require("../compiler/errors.js");
const ledger_js_1 = require("./ledger.js");
class MigrationRunError extends Error {
    constructor(message) {
        super(message);
        this.name = "MigrationRunError";
    }
}
exports.MigrationRunError = MigrationRunError;
function resultRows(result) {
    if (!(0, errors_js_1.isRecord)(result) || !("rows" in result)) {
        return [];
    }
    const rows = result.rows;
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.filter(errors_js_1.isRecord);
}
function rowField(row, name) {
    if (row[name] !== undefined) {
        return row[name];
    }
    const match = Object.keys(row).find((key) => key.toLowerCase() === name.toLowerCase());
    return match === undefined ? undefined : row[match];
}
async function columnExists(execute, tableSchema, table, column) {
    const result = await execute.query(ledger_js_1.columnExistsSql, [tableSchema, table, column]);
    return resultRows(result).length > 0;
}
function isProtected(protectedColumns, table, column) {
    return protectedColumns.some((entry) => entry.table === table && entry.column === column);
}
function protectedTarget(op) {
    switch (op.kind) {
        case "renameColumn":
            return { table: op.table, column: op.from };
        case "dropColumn":
            return { table: op.table, column: op.column };
        case "changeType":
            return { table: op.table, column: op.column };
    }
}
function txBegin(vendor) {
    return vendor === "mysql" ? "START TRANSACTION" : "BEGIN";
}
/**
 * Wrap one migration’s ops + ledger insert.
 *
 * Postgres: real transactional DDL when `execute.withTransaction` pins a client.
 * MySQL: `START TRANSACTION` is still issued, but DDL implicit-commits, so a
 * failed later op cannot roll back an earlier ALTER.
 */
async function runInTransaction(execute, vendor, work) {
    const run = async (query) => {
        await query(txBegin(vendor));
        try {
            const result = await work(query);
            await query("COMMIT");
            return result;
        }
        catch (error) {
            await query("ROLLBACK").catch(() => undefined);
            throw error;
        }
    };
    if (execute.withTransaction) {
        return execute.withTransaction(run);
    }
    return run((sql, params) => execute.query(sql, params));
}
async function applyOperation(query, tableSchema, op, version) {
    const execute = { query };
    switch (op.kind) {
        case "renameColumn": {
            const fromExists = await columnExists(execute, tableSchema, op.table, op.from);
            const toExists = await columnExists(execute, tableSchema, op.table, op.to);
            if (fromExists && !toExists) {
                await query(op.sql);
                return "ran";
            }
            if (!fromExists && toExists) {
                return "skipped";
            }
            if (fromExists && toExists) {
                throw new MigrationRunError(`Migration ${version}: cannot rename ${op.table}.${op.from} to ${op.to}; both columns exist`);
            }
            throw new MigrationRunError(`Migration ${version}: cannot rename ${op.table}.${op.from} to ${op.to}; neither column exists`);
        }
        case "dropColumn": {
            const exists = await columnExists(execute, tableSchema, op.table, op.column);
            if (!exists) {
                return "skipped";
            }
            await query(op.sql);
            return "ran";
        }
        case "changeType": {
            const exists = await columnExists(execute, tableSchema, op.table, op.column);
            if (!exists) {
                throw new MigrationRunError(`Migration ${version}: cannot change type of ${op.table}.${op.column}; column does not exist`);
            }
            await query(op.sql);
            return "ran";
        }
    }
}
function assertUnprotected(migration, protectedColumns) {
    for (const op of migration.operations) {
        const target = protectedTarget(op);
        if (isProtected(protectedColumns, target.table, target.column)) {
            throw new MigrationRunError(`Migration ${migration.version}: ${op.kind} on ${target.table}.${target.column} is protected`);
        }
        if (op.kind === "renameColumn" && isProtected(protectedColumns, op.table, op.to)) {
            throw new MigrationRunError(`Migration ${migration.version}: rename onto protected ${op.table}.${op.to} is not allowed`);
        }
    }
}
/**
 * Apply pending compiled migrations, then record versions in the ledger.
 */
async function applyMigrations(options) {
    const execute = options.execute;
    if (!execute || typeof execute.query !== "function") {
        throw new MigrationRunError("applyMigrations requires execute.query");
    }
    const vendor = options.vendor ?? "postgres";
    const tableSchema = options.tableSchema ?? "public";
    const protectedColumns = options.protectedColumns ?? [];
    const schemas = options.schemas ?? [];
    const compiled = (0, migration_js_1.compileMigrations)(options.migrations ?? [], vendor);
    await execute.query((0, ledger_js_1.ledgerCreateTableSql)(vendor));
    const plan = schemas.length > 0 ? (0, ddl_js_1.compileSchemasPlan)(schemas, vendor) : [];
    for (const sql of (0, ddl_js_1.schemaPlanStatements)(plan, "create")) {
        await execute.query(sql);
    }
    const listed = resultRows(await execute.query(ledger_js_1.ledgerListSql));
    const appliedByVersion = new Map();
    for (const row of listed) {
        const version = rowField(row, "version");
        const checksum = rowField(row, "checksum");
        if (typeof version !== "string" || typeof checksum !== "string") {
            throw new MigrationRunError("nectarine_schema_migrations rows must include version and checksum");
        }
        appliedByVersion.set(version, checksum);
    }
    const applied = [];
    const skipped = [];
    for (const migration of compiled) {
        const recorded = appliedByVersion.get(migration.version);
        if (recorded !== undefined) {
            if (recorded !== migration.checksum) {
                throw new MigrationRunError(`Migration ${migration.version} checksum mismatch; refuse to re-run an edited applied migration`);
            }
            skipped.push(migration.version);
            continue;
        }
        assertUnprotected(migration, protectedColumns);
        await runInTransaction(execute, vendor, async (query) => {
            for (const op of migration.operations) {
                await applyOperation(query, tableSchema, op, migration.version);
            }
            await query(ledger_js_1.ledgerInsertSql, [migration.version, migration.checksum]);
        });
        applied.push(migration.version);
    }
    if (vendor === "postgres") {
        for (const sql of (0, ddl_js_1.schemaPlanStatements)(plan, "additive")) {
            await execute.query(sql);
        }
    }
    for (const sql of (0, ddl_js_1.schemaPlanStatements)(plan, "indexes")) {
        await execute.query(sql);
    }
    return { applied, skipped };
}
//# sourceMappingURL=runner.js.map