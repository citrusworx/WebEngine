/** `$1` or a tightly allowlisted bind cast such as `$2::jsonb`. */
export const BIND_CASTS = ["jsonb", "json", "text"] as const;
export type BindCast = (typeof BIND_CASTS)[number];

export const PLACEHOLDER = /^\$[1-9]\d*$/;
export const TYPED_PLACEHOLDER = /^\$[1-9]\d*::(?:jsonb|json|text)$/i;
export const PLACEHOLDER_SCAN = /^\$[1-9]\d*(?:::(?:jsonb|json|text))?/i;

export function isTypedPlaceholder(value: string): boolean {
    return TYPED_PLACEHOLDER.test(value);
}

export function normalizePlaceholder(value: string): string {
    if (PLACEHOLDER.test(value)) {
        return value;
    }
    const match = value.match(/^(\$[1-9]\d*)::(jsonb|json|text)$/i);
    if (!match || match[1] === undefined || match[2] === undefined) {
        return value;
    }
    return `${match[1]}::${match[2].toLowerCase()}`;
}

export function shiftPlaceholder(value: string, offset: number): string | undefined {
    const match = value.match(/^\$([1-9]\d*)(?:::(jsonb|json|text))?$/i);
    if (!match || match[1] === undefined) {
        return undefined;
    }
    const next = `$${Number(match[1]) + offset}`;
    return match[2] === undefined ? next : `${next}::${match[2].toLowerCase()}`;
}
