import { DEFAULT_CLIENT_TIMEOUT_MS, } from "../types.js";
const BODY_SNIPPET_LIMIT = 200;
const HTTP_URL = /^(https?:)\/\/([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$/i;
/**
 * Non-2xx HTTP response.
 * `body` is parsed with the same Content-Type rules as a success result.
 * `headers` keys are lowercase, as Fetch reports them.
 */
export class HttpError extends Error {
    constructor(status, statusText, headers, body, rawText) {
        const snippet = snippetBody(rawText);
        super(snippet ? `HTTP ${status} ${statusText}: ${snippet}` : `HTTP ${status} ${statusText}`);
        this.code = "HTTP_ERROR";
        this.name = "HttpError";
        this.status = status;
        this.statusText = statusText;
        this.headers = headers;
        this.body = body;
    }
}
/** The deadline elapsed. Not an `HttpError`: the server may still be working. */
export class TimeoutError extends Error {
    constructor(timeoutMs) {
        super(`Request timed out after ${timeoutMs}ms`);
        this.code = "TIMEOUT";
        this.name = "TimeoutError";
        this.timeoutMs = timeoutMs;
    }
}
/** The caller's `AbortSignal` aborted the request. Checked before the timeout. */
export class AbortError extends Error {
    constructor(reason) {
        super(reason instanceof Error ? reason.message : "The request was aborted");
        this.code = "ABORTED";
        this.name = "AbortError";
        this.reason = reason;
    }
}
/** DNS, connection, or other transport failure. The response never arrived. */
export class NetworkError extends Error {
    constructor(message, options) {
        super(message);
        this.code = "NETWORK";
        this.name = "NetworkError";
        this.cause = options?.cause;
    }
}
/** `baseUrl` / `path` could not be turned into an http(s) URL. No request was sent. */
export class UrlError extends Error {
    constructor(message) {
        super(message);
        this.code = "INVALID_URL";
        this.name = "UrlError";
    }
}
/**
 * Build a client. There is no retry loop: a 5xx, a timeout, and a dropped
 * connection are each one attempt. Repeat the call yourself.
 * Server-side idempotency is not implemented here. Send `Idempotency-Key`
 * by putting it in `headers` if the server understands it.
 */
export function createClient(config = {}) {
    const clientTimeout = config.timeout === undefined ? DEFAULT_CLIENT_TIMEOUT_MS : config.timeout;
    assertTimeout(clientTimeout, "Client timeout");
    function call(method, endpoint, data) {
        return request(config, clientTimeout, method, endpoint, data);
    }
    return {
        get: (endpoint) => call("GET", endpoint),
        head: (endpoint) => call("HEAD", endpoint),
        post: (endpoint, data) => call("POST", endpoint, data),
        put: (endpoint, data) => call("PUT", endpoint, data),
        patch: (endpoint, data) => call("PATCH", endpoint, data),
        delete: (endpoint) => call("DELETE", endpoint),
    };
}
/** Default client: 30s timeout, no base URL, no extra headers, no retries. */
export const client = createClient();
function snippetBody(body) {
    const trimmed = body.trim();
    if (!trimmed) {
        return "";
    }
    return trimmed.length > BODY_SNIPPET_LIMIT ? `${trimmed.slice(0, BODY_SNIPPET_LIMIT)}…` : trimmed;
}
function assertTimeout(timeout, label) {
    if (typeof timeout !== "number" || !Number.isInteger(timeout) || timeout < 0) {
        throw new TypeError(`${label} must be a non-negative integer number of milliseconds`);
    }
}
function mediaType(contentType) {
    if (!contentType) {
        return "";
    }
    return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}
function isJsonMedia(type) {
    return type === "application/json" || type.endsWith("+json");
}
function headerRecord(headers) {
    const record = {};
    headers.forEach((value, key) => {
        record[key] = value;
    });
    return record;
}
function hasHeader(headers, name) {
    const lower = name.toLowerCase();
    return Object.keys(headers).some((key) => key.toLowerCase() === lower);
}
function mergeHeaders(...sources) {
    const merged = new Map();
    for (const source of sources) {
        if (!source) {
            continue;
        }
        for (const [name, value] of Object.entries(source)) {
            merged.set(name.toLowerCase(), [name, value]);
        }
    }
    const headers = {};
    for (const [name, value] of merged.values()) {
        headers[name] = value;
    }
    return headers;
}
function setDefaultContentType(headers, value) {
    if (!hasHeader(headers, "content-type")) {
        headers["Content-Type"] = value;
    }
}
/**
 * Object (including arrays), number, boolean, and null → JSON.
 * String → text. `Uint8Array` / `Buffer` → bytes. `undefined` → no body.
 * `FormData`, `Blob`, and byte streams are rejected; send a string or bytes instead.
 */
function encodeRequestBody(data, headers) {
    if (data === undefined) {
        return undefined;
    }
    if (typeof data === "string") {
        setDefaultContentType(headers, "text/plain; charset=utf-8");
        return data;
    }
    if (isByteBody(data)) {
        setDefaultContentType(headers, "application/octet-stream");
        // Node fetch accepts the bytes. DOM BodyInit's Uint8Array generic is narrower.
        const copy = new Uint8Array(data.byteLength);
        copy.set(data);
        return copy;
    }
    if (typeof data === "number" || typeof data === "boolean" || data === null) {
        setDefaultContentType(headers, "application/json");
        return JSON.stringify(data);
    }
    if (typeof data === "object") {
        if (isBlockedBody(data)) {
            throw new TypeError(`Cannot send ${describeBody(data)} as a request body. Pass a string or Uint8Array.`);
        }
        const json = JSON.stringify(data);
        if (json === undefined) {
            throw new TypeError(`Cannot send ${describeBody(data)} as a request body`);
        }
        setDefaultContentType(headers, "application/json");
        return json;
    }
    throw new TypeError(`Cannot send ${describeBody(data)} as a request body`);
}
function isByteBody(data) {
    return (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) || data instanceof Uint8Array;
}
function isBlockedBody(data) {
    const tag = Object.prototype.toString.call(data);
    return (tag === "[object FormData]" ||
        tag === "[object Blob]" ||
        tag === "[object ReadableStream]" ||
        tag === "[object ArrayBuffer]");
}
function describeBody(data) {
    if (data === null) {
        return "null";
    }
    const tag = Object.prototype.toString.call(data);
    if (tag.startsWith("[object ") && tag.endsWith("]")) {
        return tag.slice(8, -1);
    }
    return typeof data;
}
function isSchemeUrl(path) {
    return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path);
}
function isProtocolRelative(path) {
    return path.startsWith("//") && !path.startsWith("///");
}
function splitHashAndSearch(input) {
    const hashAt = input.indexOf("#");
    const hash = hashAt === -1 ? "" : input.slice(hashAt);
    const withoutHash = hashAt === -1 ? input : input.slice(0, hashAt);
    const queryAt = withoutHash.indexOf("?");
    if (queryAt === -1) {
        return { head: withoutHash, search: "", hash };
    }
    return {
        head: withoutHash.slice(0, queryAt),
        search: withoutHash.slice(queryAt),
        hash,
    };
}
function parseAbsolute(url) {
    const match = HTTP_URL.exec(url);
    if (!match) {
        throw new UrlError(`Invalid URL: ${url}`);
    }
    const protocol = match[1]?.toLowerCase();
    const host = match[2];
    if (!protocol || !host) {
        throw new UrlError(`Invalid URL: ${url}`);
    }
    return {
        origin: `${protocol}//${host}`,
        pathname: match[3] || "",
        search: match[4] || "",
        hash: match[5] || "",
    };
}
function encodeQuery(query) {
    if (!query) {
        return "";
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        appendQueryValue(params, key, value);
    }
    return params.toString();
}
function appendQueryValue(params, key, value) {
    if (value === null || value === undefined) {
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            if (item === null || item === undefined) {
                continue;
            }
            if (typeof item === "object") {
                throw queryTypeError(key);
            }
            params.append(key, String(item));
        }
        return;
    }
    if (typeof value === "object") {
        throw queryTypeError(key);
    }
    params.append(key, String(value));
}
function queryTypeError(key) {
    return new TypeError(`Query value for "${key}" must be a string, number, boolean, null, or an array of those`);
}
function combineSearch(parts) {
    const pieces = parts.map((part) => part.replace(/^\?/, "")).filter((part) => part.length > 0);
    return pieces.length === 0 ? "" : `?${pieces.join("&")}`;
}
function joinPath(basePath, relative) {
    if (relative === "") {
        return basePath;
    }
    const trimmedBase = basePath.replace(/\/+$/, "");
    return `${trimmedBase}/${relative}`;
}
/**
 * Join `baseUrl` and `path` with one slash at the boundary.
 * A base path is kept: `/api/v1` + `users` is `/api/v1/users`.
 * Leading slashes on `path` and trailing slashes on the base path are the boundary.
 * Other slashes, including a trailing slash on `path`, are preserved.
 * The path is not re-encoded. `options.query` is appended.
 * An absolute `path` throws unless `allowAbsoluteUrl` is set.
 */
