import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

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

export function volumeRegionSlug(volume: { region?: VolumeRegion | string }): string {
    if (!volume.region) {
        return "";
    }
    if (typeof volume.region === "string") {
        return volume.region;
    }
    return volume.region.slug ?? "";
}

export async function listVolumes(): Promise<Volume[]> {
    return doList<Volume>("/volumes", "volumes");
}

export async function getVolume(id: string): Promise<Volume> {
    const response = await doRequest<{ volume: Volume }>({
        method: "GET",
        url: `/volumes/${id}`
    });
    return response.volume;
}

export async function createVolume(blueprint: VolumeBlueprint): Promise<Volume> {
    const response = await doRequest<{ volume: Volume }>({
        method: "POST",
        url: "/volumes",
        data: cleanPayload(blueprint)
    });
    return response.volume;
}

export async function deleteVolume(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/volumes/${id}`
    });
}

export async function listVolumeSnapshots(volumeId: string): Promise<VolumeSnapshot[]> {
    return doList<VolumeSnapshot>(`/volumes/${volumeId}/snapshots`, "snapshots");
}

export async function createVolumeSnapshot(volumeId: string, name: string, tags?: string[]): Promise<VolumeSnapshot> {
    const response = await doRequest<{ snapshot: VolumeSnapshot }>({
        method: "POST",
        url: `/volumes/${volumeId}/snapshots`,
        data: cleanPayload({ name, tags })
    });
    return response.snapshot;
}

export async function getVolumeSnapshot(snapshotId: string): Promise<VolumeSnapshot> {
    const response = await doRequest<{ snapshot: VolumeSnapshot }>({
        method: "GET",
        url: `/snapshots/${snapshotId}`
    });
    return response.snapshot;
}

export async function deleteVolumeSnapshot(snapshotId: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/snapshots/${snapshotId}`
    });
}
