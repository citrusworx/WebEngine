import { WPRead } from "../core/WPRead.js";
import type { WordPressPayload } from "../types/api.js";
export declare class Pages extends WPRead {
    getAll(): any;
    getById(id: string | number): any;
    getByCategory(category: string): any;
    getBySlug(slug: string): any;
    getByAuthor(author: string): any;
    getByTag(tag: string): any;
    create(data: WordPressPayload): Promise<any>;
    update(id: string | number, data: WordPressPayload): Promise<any>;
    delete(id: string | number): Promise<any>;
}
