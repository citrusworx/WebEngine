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

export async function listFirewall(id: number){
    const response = await client.get(`/v2/firewalls/${id}`)
    return response.data.firewall
}

export async function listAllFirewalls(){
    const response = await client.get("/v2/firewalls")
    return response.data.firewalls
}

export async function updateFirewall(id: number, blueprint: FireWall){
    await client.put(`/v2/firewalls/${id}`, blueprint)
}

export async function deleteFirewall(id: number){
    await client.delete(`/v2/firewalls/${id}`)
}

export async function removeDropletsFromFirewall(id: number, dropletIds: number[]){
    await client.delete(`/v2/firewalls/${id}/droplets`, { data: { droplet_ids: dropletIds } })
}

export async function removeRulesFromFirewall(id: number, rules: object[]){
    await client.delete(`/v2/firewalls/${id}/rules`, { data: { inbound_rules: rules } })
}

export async function removeTagsFromFirewall(id: number, tags: string[]){
    await client.delete(`/v2/firewalls/${id}/tags`, { data: { tags } })
}

export async function addDropletsToFirewall(id: number, dropletIds: number[]){
    await client.post(`/v2/firewalls/${id}/droplets`, { data: { droplet_ids: dropletIds } })
}

export async function addRulesToFirewall(id: number, rules: object[]){
    await client.post(`/v2/firewalls/${id}/rules`, { data: { inbound_rules: rules } })
}

export async function addTagsToFirewall(id: number, tags: string[]){
    await client.post(`/v2/firewalls/${id}/tags`, { data: { tags } })
}