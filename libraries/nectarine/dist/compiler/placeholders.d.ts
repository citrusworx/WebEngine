/** `$1` or a tightly allowlisted bind cast such as `$2::jsonb`. */
export declare const BIND_CASTS: readonly ["jsonb", "json", "text"];
export type BindCast = (typeof BIND_CASTS)[number];
export declare const PLACEHOLDER: RegExp;
export declare const TYPED_PLACEHOLDER: RegExp;
export declare const PLACEHOLDER_SCAN: RegExp;
export declare function isTypedPlaceholder(value: string): boolean;
export declare function normalizePlaceholder(value: string): string;
export declare function shiftPlaceholder(value: string, offset: number): string | undefined;
