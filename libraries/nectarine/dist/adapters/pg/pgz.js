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
        this.connection = null;
        this.credentials = requirePgCredentials(credentials);
    }
    static fromCredentials(credentials) {
        return new PgSql(credentials);
    }
    get connected() {
        return this.connection !== null;
    }
    async connect() {
        if (this.connection) {
            return this.connection;
        }
        const client = new pg_1.Client({
            user: this.credentials.user,
            password: this.credentials.password,
            host: this.credentials.host,
            port: this.credentials.port,
            database: this.credentials.database,
        });
        try {
            await client.connect();
        }
        catch (error) {
            await client.end().catch(() => undefined);
            throw error;
        }
        this.connection = client;
        return client;
    }
    /**
     * Run parameterized SQL (`$1`, `$2`, …) against the connected client.
     */
    async query(sql, params = []) {
        if (!this.connection) {
            throw new Error("Postgres adapter is not connected. Call connect() before query()");
        }
        if (typeof sql !== "string" || !sql.trim()) {
            throw new Error("Postgres adapter query() requires a SQL string");
        }
        return this.connection.query(sql, params);
    }
    async disconnect() {
        const client = this.connection;
        if (!client) {
            return;
        }
        this.connection = null;
        await client.end();
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
    const password = credentials.password?.trim();
    const host = credentials.host?.trim();
    const database = credentials.database?.trim();
    const port = Number(credentials.port);
    if (!user || !password || !host || !database) {
        throw new Error("Postgres adapter requires complete credentials: user, password, host, port, and database");
    }
    if (!Number.isFinite(port)) {
        throw new Error(`Postgres adapter port must be a finite number, got ${JSON.stringify(credentials.port)}`);
    }
    return { user, password, host, port, database };
}
//# sourceMappingURL=pgz.js.map