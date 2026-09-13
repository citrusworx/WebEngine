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
export declare function createFireWall(blueprint: FireWall): Promise<FireWallResponse>;
export declare function listFirewall(id: string): Promise<FireWallResponse>;
export declare function getFirewall(id: string): Promise<FireWallResponse>;
export declare function listAllFirewalls(): Promise<FireWallResponse[]>;
export declare function updateFirewall(id: string, blueprint: FireWall): Promise<FireWallResponse>;
export declare function deleteFirewall(id: string): Promise<void>;
export declare function removeDropletsFromFirewall(id: string, dropletIds: number[]): Promise<void>;
export declare function addDropletsToFirewall(id: string, dropletIds: number[]): Promise<void>;
export declare function removeRulesFromFirewall(id: string, rules: {
    inbound_rules?: FirewallRule[];
    outbound_rules?: FirewallRule[];
}): Promise<void>;
export declare function addRulesToFirewall(id: string, rules: {
    inbound_rules?: FirewallRule[];
    outbound_rules?: FirewallRule[];
}): Promise<void>;
export declare function removeTagsFromFirewall(id: string, tags: string[]): Promise<void>;
export declare function addTagsToFirewall(id: string, tags: string[]): Promise<void>;
