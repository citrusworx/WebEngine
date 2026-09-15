"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlSql = exports.rewriteMysqlPlaceholders = void 0;
exports.createMysqlAdapter = createMysqlAdapter;
exports.createMysqlAdapterFromConfig = createMysqlAdapterFromConfig;
exports.requireMysqlCredentials = requireMysqlCredentials;
const promise_1 = require("mysql2/promise");
const placeholders_js_1 = require("./placeholders.js");
Object.defineProperty(exports, "rewriteMysqlPlaceholders", { enumerable: true, get: function () { return placeholders_js_1.rewriteMysqlPlaceholders; } });
/**
 * MySQL adapter for parameterized SQL.
 *
 * Credentials are {@link DatabaseCredentials} from
 * {@link NectarineConfig.resolveCredentials} — YAML names the env keys;
 * this adapter receives the resolved values. It does not read `process.env`
 * itself.
 *
 * The Nectarine compiler is Postgres-first and emits `$1` / `$N::jsonb`.
 * {@link MysqlSql.query} rewrites those binds to MySQL `?` (and
 * `CAST(? AS JSON)` for json/jsonb) so compiled SQL can run here unchanged.
 * JSONB `@>` / `?` / `->>` become MySQL `JSON_CONTAINS` / `JSON_CONTAINS_PATH`
 * / `JSON_EXTRACT`. SQL that already uses `?` is left as-is.
 *
 * @example
 * ```ts
 * const creds = config.resolveCredentials("mysql");
 * if (!creds) throw new Error("MySQL env is incomplete");
 * const mysql = createMysqlAdapter(creds);
 * await mysql.connect();
 * const result = await mysql.query("SELECT id FROM users WHERE id = $1", [1]);
 * await mysql.end();
 * ```
 */
class MysqlSql {
    constructor(credentials) {
        this.pool = null;
        this.connecting = null;
        this.credentials = requireMysqlCredentials(credentials);
    }
    static fromCredentials(credentials) {
        return new MysqlSql(credentials);
    }
    get connected() {
        return this.pool !== null;
    }
    /**
     * Create the connection pool and check out one connection so failures
     * surface here instead of on the first query.
     */
    async connect() {
        if (this.pool) {
            return this.pool;
        }
        if (!this.connecting) {
            this.connecting = this.openPool().finally(() => {
                this.connecting = null;
            });
        }
        return this.connecting;
    }
    async openPool() {
        const pool = (0, promise_1.createPool)({
            user: this.credentials.user,
            password: this.credentials.password,
            host: this.credentials.host,
            port: this.credentials.port,
            database: this.credentials.database,
        });
        try {
            const connection = await pool.getConnection();
            connection.release();
        }
        catch (error) {
            await pool.end().catch(() => undefined);
            throw error;
        }
        this.pool = pool;
        return pool;
    }
    /**
     * Run parameterized SQL against the connected pool.
     *
     * Compiler `$1` / `$N::jsonb` binds are rewritten to MySQL `?` here.
     * Existing `?` SQL is executed as given.
     */
    async query(sql, params = []) {
        if (!this.pool) {
            throw new Error("MySQL adapter is not connected. Call connect() before query()");
        }
        if (typeof sql !== "string" || !sql.trim()) {
            throw new Error("MySQL adapter query() requires a SQL string");
        }
        const rewritten = (0, placeholders_js_1.rewriteMysqlPlaceholders)(sql, params);
        const [rows, fields] = await this.pool.execute(rewritten.sql, rewritten.params);
        return { rows, fields };
    }
    async disconnect() {
        const pool = this.pool;
        if (!pool) {
            return;
        }
        this.pool = null;
        await pool.end();
    }
    async end() {
        return this.disconnect();
    }
}
exports.MysqlSql = MysqlSql;
function createMysqlAdapter(credentials) {
    return MysqlSql.fromCredentials(credentials);
}
/**
 * Build a MySQL adapter from a loaded config when the active vendor is
 * mysql and env values resolve. Returns `null` when the vendor is not
 * mysql or credentials are incomplete (same as `resolveCredentials()`).
 */
function createMysqlAdapterFromConfig(config, vendor) {
    if (config.getVendor(vendor) !== "mysql") {
        return null;
    }
    const credentials = config.resolveCredentials("mysql");
    if (!credentials) {
        return null;
    }
    return createMysqlAdapter(credentials);
}
function requireMysqlCredentials(credentials) {
    if (!credentials) {
        throw new Error("MySQL adapter requires DatabaseCredentials");
    }
    const user = credentials.user?.trim();
    const password = credentials.password;
    const host = credentials.host?.trim();
    const database = credentials.database?.trim();
    const port = Number(credentials.port);
    if (!user || password == null || password === "" || !host || !database) {
        throw new Error("MySQL adapter requires complete credentials: user, password, host, port, and database");
    }
    if (!Number.isFinite(port)) {
        throw new Error(`MySQL adapter port must be a finite number, got ${JSON.stringify(credentials.port)}`);
    }
    return { user, password, host, port, database };
}
//# sourceMappingURL=msqlz.js.map