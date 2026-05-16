import fs from "node:fs";
import { client } from "../../../infrastructure/util/utilities.js";
// Get all of the actions of a certain Droplet (via id)
export async function getDropletActions(droplet_id) {
    const results = await client.get(`/droplets/${droplet_id}/actions`);
    return results;
}
// Get an action of a droplet (via id)
export async function getAction(droplet_id, action_id) {
    const results = await client.get(`/droplets/${droplet_id}/actions/${action_id}`);
    return results;
}
export async function logDropletActions(droplet_id) {
    //  const actions = await getDropletActions(droplet_id)
    fs.createWriteStream("/logs/deployment-log.txt", "utf8");
    fs.appendFileSync("/logs/deployment-log.text", "logged action: success");
}
logDropletActions(1);
//# sourceMappingURL=deployment-log.js.map