import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
export type WordPressTaxonomy = {
    name: string;
    slug: string;
    rest_base: string;
    rest_namespace?: string;
    hierarchical: boolean;
    description?: string;
    types?: string[];
};
export type RestBasesFromTaxonomiesOptions = {
    /**
     * Include WordPress built-in `categories` and `tags` rest bases.
     * Default is false — dedicated `Categories` / `Tags` clients exist.
     */
    includeBuiltins?: boolean;
};
export declare function normalizeWordPressTaxonomy(value: unknown): WordPressTaxonomy;
export declare function normalizeWordPressTaxonomies(value: unknown): WordPressTaxonomy[];
/**
 * Map `/wp/v2/taxonomies` JSON onto taxonomy REST bases suitable for
 * `wordpress.taxonomy()` / `transfer({ taxonomies })`.
 *
 * Built-in `categories` and `tags` rest bases are omitted by default because
 * dedicated `Categories` / `Tags` clients already exist. Pass
 * `{ includeBuiltins: true }` to keep them. Other built-in collection slugs
 * (`posts`, `pages`, `media`, …) are always skipped.
 */
export declare function restBasesFromTaxonomies(value: unknown, options?: RestBasesFromTaxonomiesOptions): string[];
export declare class WordPressTaxonomies extends WPRead {
    constructor(config?: Partial<WPCoreConfig>);
    getAll(): import("@citrusworx/seltzer").ResponseData | Promise<import("@citrusworx/seltzer").ResponseData>;
    getBySlug(slug: string): import("@citrusworx/seltzer").ResponseData | Promise<import("@citrusworx/seltzer").ResponseData>;
}
