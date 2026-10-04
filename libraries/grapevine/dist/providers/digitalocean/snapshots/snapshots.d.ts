import type { VolumeSnapshot } from "../volumes/volumes.js";
export type AccountSnapshot = VolumeSnapshot;
export declare function listAccountSnapshots(resourceType?: "droplet" | "volume"): Promise<AccountSnapshot[]>;
export declare function getAccountSnapshot(snapshotId: string): Promise<AccountSnapshot>;
export declare function deleteAccountSnapshot(snapshotId: string): Promise<void>;
