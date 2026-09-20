/**
 * Normalize a WordPress REST collection base (`rest_base`) to one path segment.
 * Rejects empty values, path separators, and traversal sequences.
 */
export declare function sanitizeRestBase(restBase: string): string;
