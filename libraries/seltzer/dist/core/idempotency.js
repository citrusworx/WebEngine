import { createHash } from "node:crypto";
/** How long a stored response and an in-flight reservation live. 24 hours. */
export const DEFAULT_IDEMPOTENCY_TTL_MS = 86400000;
/** `Idempotency-Key` must be this many characters or fewer. */
export const MAX_IDEMPOTENCY_KEY_LENGTH = 255;
const CLEANUP_BATCH = 32;
/**
 * Process-local idempotency map.
 *
 * Expiry is lazy on each key, plus a bounded scan once the map is larger than
 * `cleanupThreshold`. There is no interval, so stored responses do not keep
 * the process alive.
 */
export class MemoryIdempotencyStore {
    constructor(options = {}) {
        this.records = new Map();
        this.now = options.now ?? Date.now;
        const threshold = options.cleanupThreshold ?? 1024;
        if (!Number.isInteger(threshold) || threshold < 0) {
            throw new Error("MemoryIdempotencyStore cleanupThreshold must be a non-negative integer.");
        }
        this.cleanupThreshold = threshold;
    }
    async begin(key, fingerprint, ttlMs) {
        this.sweep();
        const current = this.read(key);
        if (current) {
            if (current.fingerprint !== fingerprint) {
                return { outcome: "mismatch" };
            }
            if (current.state !== "complete" || current.response === undefined) {
                return { outcome: "pending" };
            }
            return { outcome: "replay", response: cloneResponse(current.response) };
        }
        const now = this.now();
        this.records.set(key, {
            fingerprint,
            state: "pending",
            expiresAt: now + ttlMs,
            ttlMs,
        });
        return { outcome: "started" };
    }
    async complete(key, fingerprint, response) {
        const current = this.read(key);
        if (!current || current.fingerprint !== fingerprint || current.state !== "pending") {
            return;
        }
        current.state = "complete";
        current.response = cloneResponse(response);
        current.expiresAt = this.now() + current.ttlMs;
    }
    async release(key, fingerprint) {
        const current = this.read(key);
        if (!current || current.fingerprint !== fingerprint || current.state !== "pending") {
            return;
        }
        this.records.delete(key);
    }
    /** Drop one expired key. Live records stay. */
    read(key) {
        const record = this.records.get(key);
        if (!record) {
            return undefined;
        }
        if (record.expiresAt <= this.now()) {
            this.records.delete(key);
            return undefined;
        }
        return record;
    }
    /** Visit a fixed number of the oldest records and drop the expired ones. */
    sweep() {
        if (this.records.size <= this.cleanupThreshold) {
            return;
        }
        const now = this.now();
        let scanned = 0;
        for (const [key, record] of this.records) {
            if (record.expiresAt <= now) {
                this.records.delete(key);
            }
            scanned += 1;
            if (scanned >= CLEANUP_BATCH) {
                break;
            }
        }
    }
}
export function fingerprintBytes(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}
export function cloneResponse(response) {
    return {
        status: response.status,
        headers: response.headers ? { ...response.headers } : undefined,
        body: cloneBody(response.body),
    };
}
function cloneBody(body) {
    if (Buffer.isBuffer(body)) {
        return Buffer.from(body);
    }
    if (body instanceof Uint8Array) {
        return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    }
    if (body !== null && typeof body === "object") {
        return structuredClone(body);
    }
    return body;
}
//# sourceMappingURL=idempotency.js.map