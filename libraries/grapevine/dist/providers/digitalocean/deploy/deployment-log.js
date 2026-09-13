import fs from "node:fs";
import path from "node:path";
import { doRequest } from "../client.js";
export async function getDropletActions(droplet_id, query = {}) {
    const response = await doRequest({
        method: "GET",
        url: `/droplets/${droplet_id}/actions`,
        params: query
    });
    return response.actions;
}
export async function getAction(droplet_id, action_id) {
    const response = await doRequest({
        method: "GET",
        url: `/droplets/${droplet_id}/actions/${action_id}`
    });
    return response.action;
}
export async function logDropletActions(droplet_id, logPath = path.resolve("deployment-log.txt")) {
    const actions = await getDropletActions(droplet_id);
    const lines = actions
        .map((action) => `${action.started_at} ${action.type} ${action.status} (${action.id})`)
        .join("\n");
    fs.appendFileSync(logPath, `${lines}\n`, "utf8");
    return actions;
}
//# sourceMappingURL=deployment-log.js.map