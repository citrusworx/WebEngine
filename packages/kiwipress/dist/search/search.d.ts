import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import { type SearchQueryOptions } from "./routes.js";
export type { SearchId, SearchObjectType, SearchQueryOptions } from "./routes.js";
export { buildSearchQuery, hasSearchOptions } from "./routes.js";
/**
 * A WordPress `/wp/v2/search` hit. These are not full posts — do not treat them
 * as `ContentRecord`s. Follow up with `posts.getById` / `cpt().getById` when
 * you need the object.
 */
export type SearchHit = {
    id: number;
    title: string;
    url: string;
    type: string;
    subtype: string;
};
export declare function normalizeSearchHit(value: unknown): SearchHit | undefined;
export declare function normalizeSearchHits(value: unknown): SearchHit[];
export declare class WordPressSearch extends WPRead {
    constructor(config?: Partial<WPCoreConfig>);
    query(term: string, options?: SearchQueryOptions): Promise<SearchHit[]>;
}
