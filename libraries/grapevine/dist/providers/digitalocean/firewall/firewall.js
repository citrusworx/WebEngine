import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function createFireWall(blueprint) {
    const response = await doRequest({
        method: "POST",
        url: "/firewalls",
        data: cleanPayload(blueprint)
    });
    return response.firewall;
}
export async function listFirewall(id) {
    return getFirewall(id);
}
export async function getFirewall(id) {
    const response = await doRequest({
        method: "GET",
        url: `/firewalls/${id}`
    });
    return response.firewall;
}
export async function listAllFirewalls() {
    const response = await doRequest({
        method: "GET",
        url: "/firewalls"
    });
    return response.firewalls;
}
export async function updateFirewall(id, blueprint) {
    const response = await doRequest({
        method: "PUT",
        url: `/firewalls/${id}`,
        data: cleanPayload(blueprint)
    });
    return response.firewall;
}
export async function deleteFirewall(id) {
    await doRequest({
        method: "DELETE",
        url: `/firewalls/${id}`
    });
}
export async function removeDropletsFromFirewall(id, dropletIds) {
    await doRequest({
        method: "DELETE",
        url: `/firewalls/${id}/droplets`,
        data: { droplet_ids: dropletIds }
    });
}
export async function addDropletsToFirewall(id, dropletIds) {
    await doRequest({
        method: "POST",
        url: `/firewalls/${id}/droplets`,
        data: { droplet_ids: dropletIds }
    });
}
export async function removeRulesFromFirewall(id, rules) {
    await doRequest({
        method: "DELETE",
        url: `/firewalls/${id}/rules`,
        data: rules
    });
}
export async function addRulesToFirewall(id, rules) {
    await doRequest({
        method: "POST",
        url: `/firewalls/${id}/rules`,
        data: rules
    });
}
export async function removeTagsFromFirewall(id, tags) {
    await doRequest({
        method: "DELETE",
        url: `/firewalls/${id}/tags`,
        data: { tags }
    });
}
export async function addTagsToFirewall(id, tags) {
    await doRequest({
        method: "POST",
        url: `/firewalls/${id}/tags`,
        data: { tags }
    });
}
//# sourceMappingURL=firewall.js.map