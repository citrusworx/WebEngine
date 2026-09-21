import { isCmsCollection } from "../cms/persistence.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";
import { WPRead } from "../core/WPRead.js";
import { getAllTaxonomies, getTaxonomyBySlug } from "./routes.js";
const BUILTIN_TAXONOMY_REST_BASES = new Set(["categories", "tags"]);
function asRecord(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return {};
}
export function normalizeWordPressTaxonomy(value) {
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
        types: Array.isArray(item.types)
            ? item.types.filter((entry) => typeof entry === "string")
            : undefined
    };
}
export function normalizeWordPressTaxonomies(value) {
    const items = Array.isArray(value) ? value : Object.values(asRecord(value));
    return items
        .map((item) => normalizeWordPressTaxonomy(item))
        .filter((item) => item.slug.length > 0 || item.rest_base.length > 0);
}
function skipTaxonomyRestBase(restBase, includeBuiltins) {
    const collection = restBase.toLowerCase();
    if (BUILTIN_TAXONOMY_REST_BASES.has(collection)) {
        return !includeBuiltins;
    }
    return isCmsCollection(collection);
}
/**
 * Map `/wp/v2/taxonomies` JSON onto taxonomy REST bases suitable for
 * `wordpress.taxonomy()` / `transfer({ taxonomies })`.
 *
 * Built-in `categories` and `tags` rest bases are omitted by default because
 * dedicated `Categories` / `Tags` clients already exist. Pass
 * `{ includeBuiltins: true }` to keep them. Other built-in collection slugs
 * (`posts`, `pages`, `media`, …) are always skipped.
 */
export function restBasesFromTaxonomies(value, options) {
    const includeBuiltins = Boolean(options?.includeBuiltins);
    const restBases = [];
    const seen = new Set();
    for (const taxonomy of normalizeWordPressTaxonomies(value)) {
        if (!taxonomy.rest_base) {
            continue;
        }
        let restBase;
        try {
            restBase = sanitizeRestBase(taxonomy.rest_base);
        }
        catch {
            continue;
        }
        if (skipTaxonomyRestBase(restBase, includeBuiltins) || seen.has(restBase)) {
            continue;
        }
        seen.add(restBase);
        restBases.push(restBase);
    }
    return restBases;
}
export class WordPressTaxonomies extends WPRead {
    constructor(config) {
        super(config);
    }
    getAll() {
        return this.read(getAllTaxonomies);
    }
    getBySlug(slug) {
        return this.read(getTaxonomyBySlug, { slug: sanitizeRestBase(slug) });
    }
}
//# sourceMappingURL=wp-taxonomies.js.map