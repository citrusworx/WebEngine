import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export interface FirewallRuleSources {
    addresses?: string[];
    droplet_ids?: number[];
    load_balancer_uids?: string[];
    kubernetes_ids?: string[];
    tags?: string[];
}

export interface FirewallRule {
    protocol: string;
    ports?: string;
    sources?: FirewallRuleSources;
    destinations?: FirewallRuleSources;
}

export interface FireWall {
    name: string;
    droplet_ids?: number[];
    tags?: string[];
    inbound_rules?: FirewallRule[];
    outbound_rules?: FirewallRule[];
}

export type FireWallBlueprint = FireWall;
export type FirewallBlueprint = FireWall;

export interface FireWallResponse {
    id: string;
    name: string;
    status: string;
    inbound_rules: FirewallRule[];
    outbound_rules: FirewallRule[];
    droplet_ids?: number[];
    tags?: string[];
    created_at?: string;
    pending_changes?: object[];
}

export async function createFireWall(blueprint: FireWall): Promise<FireWallResponse> {
    const response = await doRequest<{ firewall: FireWallResponse }>({
        method: "POST",
        url: "/firewalls",
        data: cleanPayload(blueprint)
    });
    return response.firewall;
}

export async function listFirewall(id: string): Promise<FireWallResponse> {
    return getFirewall(id);
}

export async function getFirewall(id: string): Promise<FireWallResponse> {
    const response = await doRequest<{ firewall: FireWallResponse }>({
        method: "GET",
        url: `/firewalls/${id}`
    });
    return response.firewall;
}

export async function listAllFirewalls(): Promise<FireWallResponse[]> {
    const response = await doRequest<{ firewalls: FireWallResponse[] }>({
        method: "GET",
        url: "/firewalls"
    });
    return response.firewalls;
}

export async function updateFirewall(id: string, blueprint: FireWall): Promise<FireWallResponse> {
    const response = await doRequest<{ firewall: FireWallResponse }>({
        method: "PUT",
        url: `/firewalls/${id}`,
        data: cleanPayload(blueprint)
    });
    return response.firewall;
}

export async function deleteFirewall(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/firewalls/${id}`
    });
}

export async function removeDropletsFromFirewall(id: string, dropletIds: number[]): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/firewalls/${id}/droplets`,
        data: { droplet_ids: dropletIds }
    });
}

export async function addDropletsToFirewall(id: string, dropletIds: number[]): Promise<void> {
    await doRequest<void>({
        method: "POST",
        url: `/firewalls/${id}/droplets`,
        data: { droplet_ids: dropletIds }
    });
}

export async function removeRulesFromFirewall(
    id: string,
    rules: { inbound_rules?: FirewallRule[]; outbound_rules?: FirewallRule[] }
): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/firewalls/${id}/rules`,
        data: rules
    });
}

export async function addRulesToFirewall(
    id: string,
    rules: { inbound_rules?: FirewallRule[]; outbound_rules?: FirewallRule[] }
): Promise<void> {
    await doRequest<void>({
        method: "POST",
        url: `/firewalls/${id}/rules`,
        data: rules
    });
}

export async function removeTagsFromFirewall(id: string, tags: string[]): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/firewalls/${id}/tags`,
        data: { tags }
    });
}

export async function addTagsToFirewall(id: string, tags: string[]): Promise<void> {
    await doRequest<void>({
        method: "POST",
        url: `/firewalls/${id}/tags`,
        data: { tags }
    });
}
