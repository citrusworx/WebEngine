"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CCompiler = exports.QueryCompileError = exports.OP_TOKENS = exports.compileQuery = void 0;
const util_js_1 = require("../util/util.js");
const sql_js_1 = require("./sql.js");
var sql_js_2 = require("./sql.js");
Object.defineProperty(exports, "compileQuery", { enumerable: true, get: function () { return sql_js_2.compileQuery; } });
Object.defineProperty(exports, "OP_TOKENS", { enumerable: true, get: function () { return sql_js_2.OP_TOKENS; } });
Object.defineProperty(exports, "QueryCompileError", { enumerable: true, get: function () { return sql_js_2.QueryCompileError; } });
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
     * @param type - resource key (`user`)
     * @param method - CRUD key (`get` | `create` | `update` | `delete`)
     */
    clean_parse(parsedConfig, type, method) {
        if (!(0, sql_js_1.isRecord)(parsedConfig)) {
            throw new sql_js_1.QueryCompileError("Parsed config must be an object");
        }
        const resource = parsedConfig[type];
        if (!(0, sql_js_1.isRecord)(resource)) {
            throw new sql_js_1.QueryCompileError(`SQL configuration not found for type: ${type}`);
        }
        const queries = resource[method];
        if (!(0, sql_js_1.isRecord)(queries)) {
            throw new sql_js_1.QueryCompileError(`SQL configuration not found for type: ${type}, method: ${method}`);
        }
        return queries;
    }
    /**
     * Compile a named query from a cleaned method map into SQL.
     * `$1`-style placeholders are preserved; `{ fn: now }` becomes `NOW()`.
     */
    buildQuery(cleanedConfig, query) {
        if (!(0, sql_js_1.isRecord)(cleanedConfig)) {
            throw new sql_js_1.QueryCompileError("Cleaned config must be an object");
        }
        if (!Object.prototype.hasOwnProperty.call(cleanedConfig, query)) {
            throw new sql_js_1.QueryCompileError(`Query not found: ${query}`);
        }
        return (0, sql_js_1.compileQuery)(cleanedConfig[query]);
    }
}
exports.CCompiler = CCompiler;
// const compiler = new CCompiler();
// const parse = compiler.parse_config("./models/user/db/pg/user.yml");
// const clean = compiler.clean_parse(parse, "user", "get");
// const getUserById = compiler.buildQuery(clean, "UserById");
// const getAllUsers = compiler.buildQuery(clean, "AllUsers");
//
// Pass the resulting SQL string into a DB adapter with bound parameters:
//   pg.query(client, { sql: getUserById, params: [id] })
//# sourceMappingURL=compiler.js.map