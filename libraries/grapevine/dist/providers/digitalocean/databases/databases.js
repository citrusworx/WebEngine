import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listDatabases() {
    const response = await doRequest({
        method: "GET",
        url: "/databases"
    });
    return response.databases ?? [];
}
export async function getDatabase(id) {
    const response = await doRequest({
        method: "GET",
        url: `/databases/${id}`
    });
    return response.database;
}
export async function createDatabase(blueprint) {
    const response = await doRequest({
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
export async function deleteDatabase(id) {
    await doRequest({
        method: "DELETE",
        url: `/databases/${id}`
    });
}
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Poll GET /databases/:id until status is `online`, or throw on timeout. */
export async function waitForDatabase(id, options = {}) {
    const timeoutMs = options.timeoutMs ?? 15 * 60 * 1000;
    const intervalMs = options.intervalMs ?? 10_000;
    const sleep = options.sleep ?? defaultSleep;
    const started = Date.now();
    let current = await getDatabase(id);
    while (current.status !== "online") {
        if (Date.now() - started > timeoutMs) {
            throw new Error(`Timed out waiting for DigitalOcean database "${current.name}" (${id}) to become online (last status: ${current.status})`);
        }
        await sleep(intervalMs);
        current = await getDatabase(id);
    }
    return current;
}
export function pickDatabaseConnection(database, preferPrivate = true) {
    if (preferPrivate && database.private_connection?.host) {
        return database.private_connection;
    }
    return database.connection;
}
//# sourceMappingURL=databases.js.map