import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
const ALERT_TYPES = {
    memoryUsage: "v1/insights/droplet/memory_utilization_percent",
    diskRead: "v1/insights/droplet/disk_read",
    diskUtilization: "v1/insights/droplet/disk_utilization_percent",
    percentCPU: "v1/insights/droplet/cpu"
};
export async function createAlertPolicy(policy) {
    const response = await doRequest({
        method: "POST",
        url: "/monitoring/alerts",
        data: cleanPayload(policy)
    });
    return response.policy;
}
export async function postAlertPolicy(policy) {
    return createAlertPolicy(policy);
}
export async function listAlertPolicies() {
    const response = await doRequest({
        method: "GET",
        url: "/monitoring/alerts"
    });
    return response.policies;
}
export async function getAlertPolicy(alert_uuid) {
    const response = await doRequest({
        method: "GET",
        url: `/monitoring/alerts/${alert_uuid}`
    });
    return response.policy;
}
export async function updateAlertPolicy(alert_uuid, policy) {
    const response = await doRequest({
        method: "PUT",
        url: `/monitoring/alerts/${alert_uuid}`,
        data: cleanPayload(policy)
    });
    return response.policy;
}
export async function deleteAlertPolicy(alert_uuid) {
    await doRequest({
        method: "DELETE",
        url: `/monitoring/alerts/${alert_uuid}`
    });
}
function preset(type, description, entities, value, window = "5m") {
    return {
        alerts: { email: [] },
        compare: "GreaterThan",
        description,
        enabled: true,
        entities,
        tags: [],
        type,
        value,
        window
    };
}
export const alertPolicyPresets = {
    memoryUsage: (entities, value = 90) => createAlertPolicy(preset(ALERT_TYPES.memoryUsage, "Memory utilization", entities, value)),
    diskRead: (entities, value = 80) => createAlertPolicy(preset(ALERT_TYPES.diskRead, "Disk read", entities, value)),
    diskUtilization: (entities, value = 85) => createAlertPolicy(preset(ALERT_TYPES.diskUtilization, "Disk utilization", entities, value)),
    percentCPU: (entities, value = 80) => createAlertPolicy(preset(ALERT_TYPES.percentCPU, "CPU utilization", entities, value))
};
//# sourceMappingURL=monitoring.js.map