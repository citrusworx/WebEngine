"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLACEHOLDER_SCAN = exports.TYPED_PLACEHOLDER = exports.PLACEHOLDER = exports.BIND_CASTS = void 0;
exports.isTypedPlaceholder = isTypedPlaceholder;
exports.normalizePlaceholder = normalizePlaceholder;
exports.shiftPlaceholder = shiftPlaceholder;
/** `$1` or a tightly allowlisted bind cast such as `$2::jsonb`. */
exports.BIND_CASTS = ["jsonb", "json", "text"];
exports.PLACEHOLDER = /^\$[1-9]\d*$/;
exports.TYPED_PLACEHOLDER = /^\$[1-9]\d*::(?:jsonb|json|text)$/i;
exports.PLACEHOLDER_SCAN = /^\$[1-9]\d*(?:::(?:jsonb|json|text))?/i;
function isTypedPlaceholder(value) {
    return exports.TYPED_PLACEHOLDER.test(value);
}
function normalizePlaceholder(value) {
    if (exports.PLACEHOLDER.test(value)) {
        return value;
    }
    const match = value.match(/^(\$[1-9]\d*)::(jsonb|json|text)$/i);
    if (!match || match[1] === undefined || match[2] === undefined) {
        return value;
    }
    return `${match[1]}::${match[2].toLowerCase()}`;
}
function shiftPlaceholder(value, offset) {
    const match = value.match(/^\$([1-9]\d*)(?:::(jsonb|json|text))?$/i);
    if (!match || match[1] === undefined) {
        return undefined;
    }
    const next = `$${Number(match[1]) + offset}`;
    return match[2] === undefined ? next : `${next}::${match[2].toLowerCase()}`;
}
//# sourceMappingURL=placeholders.js.map