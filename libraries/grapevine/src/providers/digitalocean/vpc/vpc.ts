import { client } from "../../../infrastructure/util/utilities.js";

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

// Create a VPC
// 
// 
export async function createVPC(blueprint: VPCBlueprint){
    const response = await client.post<{ vpc: VPCResponse }>("/vpcs", blueprint);

    if(!response.data?.vpc){
        throw new Error("Failed to create VPC: Invalid response from API")
    }

    return response.data.vpc;
}

export async function createPeering(vpc: string){}

// List VPC
// 
// 
export async function listAllVPCs(){}

export async function listExistingVPC(){}

export async function listMemberResources(vpc: string){}

// Update VPC
// 
// 
export async function updateVPC(vpc: string){}

export async function paritalUpdateVPC(vpc: string){}

export async function updateVPCPeering(){}

// Delete a VPC
// 
// 
export async function deleteVPC(id: string){
    await client.delete(`/vpcs/${id}`);
}