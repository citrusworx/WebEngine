import type { ServerResponse } from "node:http";

/** Structured handler result. The runtime alone writes the HTTP response. */
export type ResponseData = {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
};

const RESPONSE_DATA_KEYS = new Set(["status", "headers", "body"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
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
export function isResponseData(value: unknown): value is ResponseData {
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

const RESPONSE_BRAND = Symbol.for("@citrusworx/seltzer.ResponseData");

/**
 * Mark an object as an explicit transport result for `generateRoutes`.
 * Unbranded `{ status?, headers?, body? }` payloads stay wrapped as `{ body }`.
 */
export function response(data: ResponseData): ResponseData {
    const branded: ResponseData = { ...data };
    Object.defineProperty(branded, RESPONSE_BRAND, {
        value: true,
        enumerable: false,
    });
    return branded;
}

/** True when `value` was produced by {@link response}. */
export function isExplicitResponse(value: unknown): value is ResponseData {
    return isResponseData(value) && RESPONSE_BRAND in (value as object);
}

function hasContentType(headers: Record<string, string>): boolean {
    return Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
}

function isJsonBody(body: unknown): boolean {
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

const TEXT_CONTENT_TYPE = "text/plain; charset=utf-8";
const JSON_CONTENT_TYPE = "application/json";
const BYTES_CONTENT_TYPE = "application/octet-stream";

/** 204 and 304 must not include a message body. */
function statusOmitsBody(status: number): boolean {
    return status === 204 || status === 304;
}

function setDefaultContentType(headers: Record<string, string>, value: string): void {
    if (!hasContentType(headers)) {
        headers["Content-Type"] = value;
    }
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
    const lower = name.toLowerCase();
    return Object.keys(headers).some((key) => key.toLowerCase() === lower);
}

function byteLength(payload: string | Buffer | Uint8Array): number {
    if (typeof payload === "string") {
        return Buffer.byteLength(payload);
    }

    return payload.byteLength;
}

function encodeBody(
    body: unknown,
    headers: Record<string, string>,
): string | Buffer | Uint8Array | undefined {
    if (body === undefined) {
        return undefined;
    }

    if (typeof body === "string") {
        setDefaultContentType(headers, TEXT_CONTENT_TYPE);
        return body;
    }

    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        setDefaultContentType(headers, BYTES_CONTENT_TYPE);
        return body;
    }

    if (isJsonBody(body) || typeof body === "number" || typeof body === "boolean") {
        setDefaultContentType(headers, JSON_CONTENT_TYPE);
        return JSON.stringify(body);
    }

    return String(body);
}

export type SendOptions = {
    /**
     * Write the headers a GET would send, including `Content-Length` of the
     * encoded body, and write no bytes. Used for HEAD.
     */
    head?: boolean;
};

/**
 * Apply ResponseData defaults and write the HTTP response.
 * No-op if headers were already sent.
 * Status 204 and 304 never include a body. `head: true` never includes a body.
 */
export function send(res: ServerResponse, data: ResponseData, options: SendOptions = {}): void {
    if (res.headersSent) {
        return;
    }

    const status = data.status ?? 200;
    const headers = { ...(data.headers ?? {}) };

    if (statusOmitsBody(status)) {
        res.writeHead(status, headers);
        res.end();
        return;
    }

    const payload = encodeBody(data.body, headers);

    if (options.head) {
        if (payload !== undefined && !hasHeader(headers, "content-length")) {
            headers["Content-Length"] = String(byteLength(payload));
        }
        res.writeHead(status, headers);
        res.end();
        return;
    }

    res.writeHead(status, headers);
    res.end(payload);
}
