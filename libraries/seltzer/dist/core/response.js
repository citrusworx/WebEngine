const RESPONSE_DATA_KEYS = new Set(["status", "headers", "body"]);
function isPlainObject(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
function isStringRecord(value) {
    if (!isPlainObject(value)) {
        return false;
    }
    return Object.values(value).every((entry) => typeof entry === "string");
}
/**
 * True when `value` is a ResponseData shape: a plain object whose keys are only
 * `status`, `headers`, and/or `body`. Bare payloads (objects, arrays, strings)
 * are not wrapped — handlers must return `{ body: ... }`.
 */
export function isResponseData(value) {
    if (!isPlainObject(value)) {
        return false;
    }
    for (const key of Object.keys(value)) {
        if (!RESPONSE_DATA_KEYS.has(key)) {
            return false;
        }
    }
    if (value.status !== undefined && typeof value.status !== "number") {
        return false;
    }
    if (value.headers !== undefined && !isStringRecord(value.headers)) {
        return false;
    }
    return true;
}
function hasContentType(headers) {
    return Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
}
function isJsonBody(body) {
    if (body === null) {
        return true;
    }
    if (Array.isArray(body)) {
        return true;
    }
    if (typeof body !== "object") {
        return false;
    }
    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        return false;
    }
    return true;
}
function encodeBody(body, headers) {
    if (body === undefined) {
        return undefined;
    }
    if (typeof body === "string") {
        return body;
    }
    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        return body;
    }
    if (isJsonBody(body) || typeof body === "number" || typeof body === "boolean") {
        if (!hasContentType(headers)) {
            headers["Content-Type"] = "application/json";
        }
        return JSON.stringify(body);
    }
    return String(body);
}
/** Apply ResponseData defaults and write the HTTP response. No-op if headers were already sent. */
export function send(res, data) {
    if (res.headersSent) {
        return;
    }
    const status = data.status ?? 200;
    const headers = { ...(data.headers ?? {}) };
    const payload = encodeBody(data.body, headers);
    res.writeHead(status, headers);
    res.end(payload);
}
//# sourceMappingURL=response.js.map