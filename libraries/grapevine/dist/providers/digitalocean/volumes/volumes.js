import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export function volumeRegionSlug(volume) {
    if (!volume.region) {
        return "";
    }
    if (typeof volume.region === "string") {
        return volume.region;
    }
    return volume.region.slug ?? "";
}
export async function listVolumes() {
    return doList("/volumes", "volumes");
}
export async function getVolume(id) {
    const response = await doRequest({
        method: "GET",
        url: `/volumes/${id}`
    });
    return response.volume;
}
export async function createVolume(blueprint) {
    const response = await doRequest({
        method: "POST",
        url: "/volumes",
        data: cleanPayload(blueprint)
    });
    return response.volume;
}
export async function deleteVolume(id) {
    await doRequest({
        method: "DELETE",
        url: `/volumes/${id}`
    });
}
export async function listVolumeSnapshots(volumeId) {
    return doList(`/volumes/${volumeId}/snapshots`, "snapshots");
}
export async function createVolumeSnapshot(volumeId, name, tags) {
    const response = await doRequest({
        method: "POST",
        url: `/volumes/${volumeId}/snapshots`,
        data: cleanPayload({ name, tags })
    });
    return response.snapshot;
}
export async function getVolumeSnapshot(snapshotId) {
    const response = await doRequest({
        method: "GET",
        url: `/snapshots/${snapshotId}`
    });
    return response.snapshot;
}
export async function deleteVolumeSnapshot(snapshotId) {
    await doRequest({
        method: "DELETE",
        url: `/snapshots/${snapshotId}`
    });
}
//# sourceMappingURL=volumes.js.map