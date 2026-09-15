/**
 * Versioned migration YAML → DDL compiler.
 *
 * Schema YAML remains the current CREATE TABLE shape. Evolution that additive
 * bootstrap cannot do (RENAME COLUMN, DROP COLUMN, type change) is an explicit
 * list of phonics tokens — not raw SQL in app code, and not a silent schema-diff
 * (diffing live tables against YAML would DROP columns without a gate).
 *
 * Destructive ops (drop / type change) require both `destructive: true` on the
 * document and a matching `confirm:` token on the operation.
 */

import { createHash } from "node:crypto";
import { parser } from "../util/util.js";
import { compileSqlType, type DdlVendor, DDL_VENDORS } from "./ddl.js";
import { isRecord, QueryCompileError } from "./errors.js";
import { isSqlIdentifier, quoteIdent } from "./identifiers.js";

export class MigrationCompileError extends QueryCompileError {
    constructor(message: string) {
        super(message);
        this.name = "MigrationCompileError";
    }
}

/** Zero-padded numeric prefix so lexicographic order matches apply order. */
export const MIGRATION_VERSION = /^[0-9]{3}[A-Za-z0-9_-]*$/;

const OP_KEYS = ["renameColumn", "dropColumn", "changeType"] as const;
type OpKey = (typeof OP_KEYS)[number];

export type CompiledRenameColumn = {
    kind: "renameColumn";
    table: string;
    from: string;
    to: string;
    sql: string;
};

export type CompiledDropColumn = {
    kind: "dropColumn";
    table: string;
    column: string;
    sql: string;
};

export type CompiledChangeType = {
    kind: "changeType";
    table: string;
    column: string;
    type: string;
    sqlType: string;
    sql: string;
};

export type CompiledMigrationOp = CompiledRenameColumn | CompiledDropColumn | CompiledChangeType;

export type CompiledMigration = {
    version: string;
    description?: string;
    destructive: boolean;
    checksum: string;
    operations: CompiledMigrationOp[];
};

function resolveVendor(vendor: string): DdlVendor {
    if (vendor === "mongodb") {
        throw new MigrationCompileError(
            "Migration DDL compilation supports postgres and mysql; MongoDB is not SQL ALTER TABLE",
        );
    }
    if (!(DDL_VENDORS as readonly string[]).includes(vendor)) {
        throw new MigrationCompileError(`Unknown DDL vendor: ${vendor}`);
    }
    return vendor as DdlVendor;
}

function loadMigrationDoc(input: unknown): Record<string, unknown> {
    if (typeof input === "string") {
        const parsed = parser.yaml(input);
        if (!isRecord(parsed)) {
            throw new MigrationCompileError("Migration YAML must parse to an object");
        }
        return parsed;
    }
    if (!isRecord(input)) {
        throw new MigrationCompileError("Migration must be an object");
    }
    return input;
}

function assertIdentifier(name: string, label: string): void {
    if (!isSqlIdentifier(name)) {
        throw new MigrationCompileError(`Invalid ${label}: ${name}`);
    }
}

function expectKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
    for (const key of Object.keys(record)) {
        if (key === "sql") {
            throw new MigrationCompileError(
                `${label} cannot include raw sql; use renameColumn / dropColumn / changeType tokens`,
            );
        }
        if (!allowed.includes(key)) {
            throw new MigrationCompileError(`Unknown ${label} key: ${key}`);
        }
    }
}

function requireString(record: Record<string, unknown>, key: string, label: string): string {
    const value = record[key];
    if (typeof value !== "string" || value.trim() === "") {
        throw new MigrationCompileError(`${label} requires ${key}`);
    }
    return value;
}

function q(name: string, vendor: DdlVendor): string {
    return quoteIdent(name, vendor);
}

