/** How long a stored response and an in-flight reservation live. 24 hours. */
export declare const DEFAULT_IDEMPOTENCY_TTL_MS = 86400000;
/** `Idempotency-Key` must be this many characters or fewer. */
export declare const MAX_IDEMPOTENCY_KEY_LENGTH = 255;
/**
 * Final response kept for replay. `body` may be a `Buffer`.
 * `status` is the status `send` would use (`200` when the handler omitted it).
 */
export type IdempotencyResponse = {
    status: number;
    headers?: Record<string, string>;
    body?: unknown;
};
/**
 * Result of an atomic {@link IdempotencyStore.begin}.
 *
 * - `started` — this caller owns the in-flight reservation.
 * - `pending` — the same key and fingerprint are already in flight (409).
 * - `mismatch` — the key is stored with a different fingerprint, in flight or complete (422).
 * - `replay` — a completed response for this fingerprint is still inside its TTL.
 */
export type IdempotencyBeginResult = {
    outcome: "started";
} | {
    outcome: "pending";
} | {
    outcome: "mismatch";
} | {
    outcome: "replay";
    response: IdempotencyResponse;
};
/**
 * Persistence for the built-in idempotency stage.
 *
 * `begin` must be atomic for one key: either insert a new in-flight reservation
 * or return the record already stored. Do not await between the read and the insert.
 * The stage scopes keys as a JSON array `[method, path, idempotencyKey]`
 * (`method` uppercased, `path` without the query string).
 *
 * `complete` stores a finished 2xx/3xx/4xx response. `release` drops an in-flight
 * reservation after a 5xx or a thrown error so the client can retry.
 * Both no-op when the fingerprint does not match the reservation.
 */
export interface IdempotencyStore {
    begin(key: string, fingerprint: string, ttlMs: number): Promise<IdempotencyBeginResult>;
    complete(key: string, fingerprint: string, response: IdempotencyResponse): Promise<void>;
    release(key: string, fingerprint: string): Promise<void>;
}
export type MemoryIdempotencyStoreOptions = {
    /** Clock for TTL checks. Default `Date.now`. Tests pass a fake. */
    now?: () => number;
    /**
     * When the map grows past this many records, scan a bounded batch and drop
     * expired ones. Default 1024. Live records are not evicted.
     */
    cleanupThreshold?: number;
};
/**
 * Process-local idempotency map.
 *
 * Expiry is lazy on each key, plus a bounded scan once the map is larger than
 * `cleanupThreshold`. There is no interval, so stored responses do not keep
 * the process alive.
 */
export declare class MemoryIdempotencyStore implements IdempotencyStore {
    private readonly records;
    private readonly now;
    private readonly cleanupThreshold;
    constructor(options?: MemoryIdempotencyStoreOptions);
    begin(key: string, fingerprint: string, ttlMs: number): Promise<IdempotencyBeginResult>;
    complete(key: string, fingerprint: string, response: IdempotencyResponse): Promise<void>;
    release(key: string, fingerprint: string): Promise<void>;
    /** Drop one expired key. Live records stay. */
    private read;
    /** Visit a fixed number of the oldest records and drop the expired ones. */
    private sweep;
}
export declare function fingerprintBytes(bytes: Buffer): string;
export declare function cloneResponse(response: IdempotencyResponse): IdempotencyResponse;
