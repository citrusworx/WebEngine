import { asCollection, extractTextValue } from "../core/normalize.js";
import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import {
    buildSearchQuery,
    hasSearchOptions,
    searchByQuery,
    searchByTerm,
    type SearchQueryOptions
} from "./routes.js";

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

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}

function asSearchId(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return undefined;
}

export function normalizeSearchHit(value: unknown): SearchHit | undefined {
    const item = asRecord(value);
    const id = asSearchId(item.id);

    if (id == null) {
        return undefined;
    }

    return {
        id,
        title: extractTextValue(item.title),
        url: typeof item.url === "string" ? item.url : "",
        type: typeof item.type === "string" ? item.type : "",
        subtype: typeof item.subtype === "string" ? item.subtype : ""
    };
}

export function normalizeSearchHits(value: unknown): SearchHit[] {
    return asCollection(value)
        .map((item) => normalizeSearchHit(item))
        .filter((hit): hit is SearchHit => hit != null);
}

export class WordPressSearch extends WPRead {
    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
    }

    async query(term: string, options?: SearchQueryOptions): Promise<SearchHit[]> {
        const raw = hasSearchOptions(options)
            ? await this.read(searchByQuery, { query: buildSearchQuery(term, options) })
            : await this.read(searchByTerm, { term });

        return normalizeSearchHits(raw);
    }
}
