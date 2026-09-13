import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listAllLoadBalancers() {
    const response = await doRequest({
        method: "GET",
        url: "/load_balancers"
    });
    return response.load_balancers;
}
export async function getLoadBalancer(id) {
    const response = await doRequest({
        method: "GET",
        url: `/load_balancers/${id}`
    });
    return response.load_balancer;
}
export async function createLoadBalancer(blueprint) {
    const response = await doRequest({
        method: "POST",
        url: "/load_balancers",
        data: cleanPayload(blueprint)
    });
    return response.load_balancer;
}
export async function listLoadBalancer(id) {
    return getLoadBalancer(id);
}
export async function updateLoadBalancer(id, blueprint) {
    const response = await doRequest({
        method: "PUT",
        url: `/load_balancers/${id}`,
        data: cleanPayload(blueprint)
    });
    return response.load_balancer;
}
export async function deleteLoadBalancer(id) {
    await doRequest({
        method: "DELETE",
        url: `/load_balancers/${id}`
    });
}
export async function addDropletsToLoadBalancer(droplet_ids, id) {
    await doRequest({
        method: "POST",
        url: `/load_balancers/${id}/droplets`,
        data: { droplet_ids }
    });
}
export async function addForwardingRulesToLoadBalancer(rules, id) {
    await doRequest({
        method: "POST",
        url: `/load_balancers/${id}/forwarding_rules`,
        data: { forwarding_rules: rules }
    });
}
export async function removeDropletsFromLoadBalancer(droplet_ids, id) {
    await doRequest({
        method: "DELETE",
        url: `/load_balancers/${id}/droplets`,
        data: { droplet_ids }
    });
}
export async function removeForwardingRulesFromLoadBalancer(rules, id) {
    await doRequest({
        method: "DELETE",
        url: `/load_balancers/${id}/forwarding_rules`,
        data: { forwarding_rules: rules }
    });
}
//# sourceMappingURL=load-balancer.js.map