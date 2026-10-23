import type { IdempotencyStore } from "../core/idempotency.js";
import type { SeltzerLogger } from "../core/log.js";
import type { RequestContext, Route } from "../core/types.js";
import type { ResponseData } from "../core/response.js";
export declare const STAGE_NAMES: readonly ["parse", "context", "route", "validate", "idempotency", "handle", "response", "send"];
export type StageName = (typeof STAGE_NAMES)[number];
/**
 * Per-request pipeline state. Stages mutate this object in place.
 * Handlers still receive the public `RequestContext` shape, including
 * `valid`. Extra fields (`route`, `response`) are for pipeline stages.
 */
export type PipelineContext<TLocals = unknown> = RequestContext<TLocals> & {
    route?: Route;
    response?: ResponseData;
    /**
     * Byte cap for `parse`. Set from `init({ bodyLimit })` or `listen({ bodyLimit })`.
     * `0` is unlimited. Omitted uses the 1 MB default inside `parse`.
     */
    bodyLimit?: number;
    /** From `init({ logger })` or `listen({ logger })`. Omitted lines go to `console.error`. */
    logger?: SeltzerLogger;
    /** From `init({ debug })` or `listen({ debug })`. Stack traces are logged only when true. */
    debug?: boolean;
    /**
     * Exact request-body bytes from `parse`, before JSON parsing.
     * An empty body is an empty buffer. GET and HEAD leave this unset.
     * The idempotency stage hashes these bytes. A replacement `parse`
     * should set this when the fingerprint must match the original payload.
     */
    rawBody?: Buffer;
    /**
     * Resolved idempotency config for this request.
     * Unset means the builtin stage does nothing (including `idempotency: false`).
     */
    idempotency?: {
        ttlMs: number;
        store: IdempotencyStore;
    };
    /**
     * In-flight reservation owned by this request.
     * Set by the builtin idempotency stage and cleared in `send`.
     */
    idempotencyClaim?: {
        key: string;
        fingerprint: string;
    };
};
/**
 * A pipeline stage. Mutate `ctx` and return void/undefined to continue.
 * Return `ResponseData` to halt remaining stages and jump to `send`.
 * Any other return is a 500.
 */
export type Stage<TLocals = unknown> = (ctx: PipelineContext<TLocals>) => void | ResponseData | Promise<void | ResponseData | undefined>;
export type PipelineEntry = {
    name: StageName;
    stage: Stage;
    builtin?: boolean;
    /**
     * Inserted with `before` or supplied to `replace`.
     * Raw `res` writes throw while it runs.
     */
    user?: boolean;
};
