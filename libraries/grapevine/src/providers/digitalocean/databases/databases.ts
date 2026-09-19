import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

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

export async function listDatabases(): Promise<DatabaseResource[]> {
    const response = await doRequest<{ databases: DatabaseResource[] }>({
        method: "GET",
        url: "/databases"
    });
    return response.databases ?? [];
}

export async function getDatabase(id: string): Promise<DatabaseResource> {
    const response = await doRequest<{ database: DatabaseResource }>({
        method: "GET",
        url: `/databases/${id}`
    });
    return response.database;
}

export async function createDatabase(blueprint: DatabaseBlueprint): Promise<DatabaseResource> {
    const response = await doRequest<DatabaseCreateResponse>({
        method: "POST",
        url: "/databases",
        data: cleanPayload({
            name: blueprint.name,
            engine: blueprint.engine,
            version: blueprint.version,
            region: blueprint.region,
            size: blueprint.size,
            num_nodes: blueprint.num_nodes ?? 1,
            tags: blueprint.tags,
            private_network_uuid: blueprint.private_network_uuid,
            project_id: blueprint.project_id
        })
    });
    return response.database;
}

export async function deleteDatabase(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/databases/${id}`
    });
}

export interface WaitForDatabaseOptions {
    timeoutMs?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Poll GET /databases/:id until status is `online`, or throw on timeout. */
export async function waitForDatabase(
    id: string,
    options: WaitForDatabaseOptions = {}
): Promise<DatabaseResource> {
    const timeoutMs = options.timeoutMs ?? 15 * 60 * 1000;
    const intervalMs = options.intervalMs ?? 10_000;
    const sleep = options.sleep ?? defaultSleep;
    const started = Date.now();

    let current = await getDatabase(id);
    while (current.status !== "online") {
        if (Date.now() - started > timeoutMs) {
            throw new Error(
                `Timed out waiting for DigitalOcean database "${current.name}" (${id}) to become online (last status: ${current.status})`
            );
        }
        await sleep(intervalMs);
        current = await getDatabase(id);
    }
    return current;
}

export function pickDatabaseConnection(
    database: DatabaseResource,
    preferPrivate = true
): DatabaseConnection | undefined {
    if (preferPrivate && database.private_connection?.host) {
        return database.private_connection;
    }
    return database.connection;
}
