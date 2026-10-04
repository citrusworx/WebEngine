import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listUptimeChecks() {
    return doList("/uptime/checks", "checks");
}
export async function getUptimeCheck(id) {
    const response = await doRequest({
        method: "GET",
        url: `/uptime/checks/${id}`
    });
    return response.check;
}
export async function createUptimeCheck(blueprint) {
    const response = await doRequest({
        method: "POST",
        url: "/uptime/checks",
        data: cleanPayload({
            name: blueprint.name,
            type: blueprint.type,
            target: blueprint.target,
            regions: blueprint.regions,
            enabled: blueprint.enabled ?? true
        })
    });
    return response.check;
}
export async function updateUptimeCheck(id, blueprint) {
    const response = await doRequest({
        method: "PUT",
        url: `/uptime/checks/${id}`,
        data: cleanPayload({
            name: blueprint.name,
            type: blueprint.type,
            target: blueprint.target,
            regions: blueprint.regions,
            enabled: blueprint.enabled ?? true
        })
    });
    return response.check;
}
export async function deleteUptimeCheck(id) {
    await doRequest({
        method: "DELETE",
        url: `/uptime/checks/${id}`
    });
}
//# sourceMappingURL=uptime.js.map