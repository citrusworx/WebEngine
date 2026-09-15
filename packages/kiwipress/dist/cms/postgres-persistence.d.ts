import { type CmsPersistence } from "./persistence.js";
export type SqlQueryResult = {
    rows?: unknown[];
};
export type SqlExecutor = {
    query(sql: string, params?: unknown[]): Promise<SqlQueryResult | undefined>;
};
export type PostgresPersistenceOptions = {
    database?: string;
    table?: string;
    executor?: SqlExecutor;
};
export declare function createPostgresPersistence(options?: PostgresPersistenceOptions): CmsPersistence;
