import { CMS_COLLECTIONS, DEFAULT_TYPE_FIELDS, DEFAULT_TYPE_STATUSES } from "./types.js";
export const PERSISTED_TYPES_COLLECTION = "__types";
const GATEWAY_RESERVED = ["types", "content", "cms", "health", "transfer"];
const RESERVED_SLUGS = new Set([
    ...CMS_COLLECTIONS,
    ...GATEWAY_RESERVED,
    PERSISTED_TYPES_COLLECTION
]);
const SLUG_PATTERN = /^[a-z][a-z0-9_-]{0,62}$/;
const STATUS_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;
export function isReservedCollectionSlug(value) {
    return RESERVED_SLUGS.has(value);
}
export function isCustomTypeSlug(value) {
    return SLUG_PATTERN.test(value) && !isReservedCollectionSlug(value);
}
export function isCollectionSlug(value) {
    return CMS_COLLECTIONS.includes(value) || isCustomTypeSlug(value);
}
export function isEditableGatewayCollection(value) {
    return value === "posts" || value === "pages" || isCustomTypeSlug(value);
}
function titleCase(slug) {
    return slug
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function defaultLabel(slug) {
    const base = titleCase(slug);
    return base.endsWith("s") ? base : `${base}s`;
}
function defaultSingular(slug) {
    return titleCase(slug);
}
function asString(value) {
    return typeof value === "string" ? value.trim() : "";
}
function normalizeStatuses(value) {
    const source = Array.isArray(value) ? value : [...DEFAULT_TYPE_STATUSES];
    const statuses = source
        .map((entry) => asString(entry).toLowerCase())
        .filter((entry) => STATUS_PATTERN.test(entry));
    return statuses.length > 0 ? [...new Set(statuses)] : [...DEFAULT_TYPE_STATUSES];
}
function normalizeFields(value) {
    if (!Array.isArray(value)) {
        return [...DEFAULT_TYPE_FIELDS];
    }
    const allowed = new Set(DEFAULT_TYPE_FIELDS);
    const fields = value
        .filter((entry) => typeof entry === "string" && allowed.has(entry));
    return fields.length > 0 ? [...new Set(fields)] : [...DEFAULT_TYPE_FIELDS];
}
export function normalizeTypeDefinition(input, existing) {
    const slug = asString(input.slug || existing?.slug).toLowerCase();
    if (!isCustomTypeSlug(slug)) {
        throw new Error(existing
            ? `Invalid custom type slug "${slug || "(empty)"}".`
            : "Type slug must be a lowercase letter, then letters, numbers, hyphens, or underscores, and cannot reuse a built-in collection.");
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
export function asTypeDefinition(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    try {
        const record = value;
        const normalized = normalizeTypeDefinition(record);
        return {
            ...normalized,
            createdAt: typeof record.createdAt === "string" ? record.createdAt : normalized.createdAt,
            updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : normalized.updatedAt
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=type-registry.js.map