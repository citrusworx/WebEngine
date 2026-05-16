export interface DropletBlueprint {
    blueprint: {
        name: string;
        droplet: {
            name: string;
            region: string;
            size: string;
            image: string;
            ssh_keys?: string[];
            backups: boolean;
            backup_policy?: {
                name: string;
            };
            ipv6?: boolean;
            monitoring?: boolean;
            tags?: string[];
            user_data?: string;
            volumes?: string[];
            vpc_uuid?: string;
            with_droplet_agent?: boolean;
        };
    };
}
export interface Droplet {
    name: string;
    droplet: {
        name: string;
        region: string;
        size: string;
        image: string;
        ssh_keys?: string[];
        backups: boolean;
        backup_policy?: {
            name: string;
        };
        ipv6?: boolean;
        monitoring?: boolean;
        tags?: string[];
        user_data?: string;
        volumes?: string[];
        vpc_uuid?: string;
        with_droplet_agent?: boolean;
    };
}
export interface DropletResource {
    id: number | undefined;
    name: string;
    memory: number;
    vcpus?: number;
    disk?: number;
    disk_info?: object[];
    locked?: boolean;
    status: string;
    kernel?: object | null;
    created_at?: string;
    features?: string[];
    backup_ids?: number[];
    next_backup_window?: object | null;
    snapshot_ids?: number[];
    image: Record<string, unknown>;
    volume_ids?: string[];
    size: Record<string, unknown>;
    size_slug?: string;
    networks?: Record<string, unknown>;
    region?: Record<string, unknown>;
    tags?: string[];
}
export interface DropletCreateResponse {
    droplet: DropletResource;
    links: {
        actions: object[];
    };
}
export interface AllDroplets {
    per_page?: number;
    page?: number;
    tag_name?: string;
    name?: string;
    type?: string;
}
export declare function deployByBlueprint(blueprint: string): Promise<DropletResource>;
export declare function getDropletStatus(id: number): Promise<string>;
export declare function listAllDroplets(): Promise<DropletResource[]>;
export declare function getDroplet(id: number): Promise<DropletResource>;
export declare function createDroplet(droplet: Droplet): Promise<DropletResource>;
export declare function createDroplets(droplets: Droplet[]): Promise<DropletResource[]>;
export declare function deleteDropletsByTag(tag: string): Promise<{
    message: string;
}>;
export declare function NukeDroplet(id: number): Promise<{
    message: string;
}>;
export declare function NukeDropletLite(id: number, resources: {
    reserved_ips?: string[];
    volumes?: string[];
    snapshots?: string[];
    volume_snapshots?: string[];
}): Promise<{
    message: string;
}>;
export declare function deleteDroplet(id: number): Promise<{
    message: string;
}>;
export declare function listBackups(id: number): Promise<object[]>;
export declare function listBackupPolicy(id: number): Promise<object>;
export declare function listFirewalls(id: number): Promise<object[]>;
export declare function listSnapshots(id: number): Promise<object[]>;
