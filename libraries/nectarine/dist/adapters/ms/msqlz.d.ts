/**
 * Connects to a Postgres database and executes a query based on
 * provided values.
 *
 * @param query - The SQL query to be executed.
 * @param values - The values to be inserted into placeholder values.
 * @returns Promise resolving to an array of query results.
 */
export declare const pool: any;
export declare function Mysql<T = any>(query: string, values?: any[]): Promise<any>;
export declare function closeSql(): Promise<void>;
