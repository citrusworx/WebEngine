import { client } from "@citrusworx/grapevine/infrastructure/util/utilities.js";

export interface FireWall {
    name: string;
    droplet_ids: number[];
    tags: string[];
    inbound_rules: object[];
    outbound_rules: object[];
}

export interface FireWallResponse {
    id: string;
    name: string;
    status: string;
    inbound_rules: object[];
    outbound_rules: object[];
}

export async function createFireWall(blueprint: FireWall){
    await client.post("/firewalls", blueprint)
}