export type TypeDefinition = {
    slug: string;
    label: string;
    singular: string;
    statuses: string[];
    fields: string[];
    createdAt?: string;
    updatedAt?: string;
};

export type TypePayload = {
    slug: string;
    label: string;
    singular: string;
    statuses?: string[];
};

const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,62}$/;

export const DEFAULT_TYPE_STATUSES = ["draft", "published", "archived"] as const;

export function isTypeSlug(value: string): boolean {
    return SLUG_PATTERN.test(value);
}

export function slugFromLabel(label: string): string {
    return label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function parseStatuses(value: string): string[] {
    const statuses = value
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
    return statuses.length > 0 ? [...new Set(statuses)] : [...DEFAULT_TYPE_STATUSES];
}

export function asTypeDefinition(value: unknown): TypeDefinition | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const record = value as {
        slug?: unknown;
        label?: unknown;
        singular?: unknown;
        statuses?: unknown;
        fields?: unknown;
        createdAt?: unknown;
        updatedAt?: unknown;
    };

    if (typeof record.slug !== "string" || !record.slug.trim()) {
        return null;
    }

    const slug = record.slug.trim();
    const label = typeof record.label === "string" && record.label.trim() ? record.label.trim() : slug;
    const singular = typeof record.singular === "string" && record.singular.trim()
        ? record.singular.trim()
        : label;

    return {
        slug,
        label,
        singular,
        statuses: Array.isArray(record.statuses)
            ? record.statuses.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
            : [...DEFAULT_TYPE_STATUSES],
        fields: Array.isArray(record.fields)
            ? record.fields.filter((entry): entry is string => typeof entry === "string")
            : ["title", "slug", "status", "content", "meta"],
        createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined
    };
}

export function readTypeList(payload: unknown): TypeDefinition[] {
    const source = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && Array.isArray((payload as { types?: unknown }).types)
            ? (payload as { types: unknown[] }).types
            : [];

    return source
        .map((entry) => asTypeDefinition(entry))
        .filter((entry): entry is TypeDefinition => entry !== null);
}

export function typeItemPath(slug: string): string {
    return `/app/c/${encodeURIComponent(slug)}`;
}

export function draftTypePayload(fields: {
    slug: string;
    label: string;
    singular: string;
    statuses: string;
}): TypePayload {
    const label = fields.label.trim();
    const slug = fields.slug.trim() || slugFromLabel(label);
    return {
        slug,
        label: label || slug,
        singular: fields.singular.trim() || label || slug,
        statuses: parseStatuses(fields.statuses)
    };
}
