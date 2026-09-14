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
export declare class PgSql {
    private pool;
    private connecting;
    private readonly credentials;
    constructor(credentials: DatabaseCredentials);
    static fromCredentials(credentials: DatabaseCredentials): PgSql;
    get connected(): boolean;
    /**
     * Create the connection pool and check out one client so failures
     * surface here instead of on the first query.
     */
    connect(): Promise<Pool>;
    private openPool;
    /**
     * Run parameterized SQL (`$1`, `$2`, …) against the connected pool.
     */
    query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
    disconnect(): Promise<void>;
    end(): Promise<void>;
}
export declare function createPgAdapter(credentials: DatabaseCredentials): PgSql;
/**
 * Build a Postgres adapter from a loaded config when the active vendor is
 * postgres and env values resolve. Returns `null` when the vendor is not
 * postgres or credentials are incomplete (same as `resolveCredentials()`).
 */
export declare function createPgAdapterFromConfig(config: NectarineConfig, vendor?: DatabaseVendor): PgSql | null;
export declare function requirePgCredentials(credentials: Partial<DatabaseCredentials> | null | undefined): DatabaseCredentials;
