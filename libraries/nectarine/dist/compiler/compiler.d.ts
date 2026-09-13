import { type YAMLdata } from "../util/util.js";
export type { OperatorToken, optokens } from "./sql.js";
export { compileQuery, OP_TOKENS, QueryCompileError } from "./sql.js";
/**
 * Compiles Nectarine query YAML into parameterized SQL strings.
 *
 * Supported document shape (canonical, Postgres-first) — see
 * `models/user/db/pg/user.yml`:
 *
 * ```yaml
 * user:                    # type / resource
 *   get:                   # method
 *     UserById:            # query name
 *       select: ['id']
 *       from: users
 *       where: { column: id, operator: eq, value: $1 }
 * ```
 *
 * `clean_parse` takes `(parsed, type, method)` so it matches
 * `parser.genSQL(path, type, method, config)` and the YAML path
 * `user.get.UserById`.
 *
 * Not compiled: blog `queries:` maps and product `type: SELECT` fixtures.
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
     * @param type - resource key (`user`)
     * @param method - CRUD key (`get` | `create` | `update` | `delete`)
     */
    clean_parse(parsedConfig: YAMLdata, type: string, method: string): Record<string, unknown>;
    /**
     * Compile a named query from a cleaned method map into SQL.
     * `$1`-style placeholders are preserved; `{ fn: now }` becomes `NOW()`.
     */
    buildQuery(cleanedConfig: Record<string, unknown>, query: string): string;
}
