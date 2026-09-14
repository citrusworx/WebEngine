import { type YAMLdata } from "../util/util.js";
import { type CompileSchemaOptions, type DdlVendor } from "./ddl.js";
import { type CleanedQueries } from "./sql.js";
export type { CleanedQueries, CrudMethod, OperatorToken, optokens } from "./sql.js";
export type { QueryType } from "./normalize.js";
export type { CompiledTable, CompileSchemaOptions, DdlVendor } from "./ddl.js";
export { compileQuery, CRUD_METHODS, isCrudMethod, OP_TOKENS, QueryCompileError, } from "./sql.js";
export { quoteIdent, quoteIdentPath } from "./identifiers.js";
export { compileSchema, compileSchemaPlan, compileSchemas, compileTable, DDL_VENDORS, schemaFieldEnumValues, SchemaCompileError, } from "./ddl.js";
export { inferMethodFromType, METHOD_ALIASES, normalizeQuery, resolveCrudMethod, } from "./normalize.js";
export { parseOrderByFragment, parseWhereFragment } from "./fragments.js";
/**
 * Compiles Nectarine query YAML and schema YAML into SQL.
 *
 * App code calls named queries and named DDL only. This compiler assembles
 * DML and CREATE TABLE / INDEX statements from YAML tokens (phonics).
 * Adapters execute the resulting text — they never build SQL.
 *
 * Canonical document shape (Postgres-first) — see `models/user/db/pg/user.yml`:
 *
 * ```yaml
 * user:                    # type / resource
 *   get:                   # method (`read` is an alias of `get`)
 *     UserById:            # query name
 *       select: ['id']
 *       from: users
 *       where: { column: id, operator: eq, value: $1 }
 * ```
 *
 * Blackwater `type: SELECT` documents are accepted and normalized onto the
 * same phonics model before assembly. Postgres JSONB binds use
 * `{ value: $N, cast: jsonb }` (allow-listed).
 *
 * `clean_parse` takes `(parsed, type, method)` so it matches
 * `parser.genSQL(path, type, method, config)` and the YAML path
 * `user.get.UserById` / `product.read.allProducts`.
 */
export declare class CCompiler {
    /**
     * Parse a query YAML file (path) into an object.
     */
    parse_config(config: string): YAMLdata;
    /**
     * Narrow a parsed document to one resource + CRUD method.
     *
     * @param parsedConfig - object from {@link parse_config}
     * @param type - resource key (`user`, `product`)
     * @param method - CRUD key (`get` | `read` | `create` | `update` | `delete`)
     */
    clean_parse(parsedConfig: YAMLdata, type: string, method: string): CleanedQueries;
    /**
     * Compile a named query from a cleaned method map into SQL.
     * `$1`-style placeholders are preserved; `{ fn: now }` becomes `NOW()`.
     *
     * `method` comes from {@link clean_parse}. A raw query map is accepted
     * when `method` is passed as the third argument (`read` aliases `get`).
     */
    buildQuery(cleanedConfig: CleanedQueries | Record<string, unknown>, query: string, method?: string): string;
    /**
     * Compile `*Schema.yml` tokens into CREATE TABLE / INDEX SQL.
     * `schema` is a parsed document or a filesystem path.
     */
    buildDdl(schema: unknown, vendor?: DdlVendor | "mongodb" | string, options?: CompileSchemaOptions): string;
    /**
     * Compile several schema documents with shared foreign-key ordering.
     */
    buildDdls(schemas: unknown[], vendor?: DdlVendor | "mongodb" | string, options?: CompileSchemaOptions): string;
    /**
     * Compile one named model from a schema document.
     */
    buildTable(schema: unknown, modelName: string, vendor?: DdlVendor | "mongodb" | string, options?: CompileSchemaOptions): string;
}
