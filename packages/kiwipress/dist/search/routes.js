import { buildCollectionQueryEndpoint, createAliasedQueryRoute, getLastParam, requestWordPress } from "../core/route-utils.js";
const routes = {
    searchByTerm: {
        method: "GET",
        endpoint: "/search/:term"
    },
    searchByQuery: {
        method: "GET",
        endpoint: "/search/:query"
    }
};
/** GET `/search/:term` → `/search?search=:term` */
export const searchByTerm = createAliasedQueryRoute(routes.searchByTerm, "search", "search");
/**
 * Last path segment is a pre-built query string (`search=kiwi&type=post`).
 * Same collection query shape as {@link createAliasedQueryRoute}.
 */
export const searchByQuery = {
    method: routes.searchByQuery.method,
    path: routes.searchByQuery.endpoint,
    handler: async (ctx) => requestWordPress({
        ...ctx,
        endpoint: buildCollectionQueryEndpoint(ctx, "search", getLastParam(ctx))
    })
};
function asList(value) {
    if (value == null) {
        return [];
    }
    const items = Array.isArray(value) ? value : [value];
    return items.map((item) => String(item).trim()).filter((item) => item.length > 0);
}
export function hasSearchOptions(options) {
    if (!options) {
        return false;
    }
    return (options.type != null ||
        options.subtype != null ||
        options.page != null ||
        options.per_page != null ||
        options.exclude != null ||
        options.include != null);
}
/** Map a search term and WP REST options onto `/wp/v2/search` query params. */
export function buildSearchQuery(term, options) {
    const params = new URLSearchParams();
    params.set("search", term);
    if (options?.type) {
        params.set("type", options.type);
    }
    const subtypes = asList(options?.subtype);
    if (subtypes.length > 0) {
        params.set("subtype", subtypes.join(","));
    }
    if (options?.page != null) {
        params.set("page", String(options.page));
    }
    if (options?.per_page != null) {
        params.set("per_page", String(options.per_page));
    }
    const exclude = asList(options?.exclude);
    if (exclude.length > 0) {
        params.set("exclude", exclude.join(","));
    }
    const include = asList(options?.include);
    if (include.length > 0) {
        params.set("include", include.join(","));
    }
    return params.toString();
}
//# sourceMappingURL=routes.js.map