import { WPRead } from "../core/WPRead";
export declare class Comments extends WPRead {
    getAll(): any;
    getById(id: string | number): any;
    getByPost(post: string | number): any;
}
