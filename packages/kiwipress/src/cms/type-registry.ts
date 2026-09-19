import {
    CMS_COLLECTIONS,
    DEFAULT_TYPE_FIELDS,
    DEFAULT_TYPE_STATUSES,
    type CollectionFieldId,
    type CollectionTypeDefinition
} from "./types.js";

export const PERSISTED_TYPES_COLLECTION = "__types";

const GATEWAY_RESERVED = ["types", "content", "cms", "health", "transfer"] as const;

const RESERVED_SLUGS = new Set<string>([
    ...CMS_COLLECTIONS,
    ...GATEWAY_RESERVED,
    PERSISTED_TYPES_COLLECTION
]);

const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,62}$/;
const STATUS_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;

export type TypeDefinitionInput = {
    slug?: unknown;
    label?: unknown;
    singular?: unknown;
    statuses?: unknown;
    fields?: unknown;
};

export function isReservedCollectionSlug(value: string): boolean {
    return RESERVED_SLUGS.has(value);
}

export function isCustomTypeSlug(value: string): boolean {
    return SLUG_PATTERN.test(value) && !isReservedCollectionSlug(value);
}

export function isCollectionSlug(value: string): boolean {
    return (CMS_COLLECTIONS as readonly string[]).includes(value) || isCustomTypeSlug(value);
}

export function isEditableGatewayCollection(value: string): boolean {
    return value === "posts" || value === "pages" || isCustomTypeSlug(value);
}

function titleCase(slug: string): string {
    return slug
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function defaultLabel(slug: string): string {
    const base = titleCase(slug);
    return base.endsWith("s") ? base : `${base}s`;
}

function defaultSingular(slug: string): string {
    return titleCase(slug);
}

function asString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeStatuses(value: unknown): string[] {
    const source = Array.isArray(value) ? value : [...DEFAULT_TYPE_STATUSES];
    const statuses = source
        .map((entry) => asString(entry).toLowerCase())
        .filter((entry) => STATUS_PATTERN.test(entry));

    return statuses.length > 0 ? [...new Set(statuses)] : [...DEFAULT_TYPE_STATUSES];
}

function normalizeFields(value: unknown): CollectionFieldId[] {
    if (!Array.isArray(value)) {
        return [...DEFAULT_TYPE_FIELDS];
    }

    const allowed = new Set<string>(DEFAULT_TYPE_FIELDS);
    const fields = value
        .filter((entry): entry is CollectionFieldId => typeof entry === "string" && allowed.has(entry));

    return fields.length > 0 ? [...new Set(fields)] : [...DEFAULT_TYPE_FIELDS];
}

export function normalizeTypeDefinition(
    input: TypeDefinitionInput,
    existing?: CollectionTypeDefinition
): CollectionTypeDefinition {
    const slug = asString(input.slug || existing?.slug).toLowerCase();

    if (!isCustomTypeSlug(slug)) {
        throw new Error(
            existing
                ? `Invalid custom type slug "${slug || "(empty)"}".`
                : "Type slug must be a lowercase letter, then letters, numbers, or hyphens, and cannot reuse a built-in collection."
        );
    }

    if (existing && asString(input.slug) && slug !== existing.slug) {
        throw new Error("Type slug cannot be changed.");
    }

    const now = new Date().toISOString();

    return {
        slug,
        label: asString(input.label) || existing?.label || defaultLabel(slug),
        singular: asString(input.singular) || existing?.singular || defaultSingular(slug),
        statuses: normalizeStatuses(input.statuses ?? existing?.statuses),
        fields: normalizeFields(input.fields ?? existing?.fields),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
    };
}

export function asTypeDefinition(value: unknown): CollectionTypeDefinition | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    try {
        const record = value as TypeDefinitionInput & { createdAt?: unknown; updatedAt?: unknown };
        const normalized = normalizeTypeDefinition(record);
        return {
            ...normalized,
            createdAt: typeof record.createdAt === "string" ? record.createdAt : normalized.createdAt,
            updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : normalized.updatedAt
        };
    } catch {
        return null;
    }
}
