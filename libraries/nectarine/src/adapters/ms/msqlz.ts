import { createPool } from "mysql2/promise";
import type { FieldPacket, Pool, QueryResult, RowDataPacket } from "mysql2/promise";
import type { NectarineConfig } from "../../config/NectarineConfig.js";
import type { DatabaseCredentials, DatabaseVendor } from "../../config/types.js";

export type { DatabaseCredentials, DatabaseVendor } from "../../config/types.js";

/**
 * Result of {@link MysqlSql.query}. `rows` is a `RowDataPacket[]` for SELECT
 * and a `ResultSetHeader` for INSERT/UPDATE/DELETE (mysql2 `execute` shape).
 */
export type MysqlQueryResult<T extends QueryResult = RowDataPacket[]> = {
    rows: T;
    fields: FieldPacket[];
};

/**
 * MySQL adapter for parameterized SQL.
 *
 * Credentials are {@link DatabaseCredentials} from
 * {@link NectarineConfig.resolveCredentials} — YAML names the env keys;
 * this adapter receives the resolved values. It does not read `process.env`
 * itself.
 *
 * Placeholders are MySQL `?` (not Postgres `$1`). The Nectarine compiler is
 * Postgres-first and still emits `$1`; this adapter runs the SQL and params
 * it is given and does not rewrite placeholders.
 *
 * @example
 * ```ts
 * const creds = config.resolveCredentials("mysql");
 * if (!creds) throw new Error("MySQL env is incomplete");
 * const mysql = createMysqlAdapter(creds);
 * await mysql.connect();
 * const result = await mysql.query("SELECT id FROM users WHERE id = ?", [1]);
 * await mysql.end();
 * ```
 */
export class MysqlSql {
    private pool: Pool | null = null;
    private readonly credentials: DatabaseCredentials;

    constructor(credentials: DatabaseCredentials) {
        this.credentials = requireMysqlCredentials(credentials);
    }

    static fromCredentials(credentials: DatabaseCredentials): MysqlSql {
        return new MysqlSql(credentials);
    }

    get connected(): boolean {
        return this.pool !== null;
    }

    /**
     * Create the connection pool and check out one connection so failures
     * surface here instead of on the first query.
     */
    async connect(): Promise<Pool> {
        if (this.pool) {
            return this.pool;
        }

        const pool = createPool({
            user: this.credentials.user,
            password: this.credentials.password,
            host: this.credentials.host,
            port: this.credentials.port,
            database: this.credentials.database,
        });

        try {
            const connection = await pool.getConnection();
            connection.release();
        } catch (error) {
            await pool.end().catch(() => undefined);
            throw error;
        }

        this.pool = pool;
        return pool;
    }

    /**
     * Run parameterized SQL (`?` placeholders) against the connected pool.
     */
    async query<T extends QueryResult = RowDataPacket[]>(
        sql: string,
        params: readonly unknown[] = [],
    ): Promise<MysqlQueryResult<T>> {
        if (!this.pool) {
            throw new Error("MySQL adapter is not connected. Call connect() before query()");
        }
        if (typeof sql !== "string" || !sql.trim()) {
            throw new Error("MySQL adapter query() requires a SQL string");
        }

        const [rows, fields] = await this.pool.execute<T>(
            sql,
            params as unknown as (string | number | bigint | boolean | Date | Buffer | null)[],
        );
        return { rows, fields };
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

export function createMysqlAdapter(credentials: DatabaseCredentials): MysqlSql {
    return MysqlSql.fromCredentials(credentials);
}

/**
 * Build a MySQL adapter from a loaded config when the active vendor is
 * mysql and env values resolve. Returns `null` when the vendor is not
 * mysql or credentials are incomplete (same as `resolveCredentials()`).
 */
export function createMysqlAdapterFromConfig(
    config: NectarineConfig,
    vendor?: DatabaseVendor,
): MysqlSql | null {
    if (config.getVendor(vendor) !== "mysql") {
        return null;
    }

    const credentials = config.resolveCredentials("mysql");
    if (!credentials) {
        return null;
    }

    return createMysqlAdapter(credentials);
}

export function requireMysqlCredentials(
    credentials: Partial<DatabaseCredentials> | null | undefined,
): DatabaseCredentials {
    if (!credentials) {
        throw new Error("MySQL adapter requires DatabaseCredentials");
    }

    const user = credentials.user?.trim();
    const password = credentials.password?.trim();
    const host = credentials.host?.trim();
    const database = credentials.database?.trim();
    const port = Number(credentials.port);

    if (!user || !password || !host || !database) {
        throw new Error(
            "MySQL adapter requires complete credentials: user, password, host, port, and database",
        );
    }

    if (!Number.isFinite(port)) {
        throw new Error(
            `MySQL adapter port must be a finite number, got ${JSON.stringify(credentials.port)}`,
        );
    }

    return { user, password, host, port, database };
}
