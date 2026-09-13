import { parser, type YAMLdata } from "../util/util.js";
import {
    compileQuery,
    isCleanedQueries,
    isCrudMethod,
    isRecord,
    QueryCompileError,
    type CleanedQueries,
    type CrudMethod,
} from "./sql.js";

export type { CleanedQueries, CrudMethod, OperatorToken, optokens } from "./sql.js";
export {
    compileQuery,
    CRUD_METHODS,
    isCrudMethod,
    OP_TOKENS,
    QueryCompileError,
} from "./sql.js";

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
 * `user.get.UserById`. The returned bundle carries `method` so
 * `buildQuery` can dispatch GET vs DELETE instead of guessing from keys.
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
    clean_parse(parsedConfig: YAMLdata, type: string, method: string): CleanedQueries {
        if (!isRecord(parsedConfig)) {
            throw new QueryCompileError("Parsed config must be an object");
        }
        if (!isCrudMethod(method)) {
            throw new QueryCompileError(`Unknown CRUD method: ${method}`);
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

        return { type, method, queries };
    }

    /**
     * Compile a named query from a cleaned method map into SQL.
     * `$1`-style placeholders are preserved; `{ fn: now }` becomes `NOW()`.
     *
     * `method` comes from {@link clean_parse}. A raw query map is accepted
     * when `method` is passed as the third argument.
     */
    buildQuery(
        cleanedConfig: CleanedQueries | Record<string, unknown>,
        query: string,
        method?: CrudMethod,
    ): string {
        const bundle = resolveCleanedQueries(cleanedConfig, method);

        if (!Object.prototype.hasOwnProperty.call(bundle.queries, query)) {
            throw new QueryCompileError(`Query not found: ${query}`);
        }

        return compileQuery(bundle.queries[query], bundle.method);
    }
}

function resolveCleanedQueries(
    cleanedConfig: CleanedQueries | Record<string, unknown>,
    method?: CrudMethod,
): CleanedQueries {
    if (isCleanedQueries(cleanedConfig)) {
        return method === undefined
            ? cleanedConfig
            : { ...cleanedConfig, method };
    }

    if (!isRecord(cleanedConfig)) {
        throw new QueryCompileError("Cleaned config must be an object");
    }

    if (!isCrudMethod(method)) {
        throw new QueryCompileError(
            "CRUD method is required; use clean_parse() or pass method to buildQuery",
        );
    }

    return { type: "", method, queries: cleanedConfig };
}

// const compiler = new CCompiler();
// const parse = compiler.parse_config("./models/user/db/pg/user.yml");
// const clean = compiler.clean_parse(parse, "user", "get");
// const getUserById = compiler.buildQuery(clean, "UserById");
// const getAllUsers = compiler.buildQuery(clean, "AllUsers");
//
// Pass the resulting SQL string into the Postgres adapter with bound parameters:
//   await pg.query(getUserById, [id])
