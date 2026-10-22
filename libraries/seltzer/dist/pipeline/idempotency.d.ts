import { type ResponseData } from "../core/response.js";
import type { PipelineContext } from "./types.js";
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
export declare function idempotencyStage(ctx: PipelineContext): Promise<ResponseData | void>;
/**
 * Store a finished 200–499 response, or release the reservation otherwise.
 * Called from `send` so `before("send")` hooks are part of the cached result.
 * A store failure is logged. The HTTP response is still written.
 * If storing a cacheable response throws, the reservation is released.
 */
export declare function settleIdempotency(ctx: PipelineContext): Promise<void>;
