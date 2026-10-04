export interface VolumeRegion {
    slug: string;
    name?: string;
    available?: boolean;
}
export interface VolumeBlueprint {
    name: string;
    region: string;
    size_gigabytes: number;
    description?: string;
    filesystem_type?: "ext4" | "xfs" | string;
    filesystem_label?: string;
    tags?: string[];
}
export interface Volume {
    id: string;
    name: string;
    region: VolumeRegion | string;
    size_gigabytes: number;
    description?: string;
    droplet_ids?: number[];
    filesystem_type?: string;
    filesystem_label?: string;
    tags?: string[];
    created_at?: string;
}
export interface VolumeSnapshot {
    id: string;
    name: string;
    regions?: string[];
    created_at?: string;
    resource_id?: string;
    resource_type?: string;
    min_disk_size?: number;
    size_gigabytes?: number;
    tags?: string[];
}
export declare function volumeRegionSlug(volume: {
    region?: VolumeRegion | string;
}): string;
export declare function listVolumes(): Promise<Volume[]>;
export declare function getVolume(id: string): Promise<Volume>;
export declare function createVolume(blueprint: VolumeBlueprint): Promise<Volume>;
export declare function deleteVolume(id: string): Promise<void>;
export declare function listVolumeSnapshots(volumeId: string): Promise<VolumeSnapshot[]>;
export declare function createVolumeSnapshot(volumeId: string, name: string, tags?: string[]): Promise<VolumeSnapshot>;
export declare function getVolumeSnapshot(snapshotId: string): Promise<VolumeSnapshot>;
export declare function deleteVolumeSnapshot(snapshotId: string): Promise<void>;
