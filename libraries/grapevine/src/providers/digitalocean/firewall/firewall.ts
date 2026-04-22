import { client } from "../../../infrastructure/util/utilities.js";

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

export async function listFirewall(firewall: string){}

export async function listAllFirewalls(){}

export async function updateFirewall(firewall: string){}

export async function deleteFirewall(){}

export async function removeDropletsFromFirewall(){}

export async function removeRulesFromFirewall(){}

export async function removeTagsFromFirewall(){}

export async function addDropletsToFirewall(){}

export async function addRulesToFirewall(){}

export async function addTagsToFirewall(){}