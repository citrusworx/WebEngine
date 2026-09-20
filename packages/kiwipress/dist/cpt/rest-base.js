const REST_BASE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/;
function invalidRestBase(restBase) {
    return new Error(`Invalid WordPress restBase "${restBase}". Use a single collection slug such as "books" or "product".`);
}
/**
 * Normalize a WordPress REST collection base (`rest_base`) to one path segment.
 * Rejects empty values, path separators, and traversal sequences.
 */
export function sanitizeRestBase(restBase) {
    if (typeof restBase !== "string") {
        throw new Error("WordPress restBase must be a non-empty collection slug.");
    }
    const value = restBase.trim();
    if (!value) {
        throw new Error("WordPress restBase must be a non-empty collection slug.");
    }
    if (value.includes("/") ||
        value.includes("\\") ||
        value.includes("..") ||
        value.includes(".") ||
        value.includes("?") ||
        value.includes("#") ||
        value.includes("%")) {
        throw invalidRestBase(restBase);
    }
    if (!REST_BASE_PATTERN.test(value)) {
        throw invalidRestBase(restBase);
    }
    return value;
}
//# sourceMappingURL=rest-base.js.map