export type DatabaseEngine = "pg" | "mysql" | "redis" | "mongodb" | "kafka" | "opensearch" | "valkey" | (string & {});
export interface DatabaseConnection {
    protocol?: string;
    uri?: string;
    database?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    ssl?: boolean;
}
export interface DatabaseBlueprint {
    name: string;
    engine: DatabaseEngine;
    version?: string;
    region: string;
    size: string;
    num_nodes?: number;
    tags?: string[];
    private_network_uuid?: string;
    project_id?: string;
}
export interface DatabaseResource {
    id: string;
    name: string;
    engine: string;
    version?: string;
    status: string;
    region?: string;
    size?: string;
    num_nodes?: number;
    tags?: string[];
    connection?: DatabaseConnection;
    private_connection?: DatabaseConnection;
    private_network_uuid?: string;
    created_at?: string;
}
export interface DatabaseCreateResponse {
    database: DatabaseResource;
}
export declare function listDatabases(): Promise<DatabaseResource[]>;
export declare function getDatabase(id: string): Promise<DatabaseResource>;
export declare function createDatabase(blueprint: DatabaseBlueprint): Promise<DatabaseResource>;
export declare function deleteDatabase(id: string): Promise<void>;
export interface WaitForDatabaseOptions {
    timeoutMs?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
}
/** Poll GET /databases/:id until status is `online`, or throw on timeout. */
export declare function waitForDatabase(id: string, options?: WaitForDatabaseOptions): Promise<DatabaseResource>;
export declare function pickDatabaseConnection(database: DatabaseResource, preferPrivate?: boolean): DatabaseConnection | undefined;
