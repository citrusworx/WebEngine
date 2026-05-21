import { client, parseYAML } from "../../../infrastructure/util/utilities.js";

export const postAlertPolicy = async (policy: string) => {
    // Create One Axios Call for usage in createAlertPolicy
    const response = await client.post(`https:api.digitalocean.com/v1/insights/droplet`, policy,  {
        headers:{  
            Authorization: `Bearer ${process.env.DO_TOKEN}`,
            "Content-Type": "application/json"
        }
    })
    console.log(response)
    return response.data;
}

export interface CreateAlertPolicy {
    id?: number;
    alerts: Record<string, string>;
    description: string;
    enabled: boolean;
    entities: string[]; // Droplet IDs
    tags: string[];
    type: string;
    value: number;
    window: string;
}

export const createAlertPolicy = {
    memoryUsage: (name: string) => {
        postAlertPolicy(name);
    },
    diskRead: (id: number) => {

    },
    diskUtilization: (id: number) => {

    },
    percentCPU: (id: number) => {}
}

export async function listAlertPolicies() {
    const response = await client.get(`https:api.digitalocean.com/v1/insights/droplet`);
    return response.data.alert_policies;
}

export async function getAlertPolicy(alert_uuid: string) {
    const response = await client.get(`v2/monitoring/alerts/${alert_uuid}`);
    return response.data.alert_policy;
}