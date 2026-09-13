/**
 * Shared YAML-query → SQL compiler.
 *
 * Canonical shape (Postgres-first MVP): `models/user/db/pg/user.yml`
 *   resource → get|create|update|delete → QueryName → clause object
 *
 * Alternate layouts (blog `queries:` map, product `type: SELECT` fixtures)
 * are not compiled here.
 */
export declare const OP_TOKENS: {
    readonly eq: "=";
    readonly gt: ">";
    readonly lt: "<";
    readonly lte: "<=";
    readonly gte: ">=";
    readonly neq: "!=";
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
export declare class QueryCompileError extends Error {
    constructor(message: string);
}
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function isCrudMethod(value: unknown): value is CrudMethod;
export declare function isCleanedQueries(value: unknown): value is CleanedQueries;
export declare function compileValue(value: unknown): string;
/**
 * Compile a single query object (the value under `resource.method.QueryName`)
 * into a parameterized SQL string.
 *
 * Pass `method` from `clean_parse` / `buildQuery` so DELETE is not inferred
 * from a bare `from` clause (a malformed GET missing `select`).
 * Without `method`, only unambiguous `select` / `insert` / `set` shapes compile.
 */
export declare function compileQuery(query: unknown, method?: CrudMethod): string;
