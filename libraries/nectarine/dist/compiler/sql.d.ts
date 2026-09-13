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
export type OperatorToken = keyof typeof OP_TOKENS;
export type optokens = typeof OP_TOKENS;
export declare class QueryCompileError extends Error {
    constructor(message: string);
}
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function compileValue(value: unknown): string;
/**
 * Compile a single query object (the value under `resource.method.QueryName`)
 * into a parameterized SQL string.
 */
export declare function compileQuery(query: unknown): string;