function checksumOf(version: string, operations: CompiledMigrationOp[]): string {
    const canonical = {
        version,
        operations: operations.map((op) => {
            switch (op.kind) {
                case "renameColumn":
                    return { kind: op.kind, table: op.table, from: op.from, to: op.to };
                case "dropColumn":
                    return { kind: op.kind, table: op.table, column: op.column };
                case "changeType":
                    return { kind: op.kind, table: op.table, column: op.column, type: op.type };
            }
        }),
    };
    return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function opKeyOf(entry: Record<string, unknown>): OpKey {
    const keys = OP_KEYS.filter((key) => key in entry);
    if (keys.length !== 1) {
        throw new MigrationCompileError(
            "Each operation must be exactly one of renameColumn, dropColumn, changeType",
        );
    }
    const key = keys[0];
    if (key === undefined) {
        throw new MigrationCompileError("Each operation must be an object");
    }
    return key;
}

function requireConfirm(spec: Record<string, unknown>, expected: OpKey, version: string): void {
    const confirm = spec.confirm;
    if (confirm !== expected) {
        throw new MigrationCompileError(
            `Migration ${version}: ${expected} requires confirm: ${expected} (refusing silent data loss)`,
        );
    }
}

function compileRename(
    spec: unknown,
    vendor: DdlVendor,
    version: string,
): CompiledRenameColumn {
    if (!isRecord(spec)) {
        throw new MigrationCompileError(`Migration ${version}: renameColumn must be an object`);
    }
    expectKeys(spec, ["table", "from", "to"], "renameColumn");
    const table = requireString(spec, "table", "renameColumn");
    const from = requireString(spec, "from", "renameColumn");
    const to = requireString(spec, "to", "renameColumn");
    assertIdentifier(table, "table");
    assertIdentifier(from, "column");
    assertIdentifier(to, "column");
    if (from === to) {
        throw new MigrationCompileError(`Migration ${version}: renameColumn from and to must differ`);
    }
    return {
        kind: "renameColumn",
        table,
        from,
        to,
        sql: `ALTER TABLE ${q(table, vendor)} RENAME COLUMN ${q(from, vendor)} TO ${q(to, vendor)};`,
    };
}

function compileDrop(spec: unknown, vendor: DdlVendor, version: string): CompiledDropColumn {
    if (!isRecord(spec)) {
        throw new MigrationCompileError(`Migration ${version}: dropColumn must be an object`);
    }
    expectKeys(spec, ["table", "column", "confirm"], "dropColumn");
    requireConfirm(spec, "dropColumn", version);
    const table = requireString(spec, "table", "dropColumn");
    const column = requireString(spec, "column", "dropColumn");
    assertIdentifier(table, "table");
    assertIdentifier(column, "column");
    return {
        kind: "dropColumn",
        table,
        column,
        sql: `ALTER TABLE ${q(table, vendor)} DROP COLUMN ${q(column, vendor)};`,
    };
}

function compileChangeType(
    spec: unknown,
    vendor: DdlVendor,
    version: string,
): CompiledChangeType {
    if (!isRecord(spec)) {
        throw new MigrationCompileError(`Migration ${version}: changeType must be an object`);
    }
    expectKeys(spec, ["table", "column", "type", "confirm", "using"], "changeType");
    requireConfirm(spec, "changeType", version);
    const table = requireString(spec, "table", "changeType");
    const column = requireString(spec, "column", "changeType");
    const type = requireString(spec, "type", "changeType");
    assertIdentifier(table, "table");
    assertIdentifier(column, "column");

    if (spec.using !== undefined && spec.using !== "column" && spec.using !== true) {
        throw new MigrationCompileError(
            `Migration ${version}: changeType.using must be column (a typed cast of the same column, not raw SQL)`,
        );
    }

    const sqlType = compileSqlType(type, vendor);
    const col = q(column, vendor);
    const sql =
        vendor === "mysql"
            ? `ALTER TABLE ${q(table, vendor)} MODIFY COLUMN ${col} ${sqlType};`
            : `ALTER TABLE ${q(table, vendor)} ALTER COLUMN ${col} TYPE ${sqlType} USING ${col}::${sqlType};`;

    return {
        kind: "changeType",
        table,
        column,
        type,
        sqlType,
        sql,
    };
}

function compileOperation(
    entry: unknown,
    vendor: DdlVendor,
    version: string,
    index: number,
): CompiledMigrationOp {
    if (!isRecord(entry)) {
        throw new MigrationCompileError(`Migration ${version}: operation ${index} must be an object`);
    }
    if ("sql" in entry) {
        throw new MigrationCompileError(
            `Migration ${version}: raw sql operations are not allowed; use renameColumn / dropColumn / changeType`,
        );
    }
    const key = opKeyOf(entry);
    extraOpKeys(entry, key, version);
    switch (key) {
        case "renameColumn":
            return compileRename(entry.renameColumn, vendor, version);
        case "dropColumn":
            return compileDrop(entry.dropColumn, vendor, version);
        case "changeType":
            return compileChangeType(entry.changeType, vendor, version);
    }
}

function extraOpKeys(entry: Record<string, unknown>, key: OpKey, version: string): void {
    for (const found of Object.keys(entry)) {
        if (found !== key) {
            throw new MigrationCompileError(
                `Migration ${version}: operation has extra key ${found}; wrap a single ${key} object`,
            );
        }
    }
}

function isDestructiveOp(op: CompiledMigrationOp): boolean {
    return op.kind === "dropColumn" || op.kind === "changeType";
}

/**
 * Compile one versioned migration document into vendor ALTER statements.
 * `migration` may be a parsed object or a filesystem path.
 */
export function compileMigration(
    migration: unknown,
    vendor: string = "postgres",
): CompiledMigration {
    const dialect = resolveVendor(vendor);
    const doc = loadMigrationDoc(migration);
    expectKeys(
        doc,
        ["version", "description", "destructive", "operations"],
        "migration",
    );

    const version = requireString(doc, "version", "migration");
    if (!MIGRATION_VERSION.test(version)) {
        throw new MigrationCompileError(
            `Invalid migration version ${version}; use a zero-padded prefix such as 001_rename_nickname`,
        );
    }

    if (doc.description !== undefined && typeof doc.description !== "string") {
        throw new MigrationCompileError(`Migration ${version}: description must be a string`);
    }

    if (doc.destructive !== undefined && typeof doc.destructive !== "boolean") {
        throw new MigrationCompileError(`Migration ${version}: destructive must be a boolean`);
    }

    const operationsRaw = doc.operations;
    if (!Array.isArray(operationsRaw) || operationsRaw.length === 0) {
        throw new MigrationCompileError(`Migration ${version}: operations must be a non-empty list`);
    }

    const operations = operationsRaw.map((entry, index) =>
        compileOperation(entry, dialect, version, index),
    );
    const needsDestructive = operations.some(isDestructiveOp);
    const destructive = doc.destructive === true;

    if (needsDestructive && !destructive) {
        throw new MigrationCompileError(
            `Migration ${version}: dropColumn / changeType require destructive: true (refusing silent data loss)`,
        );
    }

    return {
        version,
        description: typeof doc.description === "string" ? doc.description : undefined,
        destructive,
        checksum: checksumOf(version, operations),
        operations,
    };
}

/**
 * Compile several migration documents. Versions must be unique; result is sorted.
 */
export function compileMigrations(
    migrations: unknown[],
    vendor: string = "postgres",
): CompiledMigration[] {
    if (!Array.isArray(migrations)) {
        throw new MigrationCompileError("compileMigrations requires an array of documents");
    }
    const compiled = migrations.map((migration) => compileMigration(migration, vendor));
    const seen = new Set<string>();
    for (const migration of compiled) {
        if (seen.has(migration.version)) {
            throw new MigrationCompileError(`Duplicate migration version: ${migration.version}`);
        }
        seen.add(migration.version);
    }
    compiled.sort((left, right) => left.version.localeCompare(right.version));
    return compiled;
}
