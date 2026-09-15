/**
 * Shared YAML-query → SQL compiler.
 *
 * Canonical phonics shape (Postgres-first): `models/user/db/pg/user.yml`
 *   resource → get|create|update|delete → QueryName → clause object
 *
 * Blackwater `type: SELECT` YAML is normalized onto this shape first
 * (`normalizeQuery`). Blog `queries:` maps are not compiled here.
 *
 * Also compiled: `COUNT(*)` (`{ fn: count }` / `count: true`),
 * `EXISTS` (`exists: true`), JSONB `@>` / `?` / `->>`.
 */
export { isRecord, QueryCompileError } from "./errors.js";
export declare const OP_TOKENS: {
    readonly eq: "=";
    readonly gt: ">";
    readonly lt: "<";
    readonly lte: "<=";
    readonly gte: ">=";
    readonly neq: "!=";
    readonly in: "IN";
    readonly not_in: "NOT IN";
    readonly is_null: "IS NULL";
    readonly is_not_null: "IS NOT NULL";
    /** JSONB containment (`payload @> $1::jsonb`). */
    readonly contains: "@>";
    /** JSONB key exists (`payload ? $1`). */
    readonly has_key: "?";
};
export declare const CRUD_METHODS: readonly ["get", "create", "update", "delete"];
export type OperatorToken = keyof typeof OP_TOKENS;
export type optokens = typeof OP_TOKENS;
export type CrudMethod = (typeof CRUD_METHODS)[number];
export type CleanedQueries = {
    type: string;
    method: CrudMethod;
    queries: Record<string, unknown>;
};
export declare function isCrudMethod(value: unknown): value is CrudMethod;
export declare function isCleanedQueries(value: unknown): value is CleanedQueries;
export declare function compileValue(value: unknown): string;
/**
 * Compile a single query object (the value under `resource.method.QueryName`)
 * into a parameterized SQL string.
 *
 * Pass `method` from `clean_parse` / `buildQuery` so DELETE is not inferred
 * from a bare `from` clause (a malformed GET missing `select`).
 * Without `method`, `type: SELECT|INSERT|UPDATE|DELETE` or an unambiguous
 * `select` / `insert` / `set` shape is enough.
 *
 * Blackwater `type: SELECT` objects are normalized onto the canonical
 * phonics shape before assembly.
 */
export declare function compileQuery(query: unknown, method?: CrudMethod): string;
