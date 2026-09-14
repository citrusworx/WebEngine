export type MysqlRewriteResult = {
    sql: string;
    params: unknown[];
};
/**
 * Convert compiler `$1` / `$N::jsonb` binds into MySQL `?` placeholders.
 *
 * Postgres stays `$1`. This rewrite is the MySQL adapter boundary: numbered
 * binds are expanded in appearance order so reused or out-of-order `$N`
 * still bind the matching `params[N - 1]` value.
 *
 * Allowlisted casts (`jsonb`, `json`, `text`):
 * - `jsonb` / `json` → `CAST(? AS JSON)` (MySQL JSON is the closest type)
 * - `text` → `?` (strip; `CAST(? AS CHAR)` would change collation/padding)
 *
 * SQL that already uses `?` and has no `$N` binds is returned unchanged.
 */
export declare function rewriteMysqlPlaceholders(sql: string, params?: readonly unknown[]): MysqlRewriteResult;
