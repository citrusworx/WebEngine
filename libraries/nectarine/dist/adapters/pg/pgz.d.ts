import { Client } from 'pg';
export declare class PgSql {
    private tables;
    private dbs;
    private readonly creds;
    client(db: string): Promise<Client | undefined>;
    connect(db: string): Promise<Client | undefined>;
    disconnect(client: Client): Promise<void>;
    query(client: Client, config: {
        sql: string;
        params?: any[];
    }): Promise<import("pg").QueryResult<any> | undefined>;
    addTable(table: string): void;
    addDb(db: string): void;
}
