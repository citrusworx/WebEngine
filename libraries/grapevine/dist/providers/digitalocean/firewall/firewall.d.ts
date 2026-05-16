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
export declare function createFireWall(blueprint: FireWall): Promise<void>;
export declare function listFirewall(firewall: string): Promise<void>;
export declare function listAllFirewalls(): Promise<void>;
export declare function updateFirewall(firewall: string): Promise<void>;
export declare function deleteFirewall(): Promise<void>;
export declare function removeDropletsFromFirewall(): Promise<void>;
export declare function removeRulesFromFirewall(): Promise<void>;
export declare function removeTagsFromFirewall(): Promise<void>;
export declare function addDropletsToFirewall(): Promise<void>;
export declare function addRulesToFirewall(): Promise<void>;
export declare function addTagsToFirewall(): Promise<void>;
