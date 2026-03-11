import { client } from "@citrusworx/grapevine/infrastructure/util/utilities.js";

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

export async function createVPC(blueprint: VPCBlueprint){
    const response = await client.post<{ vpc: VPCResponse }>("/vpcs", blueprint);

    if(!response.data?.vpc){
        throw new Error("Failed to create VPC: Invalid response from API")
    }

    return response.data.vpc;
}

export async function deleteVPC(id: string){
    await client.delete(`/vpcs/${id}`);
}