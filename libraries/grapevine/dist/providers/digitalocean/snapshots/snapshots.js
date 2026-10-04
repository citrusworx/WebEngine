import { doList, doRequest } from "../client.js";
export async function listAccountSnapshots(resourceType) {
    return doList("/snapshots", "snapshots", resourceType ? { resource_type: resourceType } : undefined);
}
export async function getAccountSnapshot(snapshotId) {
    const response = await doRequest({
        method: "GET",
        url: `/snapshots/${snapshotId}`
    });
    return response.snapshot;
}
export async function deleteAccountSnapshot(snapshotId) {
    await doRequest({
        method: "DELETE",
        url: `/snapshots/${snapshotId}`
    });
}
//# sourceMappingURL=snapshots.js.map