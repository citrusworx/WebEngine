import { client } from "../../../infrastructure/util/utilities.js";
// Create a VPC
// 
// 
export async function createVPC(blueprint) {
    const response = await client.post("/vpcs", blueprint);
    if (!response.data?.vpc) {
        throw new Error("Failed to create VPC: Invalid response from API");
    }
    return response.data.vpc;
}
export async function createPeering(vpc) { }
// List VPC
// 
// 
export async function listAllVPCs() { }
export async function listExistingVPC() { }
export async function listMemberResources(vpc) { }
// Update VPC
// 
// 
export async function updateVPC(vpc) { }
export async function paritalUpdateVPC(vpc) { }
export async function updateVPCPeering() { }
// Delete a VPC
// 
// 
export async function deleteVPC(id) {
    await client.delete(`/vpcs/${id}`);
}
//# sourceMappingURL=vpc.js.map