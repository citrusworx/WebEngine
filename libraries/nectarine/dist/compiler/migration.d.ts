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
import { QueryCompileError } from "./errors.js";
export declare class MigrationCompileError extends QueryCompileError {
    constructor(message: string);
}
/** Zero-padded numeric prefix so lexicographic order matches apply order. */
export declare const MIGRATION_VERSION: RegExp;
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
/**
 * Compile one versioned migration document into vendor ALTER statements.
 * `migration` may be a parsed object or a filesystem path.
 */
export declare function compileMigration(migration: unknown, vendor?: string): CompiledMigration;
/**
 * Compile several migration documents. Versions must be unique; result is sorted.
 */
export declare function compileMigrations(migrations: unknown[], vendor?: string): CompiledMigration[];
