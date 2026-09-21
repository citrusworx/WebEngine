import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
export type WordPressType = {
    name: string;
    slug: string;
    rest_base: string;
    rest_namespace?: string;
    hierarchical: boolean;
    description?: string;
    has_archive?: boolean | string;
    taxonomies?: string[];
};
export declare function normalizeWordPressType(value: unknown): WordPressType;
export declare function normalizeWordPressTypes(value: unknown): WordPressType[];
/**
 * Map `/wp/v2/types` JSON onto CPT REST bases suitable for `wordpress.cpt()` / `transfer({ cpts })`.
 * Built-in collections (`posts`, `pages`, `media`, …) are omitted.
 */
export declare function restBasesFromTypes(value: unknown): string[];
export declare class WordPressTypes extends WPRead {
    constructor(config?: Partial<WPCoreConfig>);
    getAll(): import("@citrusworx/seltzer").ResponseData | Promise<import("@citrusworx/seltzer").ResponseData>;
    getBySlug(slug: string): import("@citrusworx/seltzer").ResponseData | Promise<import("@citrusworx/seltzer").ResponseData>;
}
