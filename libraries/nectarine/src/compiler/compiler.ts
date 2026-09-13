import { parser, type YAMLdata } from "../util/util.js";
import { compileQuery, isRecord, QueryCompileError } from "./sql.js";

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
export class CCompiler {
    /**
     * Parse a query YAML file (path) into an object.
     */
    parse_config(config: string): YAMLdata {
        return parser.yaml(config);
    }

    /**
     * Narrow a parsed document to one resource + CRUD method.
     *
     * @param parsedConfig - object from {@link parse_config}
     * @param type - resource key (`user`)
     * @param method - CRUD key (`get` | `create` | `update` | `delete`)
     */
    clean_parse(
        parsedConfig: YAMLdata,
        type: string,
        method: string,
    ): Record<string, unknown> {
        if (!isRecord(parsedConfig)) {
            throw new QueryCompileError("Parsed config must be an object");
        }

        const resource = parsedConfig[type];
        if (!isRecord(resource)) {
            throw new QueryCompileError(`SQL configuration not found for type: ${type}`);
        }

        const queries = resource[method];
        if (!isRecord(queries)) {
            throw new QueryCompileError(
                `SQL configuration not found for type: ${type}, method: ${method}`,
            );
        }

        return queries;
    }

    /**
     * Compile a named query from a cleaned method map into SQL.
     * `$1`-style placeholders are preserved; `{ fn: now }` becomes `NOW()`.
     */
    buildQuery(cleanedConfig: Record<string, unknown>, query: string): string {
        if (!isRecord(cleanedConfig)) {
            throw new QueryCompileError("Cleaned config must be an object");
        }

        if (!Object.prototype.hasOwnProperty.call(cleanedConfig, query)) {
            throw new QueryCompileError(`Query not found: ${query}`);
        }

        return compileQuery(cleanedConfig[query]);
    }
}

// const compiler = new CCompiler();
// const parse = compiler.parse_config("./models/user/db/pg/user.yml");
// const clean = compiler.clean_parse(parse, "user", "get");
// const getUserById = compiler.buildQuery(clean, "UserById");
// const getAllUsers = compiler.buildQuery(clean, "AllUsers");
//
// Pass the resulting SQL string into a DB adapter with bound parameters:
//   pg.query(client, { sql: getUserById, params: [id] })
