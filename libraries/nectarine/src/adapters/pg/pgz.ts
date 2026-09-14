import { Pool } from "pg";
import type { QueryResult, QueryResultRow } from "pg";
import type { NectarineConfig } from "../../config/NectarineConfig.js";
import type { DatabaseCredentials, DatabaseVendor } from "../../config/types.js";

export type { DatabaseCredentials, DatabaseVendor } from "../../config/types.js";

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
export class PgSql {
    private pool: Pool | null = null;
    private connecting: Promise<Pool> | null = null;
    private readonly credentials: DatabaseCredentials;

    constructor(credentials: DatabaseCredentials) {
        this.credentials = requirePgCredentials(credentials);
    }

    static fromCredentials(credentials: DatabaseCredentials): PgSql {
        return new PgSql(credentials);
    }

    get connected(): boolean {
        return this.pool !== null;
    }

    /**
     * Create the connection pool and check out one client so failures
     * surface here instead of on the first query.
     */
    async connect(): Promise<Pool> {
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

    private async openPool(): Promise<Pool> {
        const pool = new Pool({
            user: this.credentials.user,
            password: this.credentials.password,
            host: this.credentials.host,
            port: this.credentials.port,
            database: this.credentials.database,
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });

        pool.on("error", (error) => {
            console.error("Nectarine Postgres pool idle client error:", error);
        });

        try {
            const client = await pool.connect();
            client.release();
        } catch (error) {
            await pool.end().catch(() => undefined);
            throw error;
        }

        this.pool = pool;
        return pool;
    }

    /**
     * Run parameterized SQL (`$1`, `$2`, …) against the connected pool.
     */
    async query<T extends QueryResultRow = QueryResultRow>(
        sql: string,
        params: readonly unknown[] = [],
    ): Promise<QueryResult<T>> {
        if (!this.pool) {
            throw new Error("Postgres adapter is not connected. Call connect() before query()");
        }
        if (typeof sql !== "string" || !sql.trim()) {
            throw new Error("Postgres adapter query() requires a SQL string");
        }

        return this.pool.query<T>(sql, params as unknown[]);
    }

    async disconnect(): Promise<void> {
        const pool = this.pool;
        if (!pool) {
            return;
        }
        this.pool = null;
        await pool.end();
    }

    async end(): Promise<void> {
        return this.disconnect();
    }
}

export function createPgAdapter(credentials: DatabaseCredentials): PgSql {
    return PgSql.fromCredentials(credentials);
}

/**
 * Build a Postgres adapter from a loaded config when the active vendor is
 * postgres and env values resolve. Returns `null` when the vendor is not
 * postgres or credentials are incomplete (same as `resolveCredentials()`).
 */
export function createPgAdapterFromConfig(
    config: NectarineConfig,
    vendor?: DatabaseVendor,
): PgSql | null {
    if (config.getVendor(vendor) !== "postgres") {
        return null;
    }

    const credentials = config.resolveCredentials("postgres");
    if (!credentials) {
        return null;
    }

    return createPgAdapter(credentials);
}

export function requirePgCredentials(
    credentials: Partial<DatabaseCredentials> | null | undefined,
): DatabaseCredentials {
    if (!credentials) {
        throw new Error("Postgres adapter requires DatabaseCredentials");
    }

    const user = credentials.user?.trim();
    const password = credentials.password;
    const host = credentials.host?.trim();
    const database = credentials.database?.trim();
    const port = Number(credentials.port);

    if (!user || password == null || password === "" || !host || !database) {
        throw new Error(
            "Postgres adapter requires complete credentials: user, password, host, port, and database",
        );
    }

    if (!Number.isFinite(port)) {
        throw new Error(
            `Postgres adapter port must be a finite number, got ${JSON.stringify(credentials.port)}`,
        );
    }

    return { user, password, host, port, database };
}
