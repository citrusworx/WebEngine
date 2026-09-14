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
    indexes: string[];
    references: string[];
};
/**
 * Compile one schema document (`*Schema.yml`) into CREATE TABLE / INDEX SQL.
 * `schema` may be a parsed object or a filesystem path.
 */
export declare function compileSchema(schema: unknown, vendor?: string): string;
/**
 * Compile several schema documents with shared foreign-key ordering.
 */
export declare function compileSchemas(schemas: unknown[], vendor?: string): string;
/**
 * Compile a single named model from a schema document.
 */
export declare function compileTable(schema: unknown, modelName: string, vendor?: string): string;
export declare function compileSchemaPlan(schema: unknown, vendor?: string): CompiledTable[];
