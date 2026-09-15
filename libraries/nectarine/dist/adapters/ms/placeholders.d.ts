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
 * JSONB operators the compiler emits (`@>`, `?`, `->>`) are rewritten first
 * so the Postgres `?` key check is not mistaken for a MySQL placeholder:
 * - `payload->>'catalog'` → `JSON_UNQUOTE(JSON_EXTRACT(payload, '$.catalog'))`
 * - `payload @> $1::jsonb` → `JSON_CONTAINS(payload, CAST(? AS JSON))`
 * - `payload @> '{"a":1}'` → `JSON_CONTAINS(payload, CAST('{"a":1}' AS JSON))`
 *   (decoded then re-escaped for MySQL so `\\` is not eaten as an SQL escape)
 * - `payload ? $1` → `JSON_CONTAINS_PATH(payload, 'one', CONCAT('$.', JSON_QUOTE(?)))`
 *
 * `ON CONFLICT` is Postgres-only in this version: this rewrite throws instead
 * of emitting `ON DUPLICATE KEY UPDATE`.
 *
 * SQL that already uses `?` and has no `$N` binds is returned unchanged.
 */
export declare function rewriteMysqlPlaceholders(sql: string, params?: readonly unknown[]): MysqlRewriteResult;
/**
 * Postgres `ON CONFLICT` is not rewritten to `ON DUPLICATE KEY UPDATE`.
 * v1 keeps the subset Postgres-only so MySQL cannot silently change upsert
 * semantics (or ignore non-duplicate errors via `INSERT IGNORE`).
 */
export declare function rejectMysqlOnConflict(sql: string): void;
/**
 * Rewrite compiler JSONB operators to MySQL JSON functions so Postgres `?`
 * is not treated as a positional placeholder.
 */
export declare function rewriteMysqlJsonbOperators(sql: string): string;
