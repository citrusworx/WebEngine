"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgSql = void 0;
exports.createPgAdapter = createPgAdapter;
exports.createPgAdapterFromConfig = createPgAdapterFromConfig;
exports.requirePgCredentials = requirePgCredentials;
const pg_1 = require("pg");
/**
 * Postgres adapter for parameterized SQL from the Nectarine compiler.
 *
 * Uses a `pg.Pool` so concurrent HTTP requests do not share a single client.
 * Credentials are {@link DatabaseCredentials} from
 * {@link NectarineConfig.resolveCredentials} — YAML names the env keys;
 * this adapter receives the resolved values. It does not read `process.env`
 * itself.
 *
 * @example
 * ```ts
 * const creds = config.resolveCredentials("postgres");
 * if (!creds) throw new Error("Postgres env is incomplete");
 * const pg = createPgAdapter(creds);
 * await pg.connect();
 * const result = await pg.query("SELECT id FROM users WHERE id = $1", [1]);
 * await pg.end();
 * ```
 */
class PgSql {
    constructor(credentials) {
        this.pool = null;
        this.connecting = null;
        this.credentials = requirePgCredentials(credentials);
    }
    static fromCredentials(credentials) {
        return new PgSql(credentials);
    }
    get connected() {
        return this.pool !== null;
    }
    /**
     * Create the connection pool and check out one client so failures
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
        const pool = new pg_1.Pool({
            user: this.credentials.user,
            password: this.credentials.password,
            host: this.credentials.host,
            port: this.credentials.port,
            database: this.credentials.database,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        pool.on("error", (error) => {
            console.error("Nectarine Postgres pool idle client error:", error);
        });
        try {
            const client = await pool.connect();
            client.release();
        }
        catch (error) {
            await pool.end().catch(() => undefined);
            throw error;
        }
        this.pool = pool;
        return pool;
    }
    /**
     * Run parameterized SQL (`$1`, `$2`, …) against the connected pool.
     */
    async query(sql, params = []) {
        if (!this.pool) {
            throw new Error("Postgres adapter is not connected. Call connect() before query()");
        }
        if (typeof sql !== "string" || !sql.trim()) {
            throw new Error("Postgres adapter query() requires a SQL string");
        }
        return this.pool.query(sql, params);
    }
    /**
     * Pin one pooled client for `work`. The migrator sends BEGIN/COMMIT through
     * this query callback so a multi-op migration and its ledger insert share
     * a transaction (`pool.query()` would use a different client per call).
     */
    async withTransaction(work) {
        if (!this.pool) {
            throw new Error("Postgres adapter is not connected. Call connect() before withTransaction()");
        }
        const client = await this.pool.connect();
        try {
            return await work((sql, params = []) => {
                if (typeof sql !== "string" || !sql.trim()) {
                    throw new Error("Postgres adapter query() requires a SQL string");
                }
                return client.query(sql, params);
            });
        }
        finally {
            client.release();
        }
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
exports.PgSql = PgSql;
function createPgAdapter(credentials) {
    return PgSql.fromCredentials(credentials);
}
/**
 * Build a Postgres adapter from a loaded config when the active vendor is
 * postgres and env values resolve. Returns `null` when the vendor is not
 * postgres or credentials are incomplete (same as `resolveCredentials()`).
 */
function createPgAdapterFromConfig(config, vendor) {
    if (config.getVendor(vendor) !== "postgres") {
        return null;
    }
    const credentials = config.resolveCredentials("postgres");
    if (!credentials) {
        return null;
    }
    return createPgAdapter(credentials);
}
function requirePgCredentials(credentials) {
    if (!credentials) {
        throw new Error("Postgres adapter requires DatabaseCredentials");
    }
    const user = credentials.user?.trim();
    const password = credentials.password;
    const host = credentials.host?.trim();
    const database = credentials.database?.trim();
    const port = Number(credentials.port);
    if (!user || password == null || password === "" || !host || !database) {
        throw new Error("Postgres adapter requires complete credentials: user, password, host, port, and database");
    }
    if (!Number.isFinite(port)) {
        throw new Error(`Postgres adapter port must be a finite number, got ${JSON.stringify(credentials.port)}`);
    }
    return { user, password, host, port, database };
}
//# sourceMappingURL=pgz.js.map