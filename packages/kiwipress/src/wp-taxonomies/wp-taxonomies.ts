import { isCmsCollection } from "../cms/persistence.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";
import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import { getAllTaxonomies, getTaxonomyBySlug } from "./routes.js";

const BUILTIN_TAXONOMY_REST_BASES = new Set(["categories", "tags"]);

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

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}

export function normalizeWordPressTaxonomy(value: unknown): WordPressTaxonomy {
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
            ? item.types.filter((entry): entry is string => typeof entry === "string")
            : undefined
    };
}

export function normalizeWordPressTaxonomies(value: unknown): WordPressTaxonomy[] {
    const items = Array.isArray(value) ? value : Object.values(asRecord(value));
    return items
        .map((item) => normalizeWordPressTaxonomy(item))
        .filter((item) => item.slug.length > 0 || item.rest_base.length > 0);
}

function skipTaxonomyRestBase(restBase: string, includeBuiltins: boolean): boolean {
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
export function restBasesFromTaxonomies(
    value: unknown,
    options?: RestBasesFromTaxonomiesOptions
): string[] {
    const includeBuiltins = Boolean(options?.includeBuiltins);
    const restBases: string[] = [];
    const seen = new Set<string>();

    for (const taxonomy of normalizeWordPressTaxonomies(value)) {
        if (!taxonomy.rest_base) {
            continue;
        }

        let restBase: string;
        try {
            restBase = sanitizeRestBase(taxonomy.rest_base);
        } catch {
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
    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
    }

    getAll() {
        return this.read(getAllTaxonomies);
    }

    getBySlug(slug: string) {
        return this.read(getTaxonomyBySlug, { slug: sanitizeRestBase(slug) });
    }
}
