import type { WordPressPayload } from "../types/api.js";
import type { CmsCollection, ContentRecord } from "./types.js";
import { NectarineStore } from "./store.js";
export declare class NativeCollection {
    private readonly store;
    private readonly collection;
    constructor(store: NectarineStore, collection: CmsCollection);
    getAll(): Promise<ContentRecord[]>;
    getById(id: string | number): Promise<ContentRecord | undefined>;
    getBySlug(slug: string): Promise<ContentRecord | undefined>;
    create(data: WordPressPayload | Partial<ContentRecord>): Promise<ContentRecord>;
    update(id: string | number, data: WordPressPayload | Partial<ContentRecord>): Promise<ContentRecord>;
    delete(id: string | number): Promise<boolean>;
}
export type NativeCms = {
    posts: NativeCollection;
    pages: NativeCollection;
    users: NativeCollection;
    categories: NativeCollection;
    tags: NativeCollection;
    comments: NativeCollection;
};
export declare function createNativeCms(store: NectarineStore): NativeCms;
