export interface ReservedIpRegion {
    slug: string;
    name?: string;
}
/** Reserved IP (the current name for a floating IP). There is no name field. */
export interface ReservedIp {
    ip: string;
    region: ReservedIpRegion | string;
    droplet?: {
        id?: number;
        name?: string;
    } | null;
    locked?: boolean;
    project_id?: string;
}
export interface ReservedIpCreate {
    region?: string;
    droplet_id?: number;
}
export declare function reservedIpRegionSlug(reserved: {
    region?: ReservedIpRegion | string;
}): string;
export declare function listReservedIps(): Promise<ReservedIp[]>;
export declare function getReservedIp(ip: string): Promise<ReservedIp>;
export declare function createReservedIp(input: ReservedIpCreate): Promise<ReservedIp>;
export declare function deleteReservedIp(ip: string): Promise<void>;
