export interface VPCBlueprint {
    name: string;
    description?: string;
    region: string;
    ip_range?: string;
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
export interface VPCMember {
    urn: string;
    name?: string;
    created_at?: string;
}
export interface VPCPeering {
    id: string;
    name: string;
    vpc_ids: string[];
    created_at: string;
    status?: string;
}
export interface VPCPeeringRequest {
    name: string;
    vpc_id: string;
}
export declare function createVPC(blueprint: VPCBlueprint): Promise<VPCResponse>;
export declare function createPeering(vpc: string, peering: VPCPeeringRequest): Promise<VPCPeering>;
export declare function listAllVPCs(): Promise<VPCResponse[]>;
export declare function listExistingVPC(id: string): Promise<VPCResponse>;
export declare function listMemberResources(vpc: string, query?: {
    resource_type?: string;
    per_page?: number;
    page?: number;
}): Promise<VPCMember[]>;
export declare function listVPCPeerings(vpc: string): Promise<VPCPeering[]>;
export declare function updateVPC(vpc: string, blueprint: Partial<VPCBlueprint> & {
    default?: boolean;
}): Promise<VPCResponse>;
export declare function partialUpdateVPC(vpc: string, blueprint: Partial<VPCBlueprint> & {
    default?: boolean;
}): Promise<VPCResponse>;
/** @deprecated Use partialUpdateVPC */
export declare const paritalUpdateVPC: typeof partialUpdateVPC;
export declare function updateVPCPeering(vpc: string, peeringId: string, body: {
    name: string;
}): Promise<VPCPeering>;
export declare function deleteVPC(id: string): Promise<void>;
