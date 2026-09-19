const SECRET_KEY = /^(.*[_-])?(password|passwd|secret|token|authorization|api[_-]?key|private[_-]?key)$/i;
const SECRET_VALUE = /(dop_v1_[a-z0-9]+)|((password|token|secret)\s*[:=]\s*\S+)/gi;

export function redactText(value: string): string {
    return value.replace(SECRET_VALUE, (match) => {
        if (match.startsWith("dop_v1_")) {
            return "dop_v1_[redacted]";
        }
        const separator = match.includes("=") ? "=" : ":";
        const [label] = match.split(/[:=]/);
        return `${label.trim()}${separator}[redacted]`;
    });
}

export function sanitizeForClient<T>(value: T): T {
    return sanitizeValue(value) as T;
}

function sanitizeValue(value: unknown): unknown {
    if (typeof value === "string") {
        return redactText(value);
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
        if (SECRET_KEY.test(key)) {
            continue;
        }
        result[key] = sanitizeValue(entry);
    }
    return result;
}
