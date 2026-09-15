import type { CmsCollection, ContentRecord } from "./types.js";
export declare class NectarineStore {
    private records;
    list(collection: CmsCollection): ContentRecord[];
    get(collection: CmsCollection, id: string | number): ContentRecord | undefined;
    findBySlug(collection: CmsCollection, slug: string): ContentRecord | undefined;
    upsert(record: ContentRecord): ContentRecord;
    remove(collection: CmsCollection, id: string | number): boolean;
    snapshot(): Record<CmsCollection, ContentRecord[]>;
    replace(snapshot: Partial<Record<CmsCollection, ContentRecord[]>>): void;
    clear(): void;
}
