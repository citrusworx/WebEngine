import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
function dropletPayload(spec) {
    return cleanPayload(spec);
}
export async function deployByBlueprint(blueprint) {
    const manifest = parseYAML(blueprint);
    const response = await doRequest({
        method: "POST",
        url: "/droplets",
        data: dropletPayload(manifest.blueprint.droplet)
    });
    return response.droplet;
}
export async function getDropletStatus(id) {
    const droplet = await getDroplet(id);
    return droplet.status;
}
export async function listAllDroplets(query = {}) {
    const response = await doRequest({
        method: "GET",
        url: "/droplets",
        params: cleanPayload(query)
    });
    return response.droplets;
}
export async function getDroplet(id) {
    const response = await doRequest({
        method: "GET",
        url: `/droplets/${id}`
    });
    return response.droplet;
}
export async function createDroplet(droplet) {
    const spec = "droplet" in droplet ? droplet.droplet : droplet;
    const response = await doRequest({
        method: "POST",
        url: "/droplets",
        data: dropletPayload(spec)
    });
    return response.droplet;
}
export async function createDroplets(droplets) {
    return Promise.all(droplets.map(createDroplet));
}
export async function deleteDropletsByTag(tag) {
    return doRequest({
        method: "DELETE",
        url: "/droplets",
        params: { tag_name: tag }
    });
}
export async function NukeDroplet(id) {
    return doRequest({
        method: "DELETE",
        url: `/droplets/${id}/destroy_with_associated_resources/dangerous`,
        headers: { "X-Dangerous": "true" }
    });
}
export async function NukeDropletLite(id, resources) {
    return doRequest({
        method: "DELETE",
        url: `/droplets/${id}/destroy_with_associated_resources/selective`,
        data: resources
    });
}
export async function deleteDroplet(id) {
    return doRequest({
        method: "DELETE",
        url: `/droplets/${id}`
    });
}
export async function listBackups(id) {
    const response = await doRequest({
        method: "GET",
        url: `/droplets/${id}/backups`
    });
    return response.backups;
}
export async function listBackupPolicy(id) {
    const response = await doRequest({
        method: "GET",
        url: `/droplets/${id}/backups/policy`
    });
    return response.policy ?? response.backup_policy ?? {};
}
export async function listFirewalls(id) {
    const response = await doRequest({
        method: "GET",
        url: `/droplets/${id}/firewalls`
    });
    return response.firewalls;
}
export async function listSnapshots(id) {
    const response = await doRequest({
        method: "GET",
        url: `/droplets/${id}/snapshots`
    });
    return response.snapshots;
}
//# sourceMappingURL=droplet.js.map