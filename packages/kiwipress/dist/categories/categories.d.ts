import { WPRead } from "../core/WPRead.js";
export declare class Categories extends WPRead {
    getAll(): any;
    getById(id: string | number): any;
    getBySlug(slug: string): any;
}
