import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function createVPC(blueprint) {
    const response = await doRequest({
        method: "POST",
        url: "/vpcs",
        data: cleanPayload(blueprint)
    });
    if (!response.vpc) {
        throw new Error("Failed to create VPC: Invalid response from API");
    }
    return response.vpc;
}
export async function createPeering(vpc, peering) {
    const response = await doRequest({
        method: "POST",
        url: `/vpcs/${vpc}/peerings`,
        data: peering
    });
    return response.peering;
}
export async function listAllVPCs() {
    const response = await doRequest({
        method: "GET",
        url: "/vpcs"
    });
    return response.vpcs;
}
export async function listExistingVPC(id) {
    const response = await doRequest({
        method: "GET",
        url: `/vpcs/${id}`
    });
    return response.vpc;
}
export async function listMemberResources(vpc, query = {}) {
    const response = await doRequest({
        method: "GET",
        url: `/vpcs/${vpc}/members`,
        params: cleanPayload(query)
    });
    return response.members;
}
export async function listVPCPeerings(vpc) {
    const response = await doRequest({
        method: "GET",
        url: `/vpcs/${vpc}/peerings`
    });
    return response.peerings;
}
export async function updateVPC(vpc, blueprint) {
    const response = await doRequest({
        method: "PUT",
        url: `/vpcs/${vpc}`,
        data: cleanPayload(blueprint)
    });
    return response.vpc;
}
export async function partialUpdateVPC(vpc, blueprint) {
    const response = await doRequest({
        method: "PATCH",
        url: `/vpcs/${vpc}`,
        data: cleanPayload(blueprint)
    });
    return response.vpc;
}
/** @deprecated Use partialUpdateVPC */
export const paritalUpdateVPC = partialUpdateVPC;
export async function updateVPCPeering(vpc, peeringId, body) {
    const response = await doRequest({
        method: "PATCH",
        url: `/vpcs/${vpc}/peerings/${peeringId}`,
        data: body
    });
    return response.peering;
}
export async function deleteVPC(id) {
    await doRequest({
        method: "DELETE",
        url: `/vpcs/${id}`
    });
}
//# sourceMappingURL=vpc.js.map