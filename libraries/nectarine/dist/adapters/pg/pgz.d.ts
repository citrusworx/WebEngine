import { Client } from 'pg';
export declare class PgSql {
    private tables;
    private dbs;
    private readonly creds;
    client(db: string): Promise<Client | undefined>;
    connect(db: string): Promise<Client | undefined>;
    disconnect(client: Client): Promise<void>;
    /**  Config-based query execution
    //
    // @param client - the database client to use for executing the query
    // @param config - the configuration object containing the SQL query and parameters
    */
    query(client: Client, config: {
        sql: string;
        params?: any[];
    }): Promise<import("pg").QueryResult<any> | undefined>;
    addTable(table: string): void;
    addDb(db: string): void;
}
