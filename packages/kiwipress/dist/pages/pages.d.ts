import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import type { WordPressPayload } from "../types/api.js";
export declare class Pages extends WPRead {
    private readonly creator;
    private readonly updater;
    constructor(config?: Partial<WPCoreConfig>);
    getAll(): any;
    getById(id: string | number): any;
    getByCategory(category: string | number): any;
    getBySlug(slug: string): any;
    getByAuthor(author: string | number): any;
    getByTag(tag: string | number): any;
    create(data: WordPressPayload): Promise<any>;
    update(id: string | number, data: WordPressPayload): Promise<any>;
    delete(id: string | number): Promise<any>;
}
