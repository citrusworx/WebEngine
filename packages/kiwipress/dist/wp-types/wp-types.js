import { isCmsCollection } from "../cms/persistence.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";
import { WPRead } from "../core/WPRead.js";
import { getAllTypes, getTypeBySlug } from "./routes.js";
function asRecord(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return {};
}
export function normalizeWordPressType(value) {
    const item = asRecord(value);
    const slug = typeof item.slug === "string" ? item.slug : "";
    const rest_base = typeof item.rest_base === "string" && item.rest_base ? item.rest_base : slug;
    return {
        name: typeof item.name === "string" ? item.name : slug,
        slug,
        rest_base,
        rest_namespace: typeof item.rest_namespace === "string" ? item.rest_namespace : undefined,
        hierarchical: Boolean(item.hierarchical),
        description: typeof item.description === "string" ? item.description : undefined,
        has_archive: typeof item.has_archive === "boolean" || typeof item.has_archive === "string"
            ? item.has_archive
            : undefined,
        taxonomies: Array.isArray(item.taxonomies)
            ? item.taxonomies.filter((entry) => typeof entry === "string")
            : undefined
    };
}
export function normalizeWordPressTypes(value) {
    const items = Array.isArray(value) ? value : Object.values(asRecord(value));
    return items
        .map((item) => normalizeWordPressType(item))
        .filter((item) => item.slug.length > 0 || item.rest_base.length > 0);
}
/**
 * Map `/wp/v2/types` JSON onto CPT REST bases suitable for `wordpress.cpt()` / `transfer({ cpts })`.
 * Built-in collections (`posts`, `pages`, `media`, …) are omitted.
 */
export function restBasesFromTypes(value) {
    const restBases = [];
    const seen = new Set();
    for (const type of normalizeWordPressTypes(value)) {
        if (!type.rest_base) {
            continue;
        }
        let restBase;
        try {
            restBase = sanitizeRestBase(type.rest_base);
        }
        catch {
            continue;
        }
        if (isCmsCollection(restBase.toLowerCase()) || seen.has(restBase)) {
            continue;
        }
        seen.add(restBase);
        restBases.push(restBase);
    }
    return restBases;
}
export class WordPressTypes extends WPRead {
    constructor(config) {
        super(config);
    }
    getAll() {
        return this.read(getAllTypes);
    }
    getBySlug(slug) {
        return this.read(getTypeBySlug, { slug: sanitizeRestBase(slug) });
    }
}
//# sourceMappingURL=wp-types.js.map