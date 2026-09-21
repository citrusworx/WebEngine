import { asCollection, extractTextValue } from "../core/normalize.js";
import { WPRead } from "../core/WPRead.js";
import { buildSearchQuery, hasSearchOptions, searchByQuery, searchByTerm } from "./routes.js";
export { buildSearchQuery, hasSearchOptions } from "./routes.js";
function asRecord(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return {};
}
function asSearchId(value) {
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
export function normalizeSearchHit(value) {
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
export function normalizeSearchHits(value) {
    return asCollection(value)
        .map((item) => normalizeSearchHit(item))
        .filter((hit) => hit != null);
}
export class WordPressSearch extends WPRead {
    constructor(config) {
        super(config);
    }
    async query(term, options) {
        const raw = hasSearchOptions(options)
            ? await this.read(searchByQuery, { query: buildSearchQuery(term, options) })
            : await this.read(searchByTerm, { term });
        return normalizeSearchHits(raw);
    }
}
//# sourceMappingURL=search.js.map