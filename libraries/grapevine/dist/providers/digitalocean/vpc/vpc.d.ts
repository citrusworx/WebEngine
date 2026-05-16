export interface VPCBlueprint {
    name: string;
    description: string;
    region: string;
    ip_range: string;
}
export interface VPCResponse {
    name: string;
    description: string;
    region: string;
    ip_range: string;
    default: boolean;
    id: string;
    urn: string;
    created_at: string;
}
export declare function createVPC(blueprint: VPCBlueprint): Promise<VPCResponse>;
export declare function createPeering(vpc: string): Promise<void>;
export declare function listAllVPCs(): Promise<void>;
export declare function listExistingVPC(): Promise<void>;
export declare function listMemberResources(vpc: string): Promise<void>;
export declare function updateVPC(vpc: string): Promise<void>;
export declare function paritalUpdateVPC(vpc: string): Promise<void>;
export declare function updateVPCPeering(): Promise<void>;
export declare function deleteVPC(id: string): Promise<void>;
