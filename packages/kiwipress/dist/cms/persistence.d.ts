import { type CmsCollection, type CmsSnapshot } from "./types.js";
export type CmsPersistenceKind = "file" | "postgres" | "memory" | "custom";
export interface CmsPersistence {
    readonly kind?: CmsPersistenceKind;
    load(): Promise<CmsSnapshot | null>;
    save(snapshot: CmsSnapshot): Promise<void>;
}
export declare function emptySnapshot(): CmsSnapshot;
export declare function isCmsCollection(value: string): value is CmsCollection;
export declare function normalizeSnapshot(value: unknown): CmsSnapshot;
