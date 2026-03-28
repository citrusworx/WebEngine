import axios from "axios";
import path from "path";


export const postAlertPolicy = async (policy: string) => {
    // Create One Axios Call for usage in createAlertPolicy
    const client = await axios.post(`https:api.digitalocean.com/v1/insights/droplet`, policy,  {
        headers:{  
            Authorization: `Bearer ${process.env.DO_TOKEN}`,
            "Content-Type": "application/json"
        }
    })
    console.log(client)
    return client.data;
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