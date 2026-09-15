/**
 * Schema YAML → DDL compiler.
 *
 * App code never embeds CREATE TABLE. `*Schema.yml` tokens (table, fields,
 * constraints, indexes) are assembled here the same way query YAML becomes
 * DML. Adapters only execute the resulting statement text.
 *
 * Postgres JSONB is first-class: `json` / `jsonb` fields emit JSON/JSONB
 * columns. Do not drop JSONB to satisfy the no-SQL rule.
 */
import { QueryCompileError } from "./errors.js";
export declare class SchemaCompileError extends QueryCompileError {
    constructor(message: string);
}
export declare const DDL_VENDORS: readonly ["postgres", "mysql"];
export type DdlVendor = (typeof DDL_VENDORS)[number];
export type CompiledTable = {
    table: string;
    createTable: string;
    addColumns: string[];
    indexes: string[];
    references: string[];
};
export type CompileSchemaOptions = {
    /**
     * Postgres only: also emit `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
     * so existing tables pick up new schema fields. Rename, drop, and type
     * changes are versioned migration YAML (`compileMigration` / `applyMigrations`),
     * not silent schema-diff.
     */
    additive?: boolean;
};
/**
 * Flatten a compiled schema plan into executable statements.
 * `create` = CREATE TABLE (no additive ALTER). `additive` = ADD COLUMN only.
 * `indexes` = CREATE INDEX. `all` matches {@link compileSchemas} with options.
 */
export declare function schemaPlanStatements(tables: CompiledTable[], phase: "create" | "additive" | "indexes" | "all", options?: CompileSchemaOptions): string[];
/**
 * Compile one schema document (`*Schema.yml`) into CREATE TABLE / INDEX SQL.
 * `schema` may be a parsed object or a filesystem path.
 */
export declare function compileSchema(schema: unknown, vendor?: string, options?: CompileSchemaOptions): string;
/**
 * Compile several schema documents with shared foreign-key ordering.
 */
export declare function compileSchemas(schemas: unknown[], vendor?: string, options?: CompileSchemaOptions): string;
/**
 * Compile a single named model from a schema document.
 */
export declare function compileTable(schema: unknown, modelName: string, vendor?: string, options?: CompileSchemaOptions): string;
export declare function compileSchemaPlan(schema: unknown, vendor?: string): CompiledTable[];
/**
 * Compile several schema documents to a shared foreign-key-ordered plan.
 */
export declare function compileSchemasPlan(schemas: unknown[], vendor?: string): CompiledTable[];
/**
 * Map a schema field type token (`jsonb`, `varchar(100)`, `enum(a, b)`) to vendor SQL.
 * Used by type-change migrations; does not accept raw SQL.
 */
export declare function compileSqlType(typeSpec: string, vendor?: string): string;
/** Enum tokens from a schema field (for app-side allowlists, not SQL). */
export declare function schemaFieldEnumValues(schema: unknown, modelName: string, fieldName: string): readonly string[];
