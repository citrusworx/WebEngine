import { emitLog, routePhrase } from "../core/log.js";
import { cloneResponse, fingerprintBytes, MAX_IDEMPOTENCY_KEY_LENGTH, } from "../core/idempotency.js";
import { isResponseData } from "../core/response.js";
const REPLAY_HEADER = "Idempotent-Replayed";
const IDEMPOTENT_METHODS = new Set(["POST", "PATCH"]);
/**
 * Reserve `Idempotency-Key` for POST and PATCH, or replay a stored response.
 *
 * No header, any other method, or `idempotency` left unset on ctx: continue.
 * An empty key or a key longer than 255 characters is 400 and does not reserve.
 * Same key and body fingerprint while the first request is in flight is 409.
 * Same key with a different body fingerprint is 422, including while the first
 * request is still in flight. A completed match returns the stored response
 * with `Idempotent-Replayed: true` and does not run the handler.
 *
 * The reservation is finished in `send`, after the final status is known.
 */
export async function idempotencyStage(ctx) {
    const config = ctx.idempotency;
    if (!config) {
        return;
    }
    const method = (ctx.method ?? "").toUpperCase();
    if (!IDEMPOTENT_METHODS.has(method)) {
        return;
    }
    const key = headerValue(ctx.headers, "idempotency-key");
    if (key === undefined) {
        return;
    }
    if (key.length < 1 || key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
        return {
            status: 400,
            body: { error: "Idempotency-Key must be 1-255 characters" },
        };
    }
    const fingerprint = fingerprintBytes(bodyBytes(ctx));
    const storageKey = JSON.stringify([method, ctx.path ?? "", key]);
    const result = await config.store.begin(storageKey, fingerprint, config.ttlMs);
    if (result.outcome === "started") {
        ctx.idempotencyClaim = { key: storageKey, fingerprint };
        return;
    }
    if (result.outcome === "pending") {
        return {
            status: 409,
            body: { error: "Idempotency key is already in progress" },
        };
    }
    if (result.outcome === "mismatch") {
        return {
            status: 422,
            body: { error: "Idempotency key was used with a different request body" },
        };
    }
    return replay(result.response);
}
/**
 * Store a finished 200–499 response, or release the reservation otherwise.
 * Called from `send` so `before("send")` hooks are part of the cached result.
 * A store failure is logged. The HTTP response is still written.
 * If storing a cacheable response throws, the reservation is released.
 */
export async function settleIdempotency(ctx) {
    const claim = ctx.idempotencyClaim;
    const config = ctx.idempotency;
    if (!claim || !config) {
        return;
    }
    ctx.idempotencyClaim = undefined;
    const data = ctx.response;
    const status = isResponseData(data) ? (data.status ?? 200) : 500;
    const cacheable = isResponseData(data) && Number.isInteger(status) && status >= 200 && status <= 499;
    try {
        if (cacheable) {
            await config.store.complete(claim.key, claim.fingerprint, toStored(data));
            return;
        }
        await config.store.release(claim.key, claim.fingerprint);
    }
    catch (error) {
        emitLog(ctx, `Seltzer: ${routePhrase(ctx)} idempotency store failed: ${error instanceof Error ? error.message : String(error)}`);
        if (!cacheable) {
            return;
        }
        try {
            await config.store.release(claim.key, claim.fingerprint);
        }
        catch {
            // The response is already decided. A stuck key expires with its TTL.
        }
    }
}
function replay(stored) {
    const copy = cloneResponse(stored);
    return {
        status: copy.status,
        headers: { ...(copy.headers ?? {}), [REPLAY_HEADER]: "true" },
        body: copy.body,
    };
}
function toStored(data) {
    return cloneResponse({
        status: data.status ?? 200,
        headers: data.headers,
        body: data.body,
    });
}
function headerValue(headers, name) {
    if (Object.prototype.hasOwnProperty.call(headers, name)) {
        return headers[name];
    }
    const lower = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lower) {
            return value;
        }
    }
    return undefined;
}
/**
 * SHA-256 input. `parse` sets `rawBody` to the exact bytes.
 * A replacement `parse` that omits `rawBody` is fingerprinted from `ctx.body`:
 * bytes as-is, strings as UTF-8, anything else as `JSON.stringify`.
 */
function bodyBytes(ctx) {
    if (ctx.rawBody !== undefined) {
        return ctx.rawBody;
    }
    const body = ctx.body;
    if (body === undefined || body === null) {
        return Buffer.alloc(0);
    }
    if (Buffer.isBuffer(body)) {
        return body;
    }
    if (body instanceof Uint8Array) {
        return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    }
    if (typeof body === "string") {
        return Buffer.from(body, "utf8");
    }
    return Buffer.from(JSON.stringify(body) ?? "", "utf8");
}
//# sourceMappingURL=idempotency.js.map