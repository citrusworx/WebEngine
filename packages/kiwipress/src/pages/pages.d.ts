import { WPRead } from "../core/WPRead";
import type { WPCoreConfig } from "../core/WPCore";
import type { WordPressPayload } from "../types/api";
export declare class Pages extends WPRead {
    private readonly creator;
    constructor(config?: Partial<WPCoreConfig>);
    getAll(): any;
    getById(id: string | number): any;
    getByCategory(category: string | number): any;
    getBySlug(slug: string): any;
    getByAuthor(author: string | number): any;
    getByTag(tag: string | number): any;
    create(data: WordPressPayload): any;
    update(id: string | number, data: WordPressPayload): any;
    delete(id: string | number): any;
}
