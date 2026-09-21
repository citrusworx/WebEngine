import type { Endpoint, Route } from "@citrusworx/seltzer";
export type SearchObjectType = "post" | "term" | "post-format";
export type SearchId = number | string;
export type SearchQueryOptions = {
    type?: SearchObjectType;
    subtype?: string | readonly string[];
    page?: number;
    per_page?: number;
    exclude?: SearchId | readonly SearchId[];
    include?: SearchId | readonly SearchId[];
};
/** GET `/search/:term` → `/search?search=:term` */
export declare const searchByTerm: Route<Endpoint>;
/**
 * Last path segment is a pre-built query string (`search=kiwi&type=post`).
 * Same collection query shape as {@link createAliasedQueryRoute}.
 */
export declare const searchByQuery: Route<Endpoint>;
export declare function hasSearchOptions(options?: SearchQueryOptions): boolean;
/** Map a search term and WP REST options onto `/wp/v2/search` query params. */
export declare function buildSearchQuery(term: string, options?: SearchQueryOptions): string;
