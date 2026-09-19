import { type CmsCollection, type CmsDocument, type CmsSnapshot } from "./types.js";
export type CmsPersistenceKind = "file" | "postgres" | "memory" | "custom";
export interface CmsPersistence {
    readonly kind?: CmsPersistenceKind;
    load(): Promise<CmsDocument | CmsSnapshot | null>;
    save(document: CmsDocument): Promise<void>;
}
export declare function emptySnapshot(): CmsSnapshot;
export declare function emptyDocument(): CmsDocument;
export declare function isCmsCollection(value: string): value is CmsCollection;
export declare function isCmsDocument(value: unknown): value is CmsDocument;
export declare function normalizeSnapshot(value: unknown): CmsSnapshot;
export declare function normalizeDocument(value: unknown): CmsDocument;
export declare function coerceDocument(value: CmsDocument | CmsSnapshot | null | undefined): CmsDocument | null;
