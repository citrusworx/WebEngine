import fs from "node:fs"
import { client } from "../../../infrastructure/util/utilities.js"; 

// TODO: Create a deployment log for digital ocean

export interface DropletActions {
    droplet_id: number;
    per_page: number;
    page: number;
}

export interface DropletAction {
    id: number;
    status: string;
    type: string;
    started_at: string;
    completed_at: string;
    resource_id: number;
    region: Record<string, unknown>;
    region_slug: string;
}

// Get all of the actions of a certain Droplet (via id)
export async function getDropletActions(droplet_id: number){
    const results: DropletActions = await client.get(`/droplets/${droplet_id}/actions`)
    return results
}

// Get an action of a droplet (via id)
export async function getAction(droplet_id: number, action_id: number){
    const results: DropletAction = await client.get(`/droplets/${droplet_id}/actions/${action_id}`)
    return results 
}

export async function logDropletActions(droplet_id: number){
    //  const actions = await getDropletActions(droplet_id)
    fs.createWriteStream("/logs/deployment-log.txt", "utf8");
    fs.appendFileSync("/logs/deployment-log.text", "logged action: success");
}

logDropletActions(1);