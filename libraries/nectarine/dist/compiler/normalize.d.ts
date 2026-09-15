/**
 * Normalize Blackwater / `type: SELECT` query YAML onto the canonical
 * phonics shape compiled by {@link compileQuery}.
 *
 * Blackwater:
 *   type: SELECT | INSERT | UPDATE | DELETE
 *   table, fields, where (fragment or structured), orderBy, returning
 *   read: is an alias of get
 *   count: true → SELECT COUNT(*)
 *   exists: true → SELECT EXISTS(SELECT 1 FROM ...)
 *
 * Canonical:
 *   select / from / where:{column,operator,value}
 *   insert:{into,columns,values}
 *   table / set / values / where
 */
import type { CrudMethod } from "./sql.js";
export declare const QUERY_TYPES: readonly ["SELECT", "INSERT", "UPDATE", "DELETE"];
export type QueryType = (typeof QUERY_TYPES)[number];
export declare const METHOD_ALIASES: {
    readonly read: "get";
    readonly get: "get";
    readonly create: "create";
    readonly update: "update";
    readonly delete: "delete";
};
export type MethodAlias = keyof typeof METHOD_ALIASES;
export declare function isQueryType(value: unknown): value is QueryType;
export declare function resolveCrudMethod(value: unknown): CrudMethod | undefined;
export declare function methodLookupKeys(method: string): string[];
export declare function inferMethodFromType(query: Record<string, unknown>): CrudMethod | undefined;
export declare function isBlackwaterQuery(query: Record<string, unknown>): boolean;
/**
 * Convert a Blackwater `type: SELECT` query (or pass through a canonical one).
 */
export declare function normalizeQuery(query: Record<string, unknown>, method?: CrudMethod): Record<string, unknown>;
