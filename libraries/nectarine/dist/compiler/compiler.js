"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CCompiler = exports.parseWhereFragment = exports.parseOrderByFragment = exports.resolveCrudMethod = exports.normalizeQuery = exports.METHOD_ALIASES = exports.inferMethodFromType = exports.MIGRATION_VERSION = exports.MigrationCompileError = exports.compileMigrations = exports.compileMigration = exports.SchemaCompileError = exports.schemaPlanStatements = exports.schemaFieldEnumValues = exports.DDL_VENDORS = exports.compileTable = exports.compileSqlType = exports.compileSchemasPlan = exports.compileSchemas = exports.compileSchemaPlan = exports.compileSchema = exports.quoteIdentPath = exports.quoteIdent = exports.QueryCompileError = exports.OP_TOKENS = exports.isCrudMethod = exports.CRUD_METHODS = exports.compileQuery = void 0;
const util_js_1 = require("../util/util.js");
const ddl_js_1 = require("./ddl.js");
const migration_js_1 = require("./migration.js");
const normalize_js_1 = require("./normalize.js");
const sql_js_1 = require("./sql.js");
var sql_js_2 = require("./sql.js");
Object.defineProperty(exports, "compileQuery", { enumerable: true, get: function () { return sql_js_2.compileQuery; } });
Object.defineProperty(exports, "CRUD_METHODS", { enumerable: true, get: function () { return sql_js_2.CRUD_METHODS; } });
Object.defineProperty(exports, "isCrudMethod", { enumerable: true, get: function () { return sql_js_2.isCrudMethod; } });
Object.defineProperty(exports, "OP_TOKENS", { enumerable: true, get: function () { return sql_js_2.OP_TOKENS; } });
Object.defineProperty(exports, "QueryCompileError", { enumerable: true, get: function () { return sql_js_2.QueryCompileError; } });
var identifiers_js_1 = require("./identifiers.js");
Object.defineProperty(exports, "quoteIdent", { enumerable: true, get: function () { return identifiers_js_1.quoteIdent; } });
Object.defineProperty(exports, "quoteIdentPath", { enumerable: true, get: function () { return identifiers_js_1.quoteIdentPath; } });
var ddl_js_2 = require("./ddl.js");
Object.defineProperty(exports, "compileSchema", { enumerable: true, get: function () { return ddl_js_2.compileSchema; } });
Object.defineProperty(exports, "compileSchemaPlan", { enumerable: true, get: function () { return ddl_js_2.compileSchemaPlan; } });
Object.defineProperty(exports, "compileSchemas", { enumerable: true, get: function () { return ddl_js_2.compileSchemas; } });
Object.defineProperty(exports, "compileSchemasPlan", { enumerable: true, get: function () { return ddl_js_2.compileSchemasPlan; } });
Object.defineProperty(exports, "compileSqlType", { enumerable: true, get: function () { return ddl_js_2.compileSqlType; } });
Object.defineProperty(exports, "compileTable", { enumerable: true, get: function () { return ddl_js_2.compileTable; } });
Object.defineProperty(exports, "DDL_VENDORS", { enumerable: true, get: function () { return ddl_js_2.DDL_VENDORS; } });
Object.defineProperty(exports, "schemaFieldEnumValues", { enumerable: true, get: function () { return ddl_js_2.schemaFieldEnumValues; } });
Object.defineProperty(exports, "schemaPlanStatements", { enumerable: true, get: function () { return ddl_js_2.schemaPlanStatements; } });
Object.defineProperty(exports, "SchemaCompileError", { enumerable: true, get: function () { return ddl_js_2.SchemaCompileError; } });
var migration_js_2 = require("./migration.js");
Object.defineProperty(exports, "compileMigration", { enumerable: true, get: function () { return migration_js_2.compileMigration; } });
Object.defineProperty(exports, "compileMigrations", { enumerable: true, get: function () { return migration_js_2.compileMigrations; } });
Object.defineProperty(exports, "MigrationCompileError", { enumerable: true, get: function () { return migration_js_2.MigrationCompileError; } });
Object.defineProperty(exports, "MIGRATION_VERSION", { enumerable: true, get: function () { return migration_js_2.MIGRATION_VERSION; } });
var normalize_js_2 = require("./normalize.js");
Object.defineProperty(exports, "inferMethodFromType", { enumerable: true, get: function () { return normalize_js_2.inferMethodFromType; } });
Object.defineProperty(exports, "METHOD_ALIASES", { enumerable: true, get: function () { return normalize_js_2.METHOD_ALIASES; } });
Object.defineProperty(exports, "normalizeQuery", { enumerable: true, get: function () { return normalize_js_2.normalizeQuery; } });
Object.defineProperty(exports, "resolveCrudMethod", { enumerable: true, get: function () { return normalize_js_2.resolveCrudMethod; } });
var fragments_js_1 = require("./fragments.js");
Object.defineProperty(exports, "parseOrderByFragment", { enumerable: true, get: function () { return fragments_js_1.parseOrderByFragment; } });
Object.defineProperty(exports, "parseWhereFragment", { enumerable: true, get: function () { return fragments_js_1.parseWhereFragment; } });
/**
 * Compiles Nectarine query YAML and schema YAML into SQL.
 *
 * App code calls named queries and named DDL only. This compiler assembles
 * DML, CREATE TABLE / INDEX, and versioned ALTER statements from YAML tokens (phonics).
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
 * `{ value: $N, cast: jsonb }` (allow-listed). JSONB `@>` / `?` / `->>`,
 * `COUNT`, `EXISTS`, and INSERT `onConflict` are compiler phonics — not host SQL.
 *
 * `clean_parse` takes `(parsed, type, method)` so it matches
 * `parser.genSQL(path, type, method, config)` and the YAML path
 * `user.get.UserById` / `product.read.allProducts`.
 */
