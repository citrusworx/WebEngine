import { isCmsCollection } from "../cms/persistence.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";
import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import { getAllTypes, getTypeBySlug } from "./routes.js";

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

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}

export function normalizeWordPressType(value: unknown): WordPressType {
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
        has_archive:
            typeof item.has_archive === "boolean" || typeof item.has_archive === "string"
                ? item.has_archive
                : undefined,
        taxonomies: Array.isArray(item.taxonomies)
            ? item.taxonomies.filter((entry): entry is string => typeof entry === "string")
            : undefined
    };
}

export function normalizeWordPressTypes(value: unknown): WordPressType[] {
    const items = Array.isArray(value) ? value : Object.values(asRecord(value));
    return items
        .map((item) => normalizeWordPressType(item))
        .filter((item) => item.slug.length > 0 || item.rest_base.length > 0);
}

/**
 * Map `/wp/v2/types` JSON onto CPT REST bases suitable for `wordpress.cpt()` / `transfer({ cpts })`.
 * Built-in collections (`posts`, `pages`, `media`, …) are omitted.
 */
export function restBasesFromTypes(value: unknown): string[] {
    const restBases: string[] = [];
    const seen = new Set<string>();

    for (const type of normalizeWordPressTypes(value)) {
        if (!type.rest_base) {
            continue;
        }

        let restBase: string;
        try {
            restBase = sanitizeRestBase(type.rest_base);
        } catch {
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
    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
    }

    getAll() {
        return this.read(getAllTypes);
    }

    getBySlug(slug: string) {
        return this.read(getTypeBySlug, { slug: sanitizeRestBase(slug) });
    }
}
