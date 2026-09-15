import { type CmsCollection, type CmsSnapshot, type ContentRecord } from "./types.js";
import type { CmsPersistence, CmsPersistenceKind } from "./persistence.js";
export declare class NectarineStore {
    private records;
    private adapter?;
    private hydrated;
    private hydrating?;
    private flushQueue;
    usePersistence(persistence: CmsPersistence): this;
    get persistence(): CmsPersistence | undefined;
    get persistenceKind(): CmsPersistenceKind;
    hydrate(): Promise<void>;
    flush(): Promise<void>;
    list(collection: CmsCollection): ContentRecord[];
    get(collection: CmsCollection, id: string | number): ContentRecord | undefined;
    findBySlug(collection: CmsCollection, slug: string): ContentRecord | undefined;
    upsert(record: ContentRecord): ContentRecord;
    remove(collection: CmsCollection, id: string | number): boolean;
    snapshot(): CmsSnapshot;
    replace(snapshot: Partial<CmsSnapshot>): void;
    clear(): void;
}
