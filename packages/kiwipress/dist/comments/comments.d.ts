import { WPRead } from "../core/WPRead.js";
export declare class Comments extends WPRead {
    getAll(): any;
    getById(id: string | number): any;
    getByPost(post: string | number): any;
}
