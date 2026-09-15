"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIGRATION_VERSION = exports.MigrationCompileError = void 0;
exports.compileMigration = compileMigration;
exports.compileMigrations = compileMigrations;
const node_crypto_1 = require("node:crypto");
const util_js_1 = require("../util/util.js");
const ddl_js_1 = require("./ddl.js");
const errors_js_1 = require("./errors.js");
const identifiers_js_1 = require("./identifiers.js");
class MigrationCompileError extends errors_js_1.QueryCompileError {
    constructor(message) {
        super(message);
        this.name = "MigrationCompileError";
    }
}
exports.MigrationCompileError = MigrationCompileError;
/** Zero-padded numeric prefix so lexicographic order matches apply order. */
exports.MIGRATION_VERSION = /^[0-9]{3}[A-Za-z0-9_-]*$/;
const OP_KEYS = ["renameColumn", "dropColumn", "changeType"];
function resolveVendor(vendor) {
    if (vendor === "mongodb") {
        throw new MigrationCompileError("Migration DDL compilation supports postgres and mysql; MongoDB is not SQL ALTER TABLE");
    }
    if (!ddl_js_1.DDL_VENDORS.includes(vendor)) {
        throw new MigrationCompileError(`Unknown DDL vendor: ${vendor}`);
    }
    return vendor;
}
function loadMigrationDoc(input) {
    if (typeof input === "string") {
        const parsed = util_js_1.parser.yaml(input);
        if (!(0, errors_js_1.isRecord)(parsed)) {
            throw new MigrationCompileError("Migration YAML must parse to an object");
        }
        return parsed;
    }
    if (!(0, errors_js_1.isRecord)(input)) {
        throw new MigrationCompileError("Migration must be an object");
    }
    return input;
}
function assertIdentifier(name, label) {
    if (!(0, identifiers_js_1.isSqlIdentifier)(name)) {
        throw new MigrationCompileError(`Invalid ${label}: ${name}`);
    }
}
function expectKeys(record, allowed, label) {
    for (const key of Object.keys(record)) {
        if (key === "sql") {
            throw new MigrationCompileError(`${label} cannot include raw sql; use renameColumn / dropColumn / changeType tokens`);
        }
        if (!allowed.includes(key)) {
            throw new MigrationCompileError(`Unknown ${label} key: ${key}`);
        }
    }
}
function requireString(record, key, label) {
    const value = record[key];
    if (typeof value !== "string" || value.trim() === "") {
        throw new MigrationCompileError(`${label} requires ${key}`);
    }
    return value;
}
function q(name, vendor) {
    return (0, identifiers_js_1.quoteIdent)(name, vendor);
}
function checksumOf(version, operations) {
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
    return (0, node_crypto_1.createHash)("sha256").update(JSON.stringify(canonical)).digest("hex");
}
function opKeyOf(entry) {
    const keys = OP_KEYS.filter((key) => key in entry);
    if (keys.length !== 1) {
        throw new MigrationCompileError("Each operation must be exactly one of renameColumn, dropColumn, changeType");
    }
    const key = keys[0];
    if (key === undefined) {
        throw new MigrationCompileError("Each operation must be an object");
    }
    return key;
}
function requireConfirm(spec, expected, version) {
    const confirm = spec.confirm;
    if (confirm !== expected) {
        throw new MigrationCompileError(`Migration ${version}: ${expected} requires confirm: ${expected} (refusing silent data loss)`);
    }
}
function compileRename(spec, vendor, version) {
    if (!(0, errors_js_1.isRecord)(spec)) {
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
function compileDrop(spec, vendor, version) {
    if (!(0, errors_js_1.isRecord)(spec)) {
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
function compileChangeType(spec, vendor, version) {
    if (!(0, errors_js_1.isRecord)(spec)) {
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
        throw new MigrationCompileError(`Migration ${version}: changeType.using must be column (a typed cast of the same column, not raw SQL)`);
    }
    const sqlType = (0, ddl_js_1.compileSqlType)(type, vendor);
    const col = q(column, vendor);
    const sql = vendor === "mysql"
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
function compileOperation(entry, vendor, version, index) {
    if (!(0, errors_js_1.isRecord)(entry)) {
        throw new MigrationCompileError(`Migration ${version}: operation ${index} must be an object`);
    }
    if ("sql" in entry) {
        throw new MigrationCompileError(`Migration ${version}: raw sql operations are not allowed; use renameColumn / dropColumn / changeType`);
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
function extraOpKeys(entry, key, version) {
    for (const found of Object.keys(entry)) {
        if (found !== key) {
            throw new MigrationCompileError(`Migration ${version}: operation has extra key ${found}; wrap a single ${key} object`);
        }
    }
}
function isDestructiveOp(op) {
    return op.kind === "dropColumn" || op.kind === "changeType";
}
/**
 * Compile one versioned migration document into vendor ALTER statements.
 * `migration` may be a parsed object or a filesystem path.
 */
function compileMigration(migration, vendor = "postgres") {
    const dialect = resolveVendor(vendor);
    const doc = loadMigrationDoc(migration);
    expectKeys(doc, ["version", "description", "destructive", "operations"], "migration");
    const version = requireString(doc, "version", "migration");
    if (!exports.MIGRATION_VERSION.test(version)) {
        throw new MigrationCompileError(`Invalid migration version ${version}; use a zero-padded prefix such as 001_rename_nickname`);
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
    const operations = operationsRaw.map((entry, index) => compileOperation(entry, dialect, version, index));
    const needsDestructive = operations.some(isDestructiveOp);
    const destructive = doc.destructive === true;
    if (needsDestructive && !destructive) {
        throw new MigrationCompileError(`Migration ${version}: dropColumn / changeType require destructive: true (refusing silent data loss)`);
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
function compileMigrations(migrations, vendor = "postgres") {
    if (!Array.isArray(migrations)) {
        throw new MigrationCompileError("compileMigrations requires an array of documents");
    }
    const compiled = migrations.map((migration) => compileMigration(migration, vendor));
    const seen = new Set();
    for (const migration of compiled) {
        if (seen.has(migration.version)) {
            throw new MigrationCompileError(`Duplicate migration version: ${migration.version}`);
        }
        seen.add(migration.version);
    }
    compiled.sort((left, right) => left.version.localeCompare(right.version));
    return compiled;
}
//# sourceMappingURL=migration.js.map