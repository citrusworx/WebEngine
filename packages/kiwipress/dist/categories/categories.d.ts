import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import type { WordPressPayload } from "../types/api.js";
export declare class Categories extends WPRead {
    private readonly creator;
    private readonly updater;
    private readonly deleter;
    constructor(config?: Partial<WPCoreConfig>);
    getAll(): import("@citrusworx/seltzer").ResponseData | Promise<import("@citrusworx/seltzer").ResponseData>;
    getById(id: string | number): import("@citrusworx/seltzer").ResponseData | Promise<import("@citrusworx/seltzer").ResponseData>;
    getBySlug(slug: string): import("@citrusworx/seltzer").ResponseData | Promise<import("@citrusworx/seltzer").ResponseData>;
    create(data: WordPressPayload): Promise<any>;
    update(id: string | number, data: WordPressPayload): Promise<any>;
    delete(id: string | number): Promise<any>;
}
