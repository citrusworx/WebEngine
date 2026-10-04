import { doList, doRequest } from "../client.js";
import type { VolumeSnapshot } from "../volumes/volumes.js";

export type AccountSnapshot = VolumeSnapshot;

export async function listAccountSnapshots(
    resourceType?: "droplet" | "volume"
): Promise<AccountSnapshot[]> {
    return doList<AccountSnapshot>("/snapshots", "snapshots", resourceType ? { resource_type: resourceType } : undefined);
}

export async function getAccountSnapshot(snapshotId: string): Promise<AccountSnapshot> {
    const response = await doRequest<{ snapshot: AccountSnapshot }>({
        method: "GET",
        url: `/snapshots/${snapshotId}`
    });
    return response.snapshot;
}

export async function deleteAccountSnapshot(snapshotId: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/snapshots/${snapshotId}`
    });
}
