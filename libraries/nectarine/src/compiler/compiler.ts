import { parser, type YAMLdata } from "../util/util.js";
import {
    compileSchema,
    compileSchemas,
    compileTable,
    type DdlVendor,
} from "./ddl.js";
import {
    methodLookupKeys,
    resolveCrudMethod,
} from "./normalize.js";
import {
    compileQuery,
    isCleanedQueries,
    isRecord,
    QueryCompileError,
    type CleanedQueries,
    type CrudMethod,
} from "./sql.js";

export type { CleanedQueries, CrudMethod, OperatorToken, optokens } from "./sql.js";
export type { QueryType } from "./normalize.js";
export type { CompiledTable, DdlVendor } from "./ddl.js";
export {
    compileQuery,
    CRUD_METHODS,
    isCrudMethod,
    OP_TOKENS,
    QueryCompileError,
} from "./sql.js";
export {
    compileSchema,
    compileSchemaPlan,
    compileSchemas,
    compileTable,
    DDL_VENDORS,
    SchemaCompileError,
} from "./ddl.js";
export {
    inferMethodFromType,
    METHOD_ALIASES,
    normalizeQuery,
    resolveCrudMethod,
} from "./normalize.js";
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
     * @param type - resource key (`user`, `product`)
     * @param method - CRUD key (`get` | `read` | `create` | `update` | `delete`)
     */
    clean_parse(parsedConfig: YAMLdata, type: string, method: string): CleanedQueries {
        if (!isRecord(parsedConfig)) {
            throw new QueryCompileError("Parsed config must be an object");
        }

        const crud = resolveCrudMethod(method);
        if (!crud) {
            throw new QueryCompileError(`Unknown CRUD method: ${method}`);
        }

        const resource = parsedConfig[type];
        if (!isRecord(resource)) {
            throw new QueryCompileError(`SQL configuration not found for type: ${type}`);
        }

        const queries = lookupMethodQueries(resource, method);
        if (!queries) {
            throw new QueryCompileError(
                `SQL configuration not found for type: ${type}, method: ${method}`,
            );
        }

        return { type, method: crud, queries };
    }

    /**
     * Compile a named query from a cleaned method map into SQL.
     * `$1`-style placeholders are preserved; `{ fn: now }` becomes `NOW()`.
     *
     * `method` comes from {@link clean_parse}. A raw query map is accepted
     * when `method` is passed as the third argument (`read` aliases `get`).
     */
    buildQuery(
        cleanedConfig: CleanedQueries | Record<string, unknown>,
        query: string,
        method?: string,
    ): string {
        const resolved = method === undefined ? undefined : resolveCrudMethod(method);
        if (method !== undefined && resolved === undefined) {
            throw new QueryCompileError(`Unknown CRUD method: ${method}`);
        }

        const bundle = resolveCleanedQueries(cleanedConfig, resolved);

        if (!Object.prototype.hasOwnProperty.call(bundle.queries, query)) {
            throw new QueryCompileError(`Query not found: ${query}`);
        }

        return compileQuery(bundle.queries[query], bundle.method);
    }

    /**
     * Compile `*Schema.yml` tokens into CREATE TABLE / INDEX SQL.
     * `schema` is a parsed document or a filesystem path.
     */
    buildDdl(schema: unknown, vendor: DdlVendor | "mongodb" | string = "postgres"): string {
        return compileSchema(schema, vendor);
    }

    /**
     * Compile several schema documents with shared foreign-key ordering.
     */
    buildDdls(schemas: unknown[], vendor: DdlVendor | "mongodb" | string = "postgres"): string {
        return compileSchemas(schemas, vendor);
    }

    /**
     * Compile one named model from a schema document.
     */
    buildTable(
        schema: unknown,
        modelName: string,
        vendor: DdlVendor | "mongodb" | string = "postgres",
    ): string {
        return compileTable(schema, modelName, vendor);
    }
}

function lookupMethodQueries(
    resource: Record<string, unknown>,
    method: string,
): Record<string, unknown> | undefined {
    for (const key of methodLookupKeys(method)) {
        const queries = resource[key];
        if (isRecord(queries)) {
            return queries;
        }
    }
    return undefined;
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

    if (method === undefined) {
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
//
// Pass the resulting SQL string into the Postgres adapter with bound parameters:
//   await pg.query(getUserById, [id])
