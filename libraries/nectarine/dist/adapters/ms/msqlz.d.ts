import type { FieldPacket, Pool, QueryResult, RowDataPacket } from "mysql2/promise";
import type { NectarineConfig } from "../../config/NectarineConfig.js";
import type { DatabaseCredentials, DatabaseVendor } from "../../config/types.js";
import { rewriteMysqlPlaceholders } from "./placeholders.js";
export type { DatabaseCredentials, DatabaseVendor } from "../../config/types.js";
export { rewriteMysqlPlaceholders };
export type { MysqlRewriteResult } from "./placeholders.js";
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
 * The Nectarine compiler is Postgres-first and emits `$1` / `$N::jsonb`.
 * {@link MysqlSql.query} rewrites those binds to MySQL `?` (and
 * `CAST(? AS JSON)` for json/jsonb) so compiled SQL can run here unchanged.
 * JSONB `@>` / `?` / `->>` become MySQL `JSON_CONTAINS` / `JSON_CONTAINS_PATH`
 * / `JSON_EXTRACT` (`JSON_QUOTE` wraps bound `has_key` names as one path segment).
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
export declare class MysqlSql {
    private pool;
    private connecting;
    private readonly credentials;
    constructor(credentials: DatabaseCredentials);
    static fromCredentials(credentials: DatabaseCredentials): MysqlSql;
    get connected(): boolean;
    /**
     * Create the connection pool and check out one connection so failures
     * surface here instead of on the first query.
     */
    connect(): Promise<Pool>;
    private openPool;
    /**
     * Run parameterized SQL against the connected pool.
     *
     * Compiler `$1` / `$N::jsonb` binds are rewritten to MySQL `?` here.
     * Existing `?` SQL is executed as given.
     */
    query<T extends QueryResult = RowDataPacket[]>(sql: string, params?: readonly unknown[]): Promise<MysqlQueryResult<T>>;
    disconnect(): Promise<void>;
    end(): Promise<void>;
}
export declare function createMysqlAdapter(credentials: DatabaseCredentials): MysqlSql;
/**
 * Build a MySQL adapter from a loaded config when the active vendor is
 * mysql and env values resolve. Returns `null` when the vendor is not
 * mysql or credentials are incomplete (same as `resolveCredentials()`).
 */
export declare function createMysqlAdapterFromConfig(config: NectarineConfig, vendor?: DatabaseVendor): MysqlSql | null;
export declare function requireMysqlCredentials(credentials: Partial<DatabaseCredentials> | null | undefined): DatabaseCredentials;
