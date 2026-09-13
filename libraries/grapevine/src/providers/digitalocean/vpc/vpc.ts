import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

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

export async function createVPC(blueprint: VPCBlueprint): Promise<VPCResponse> {
    const response = await doRequest<{ vpc: VPCResponse }>({
        method: "POST",
        url: "/vpcs",
        data: cleanPayload(blueprint)
    });

    if (!response.vpc) {
        throw new Error("Failed to create VPC: Invalid response from API");
    }

    return response.vpc;
}

export async function createPeering(vpc: string, peering: VPCPeeringRequest): Promise<VPCPeering> {
    const response = await doRequest<{ peering: VPCPeering }>({
        method: "POST",
        url: `/vpcs/${vpc}/peerings`,
        data: peering
    });
    return response.peering;
}

export async function listAllVPCs(): Promise<VPCResponse[]> {
    const response = await doRequest<{ vpcs: VPCResponse[] }>({
        method: "GET",
        url: "/vpcs"
    });
    return response.vpcs;
}

export async function listExistingVPC(id: string): Promise<VPCResponse> {
    const response = await doRequest<{ vpc: VPCResponse }>({
        method: "GET",
        url: `/vpcs/${id}`
    });
    return response.vpc;
}

export async function listMemberResources(
    vpc: string,
    query: { resource_type?: string; per_page?: number; page?: number } = {}
): Promise<VPCMember[]> {
    const response = await doRequest<{ members: VPCMember[] }>({
        method: "GET",
        url: `/vpcs/${vpc}/members`,
        params: cleanPayload(query)
    });
    return response.members;
}

export async function listVPCPeerings(vpc: string): Promise<VPCPeering[]> {
    const response = await doRequest<{ peerings: VPCPeering[] }>({
        method: "GET",
        url: `/vpcs/${vpc}/peerings`
    });
    return response.peerings;
}

export async function updateVPC(
    vpc: string,
    blueprint: Partial<VPCBlueprint> & { default?: boolean }
): Promise<VPCResponse> {
    const response = await doRequest<{ vpc: VPCResponse }>({
        method: "PUT",
        url: `/vpcs/${vpc}`,
        data: cleanPayload(blueprint)
    });
    return response.vpc;
}

export async function partialUpdateVPC(
    vpc: string,
    blueprint: Partial<VPCBlueprint> & { default?: boolean }
): Promise<VPCResponse> {
    const response = await doRequest<{ vpc: VPCResponse }>({
        method: "PATCH",
        url: `/vpcs/${vpc}`,
        data: cleanPayload(blueprint)
    });
    return response.vpc;
}

/** @deprecated Use partialUpdateVPC */
export const paritalUpdateVPC = partialUpdateVPC;

export async function updateVPCPeering(
    vpc: string,
    peeringId: string,
    body: { name: string }
): Promise<VPCPeering> {
    const response = await doRequest<{ peering: VPCPeering }>({
        method: "PATCH",
        url: `/vpcs/${vpc}/peerings/${peeringId}`,
        data: body
    });
    return response.peering;
}

export async function deleteVPC(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/vpcs/${id}`
    });
}
