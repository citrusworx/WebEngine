import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export interface AlertDestination {
    email?: string[];
    slack?: Array<{ channel: string; url: string }>;
}

export interface CreateAlertPolicy {
    alerts: AlertDestination;
    compare?: "GreaterThan" | "LessThan";
    description: string;
    enabled: boolean;
    entities?: string[];
    tags?: string[];
    type: string;
    value: number;
    window: string;
}

export interface AlertPolicy extends CreateAlertPolicy {
    uuid: string;
}

const ALERT_TYPES = {
    memoryUsage: "v1/insights/droplet/memory_utilization_percent",
    diskRead: "v1/insights/droplet/disk_read",
    diskUtilization: "v1/insights/droplet/disk_utilization_percent",
    percentCPU: "v1/insights/droplet/cpu"
} as const;

export async function createAlertPolicy(policy: CreateAlertPolicy): Promise<AlertPolicy> {
    const response = await doRequest<{ policy: AlertPolicy }>({
        method: "POST",
        url: "/monitoring/alerts",
        data: cleanPayload(policy)
    });
    return response.policy;
}

export async function postAlertPolicy(policy: CreateAlertPolicy): Promise<AlertPolicy> {
    return createAlertPolicy(policy);
}

export async function listAlertPolicies(): Promise<AlertPolicy[]> {
    const response = await doRequest<{ policies: AlertPolicy[] }>({
        method: "GET",
        url: "/monitoring/alerts"
    });
    return response.policies;
}

export async function getAlertPolicy(alert_uuid: string): Promise<AlertPolicy> {
    const response = await doRequest<{ policy: AlertPolicy }>({
        method: "GET",
        url: `/monitoring/alerts/${alert_uuid}`
    });
    return response.policy;
}

export async function updateAlertPolicy(alert_uuid: string, policy: CreateAlertPolicy): Promise<AlertPolicy> {
    const response = await doRequest<{ policy: AlertPolicy }>({
        method: "PUT",
        url: `/monitoring/alerts/${alert_uuid}`,
        data: cleanPayload(policy)
    });
    return response.policy;
}

export async function deleteAlertPolicy(alert_uuid: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/monitoring/alerts/${alert_uuid}`
    });
}

function preset(
    type: string,
    description: string,
    entities: string[],
    value: number,
    window = "5m"
): CreateAlertPolicy {
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
    memoryUsage: (entities: string[], value = 90) =>
        createAlertPolicy(preset(ALERT_TYPES.memoryUsage, "Memory utilization", entities, value)),
    diskRead: (entities: string[], value = 80) =>
        createAlertPolicy(preset(ALERT_TYPES.diskRead, "Disk read", entities, value)),
    diskUtilization: (entities: string[], value = 85) =>
        createAlertPolicy(preset(ALERT_TYPES.diskUtilization, "Disk utilization", entities, value)),
    percentCPU: (entities: string[], value = 80) =>
        createAlertPolicy(preset(ALERT_TYPES.percentCPU, "CPU utilization", entities, value))
};
