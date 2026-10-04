import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export function reservedIpRegionSlug(reserved) {
    if (!reserved.region) {
        return "";
    }
    if (typeof reserved.region === "string") {
        return reserved.region;
    }
    return reserved.region.slug ?? "";
}
export async function listReservedIps() {
    return doList("/reserved_ips", "reserved_ips");
}
export async function getReservedIp(ip) {
    const response = await doRequest({
        method: "GET",
        url: `/reserved_ips/${encodeURIComponent(ip)}`
    });
    return response.reserved_ip;
}
export async function createReservedIp(input) {
    const hasRegion = Boolean(input.region);
    const hasDroplet = input.droplet_id !== undefined;
    if (hasRegion === hasDroplet) {
        throw new Error("createReservedIp requires exactly one of region or droplet_id");
    }
    const response = await doRequest({
        method: "POST",
        url: "/reserved_ips",
        data: cleanPayload({
            region: input.region,
            droplet_id: input.droplet_id
        })
    });
    return response.reserved_ip;
}
export async function deleteReservedIp(ip) {
    await doRequest({
        method: "DELETE",
        url: `/reserved_ips/${encodeURIComponent(ip)}`
    });
}
//# sourceMappingURL=reserved-ips.js.map