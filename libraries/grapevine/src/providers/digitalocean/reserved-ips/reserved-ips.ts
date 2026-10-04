import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export interface ReservedIpRegion {
    slug: string;
    name?: string;
}

/** Reserved IP (the current name for a floating IP). There is no name field. */
export interface ReservedIp {
    ip: string;
    region: ReservedIpRegion | string;
    droplet?: { id?: number; name?: string } | null;
    locked?: boolean;
    project_id?: string;
}

export interface ReservedIpCreate {
    region?: string;
    droplet_id?: number;
}

export function reservedIpRegionSlug(reserved: { region?: ReservedIpRegion | string }): string {
    if (!reserved.region) {
        return "";
    }
    if (typeof reserved.region === "string") {
        return reserved.region;
    }
    return reserved.region.slug ?? "";
}

export async function listReservedIps(): Promise<ReservedIp[]> {
    return doList<ReservedIp>("/reserved_ips", "reserved_ips");
}

export async function getReservedIp(ip: string): Promise<ReservedIp> {
    const response = await doRequest<{ reserved_ip: ReservedIp }>({
        method: "GET",
        url: `/reserved_ips/${encodeURIComponent(ip)}`
    });
    return response.reserved_ip;
}

export async function createReservedIp(input: ReservedIpCreate): Promise<ReservedIp> {
    const hasRegion = Boolean(input.region);
    const hasDroplet = input.droplet_id !== undefined;
    if (hasRegion === hasDroplet) {
        throw new Error("createReservedIp requires exactly one of region or droplet_id");
    }
    const response = await doRequest<{ reserved_ip: ReservedIp }>({
        method: "POST",
        url: "/reserved_ips",
        data: cleanPayload({
            region: input.region,
            droplet_id: input.droplet_id
        })
    });
    return response.reserved_ip;
}

export async function deleteReservedIp(ip: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/reserved_ips/${encodeURIComponent(ip)}`
    });
}