export function resolveRequestUrl(baseUrl, path, options) {
    const query = encodeQuery(options?.query);
    const allowAbsolute = options?.allowAbsoluteUrl === true;
    if (isSchemeUrl(path) || isProtocolRelative(path)) {
        if (!allowAbsolute) {
            throw new UrlError("Absolute URL in path requires options.allowAbsoluteUrl. baseUrl is not replaced unless that option is set.");
        }
        if (isProtocolRelative(path)) {
            throw new UrlError("Protocol-relative URLs are not supported. Pass an http:// or https:// URL.");
        }
        const absolute = parseAbsolute(path);
        const parts = splitHashAndSearch(path);
        return `${absolute.origin}${absolute.pathname}${combineSearch([absolute.search, query])}${parts.hash || absolute.hash}`;
    }
    if (!baseUrl) {
        const parts = splitHashAndSearch(path);
        return `${parts.head}${combineSearch([parts.search, query])}${parts.hash}`;
    }
    const base = parseAbsolute(baseUrl);
    const parts = splitHashAndSearch(path);
    const relative = parts.head.replace(/^\/+/, "");
    const pathname = joinPath(base.pathname, relative);
    return `${base.origin}${pathname}${combineSearch([base.search, parts.search, query])}${parts.hash || base.hash}`;
}
async function readParsed(res, method) {
    if (method === "HEAD" || res.status === 204 || res.status === 205) {
        await res.body?.cancel().catch(() => undefined);
        return { body: undefined, raw: "" };
    }
    const type = mediaType(res.headers.get("content-type"));
    if (isJsonMedia(type)) {
        const text = await res.text();
        if (text.length === 0) {
            return { body: undefined, raw: "" };
        }
        try {
            return { body: JSON.parse(text), raw: text };
        }
        catch (error) {
            if (!res.ok) {
                return { body: text, raw: text };
            }
            throw error;
        }
    }
    if (type.startsWith("text/")) {
        const text = await res.text();
        if (text.length === 0) {
            return { body: undefined, raw: "" };
        }
        return { body: text, raw: text };
    }
    if (type === "") {
        const text = await res.text();
        if (text.length === 0) {
            return { body: undefined, raw: "" };
        }
        try {
            return { body: JSON.parse(text), raw: text };
        }
        catch {
            return { body: text, raw: text };
        }
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0) {
        return { body: undefined, raw: "" };
    }
    const raw = new TextDecoder().decode(bytes.subarray(0, BODY_SNIPPET_LIMIT + 1));
    return { body: bytes, raw };
}
function unrefTimer(timer) {
    if (typeof timer === "object" && timer !== null && "unref" in timer && typeof timer.unref === "function") {
        timer.unref();
    }
}
function mergeAbortSignals(signals) {
    if (signals.length === 0) {
        return { cleanup: () => undefined };
    }
    if (signals.length === 1) {
        return { signal: signals[0], cleanup: () => undefined };
    }
    const any = AbortSignal.any;
    if (typeof any === "function") {
        return { signal: any(signals), cleanup: () => undefined };
    }
    const controller = new AbortController();
    const removers = [];
    const onAbort = (signal) => {
        if (!controller.signal.aborted) {
            controller.abort(signal.reason);
        }
    };
    for (const signal of signals) {
        if (signal.aborted) {
            onAbort(signal);
            for (const remove of removers) {
                remove();
            }
            return { signal: controller.signal, cleanup: () => undefined };
        }
        const listener = () => onAbort(signal);
        signal.addEventListener("abort", listener);
        removers.push(() => signal.removeEventListener("abort", listener));
    }
    return {
        signal: controller.signal,
        cleanup: () => {
            for (const remove of removers) {
                remove();
            }
        },
    };
}
function sendsBody(method) {
    return method === "POST" || method === "PUT" || method === "PATCH";
}
async function request(config, clientTimeout, method, endpoint, data) {
    const callTimeout = endpoint.options?.timeout;
    const timeoutMs = callTimeout === undefined ? clientTimeout : callTimeout;
    assertTimeout(timeoutMs, "Request timeout");
    const baseUrl = endpoint.options?.baseUrl ?? config.baseUrl;
    const url = resolveRequestUrl(baseUrl, endpoint.path, endpoint.options);
    const headers = mergeHeaders(config.headers, endpoint.options?.headers);
    const body = sendsBody(method) ? encodeRequestBody(data, headers) : undefined;
    const callerSignal = endpoint.options?.signal;
    if (callerSignal?.aborted) {
        throw new AbortError(callerSignal.reason);
    }
    let timedOut = false;
    let timer;
    const timeoutController = new AbortController();
    const signals = [];
    if (timeoutMs > 0) {
        timer = setTimeout(() => {
            timedOut = true;
            timeoutController.abort();
        }, timeoutMs);
        unrefTimer(timer);
        signals.push(timeoutController.signal);
    }
    if (callerSignal) {
        signals.push(callerSignal);
    }
    const merged = mergeAbortSignals(signals);
    try {
        const init = { method, headers };
        if (body !== undefined) {
            init.body = body;
        }
        if (merged.signal) {
            init.signal = merged.signal;
        }
        const res = await fetch(url, init);
        const parsed = await readParsed(res, method);
        if (!res.ok) {
            throw new HttpError(res.status, res.statusText, headerRecord(res.headers), parsed.body, parsed.raw);
        }
        return parsed.body;
    }
    catch (error) {
        if (error instanceof HttpError || error instanceof SyntaxError || error instanceof UrlError) {
            throw error;
        }
        if (callerSignal?.aborted) {
            throw new AbortError(callerSignal.reason);
        }
        if (timedOut) {
            throw new TimeoutError(timeoutMs);
        }
        const message = error instanceof Error ? error.message : "Network request failed";
        throw new NetworkError(message, { cause: error });
    }
    finally {
        if (timer) {
            clearTimeout(timer);
        }
        merged.cleanup();
    }
}
//# sourceMappingURL=client.js.map