class CCompiler {
    /**
     * Parse a query YAML file (path) into an object.
     */
    parse_config(config) {
        return util_js_1.parser.yaml(config);
    }
    /**
     * Narrow a parsed document to one resource + CRUD method.
     *
     * @param parsedConfig - object from {@link parse_config}
     * @param type - resource key (`user`, `product`)
     * @param method - CRUD key (`get` | `read` | `create` | `update` | `delete`)
     */
    clean_parse(parsedConfig, type, method) {
        if (!(0, sql_js_1.isRecord)(parsedConfig)) {
            throw new sql_js_1.QueryCompileError("Parsed config must be an object");
        }
        const crud = (0, normalize_js_1.resolveCrudMethod)(method);
        if (!crud) {
            throw new sql_js_1.QueryCompileError(`Unknown CRUD method: ${method}`);
        }
        const resource = parsedConfig[type];
        if (!(0, sql_js_1.isRecord)(resource)) {
            throw new sql_js_1.QueryCompileError(`SQL configuration not found for type: ${type}`);
        }
        const queries = lookupMethodQueries(resource, method);
        if (!queries) {
            throw new sql_js_1.QueryCompileError(`SQL configuration not found for type: ${type}, method: ${method}`);
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
    buildQuery(cleanedConfig, query, method) {
        const resolved = method === undefined ? undefined : (0, normalize_js_1.resolveCrudMethod)(method);
        if (method !== undefined && resolved === undefined) {
            throw new sql_js_1.QueryCompileError(`Unknown CRUD method: ${method}`);
        }
        const bundle = resolveCleanedQueries(cleanedConfig, resolved);
        if (!Object.prototype.hasOwnProperty.call(bundle.queries, query)) {
            throw new sql_js_1.QueryCompileError(`Query not found: ${query}`);
        }
        return (0, sql_js_1.compileQuery)(bundle.queries[query], bundle.method);
    }
    /**
     * Compile `*Schema.yml` tokens into CREATE TABLE / INDEX SQL.
     * `schema` is a parsed document or a filesystem path.
     */
    buildDdl(schema, vendor = "postgres", options) {
        return (0, ddl_js_1.compileSchema)(schema, vendor, options);
    }
    /**
     * Compile several schema documents with shared foreign-key ordering.
     */
    buildDdls(schemas, vendor = "postgres", options) {
        return (0, ddl_js_1.compileSchemas)(schemas, vendor, options);
    }
    /**
     * Compile one named model from a schema document.
     */
    buildTable(schema, modelName, vendor = "postgres", options) {
        return (0, ddl_js_1.compileTable)(schema, modelName, vendor, options);
    }
    /**
     * Compile a versioned migration YAML document into ALTER statements.
     */
    buildMigration(migration, vendor = "postgres") {
        return (0, migration_js_1.compileMigration)(migration, vendor);
    }
    /**
     * Compile several versioned migration documents (unique versions, sorted).
     */
    buildMigrations(migrations, vendor = "postgres") {
        return (0, migration_js_1.compileMigrations)(migrations, vendor);
    }
}
exports.CCompiler = CCompiler;
function lookupMethodQueries(resource, method) {
    for (const key of (0, normalize_js_1.methodLookupKeys)(method)) {
        const queries = resource[key];
        if ((0, sql_js_1.isRecord)(queries)) {
            return queries;
        }
    }
    return undefined;
}
function resolveCleanedQueries(cleanedConfig, method) {
    if ((0, sql_js_1.isCleanedQueries)(cleanedConfig)) {
        return method === undefined
            ? cleanedConfig
            : { ...cleanedConfig, method };
    }
    if (!(0, sql_js_1.isRecord)(cleanedConfig)) {
        throw new sql_js_1.QueryCompileError("Cleaned config must be an object");
    }
    if (method === undefined) {
        throw new sql_js_1.QueryCompileError("CRUD method is required; use clean_parse() or pass method to buildQuery");
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
//# sourceMappingURL=compiler.js.map