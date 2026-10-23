import { type ResponseData } from "../core/response.js";
import type { CompiledRoute } from "./router.js";
import type { PipelineContext, Stage } from "./types.js";
/**
 * Read the request body.
 * Invalid JSON is 400. A body over `bodyLimit` is 413 and is not read further.
 * GET/HEAD skip the body. An empty body is `undefined`.
 * Non-JSON content types are a UTF-8 string (not 415).
 */
export declare function parseStage(ctx: PipelineContext): Promise<ResponseData | void>;
/** Normalize method, path, query, and headers onto ctx. */
export declare function contextStage(ctx: PipelineContext): void;
export declare function createRouteStage(getRoutes: () => CompiledRoute[]): Stage;
/**
 * Enforce `.required` keys from `ctx.route.contract.body` on `ctx.body`.
 *
 * Presence only. The words `string` and `int` in a spec are not type checks.
 * Numbers, booleans, objects, and arrays count as present. `undefined`,
 * `null`, and blank strings do not.
 *
 * No body specs, or specs with no `.required` token, return undefined.
 * This stage does not read or write `ctx.valid` and does not replace
 * `ctx.body`. After a normal request, `ctx.valid` is still `undefined`
 * unless an earlier hook assigned it.
 *
 * Failures keep the presence messages, not `validationError()`:
 * `{ error: "Request body must be an object" }`,
 * `{ error: "Missing required field: email" }`, or
 * `{ error: "Missing required fields: email, name" }` (spec key order).
 *
 * `replace("validate", …)` removes this stage. Richer checks, including Zod,
 * belong in that replacement: set `ctx.valid` and return `validationError(issues)`.
 */
export declare function validateStage(ctx: PipelineContext): ResponseData | void;
export declare function handleStage(ctx: PipelineContext): Promise<void>;
/**
 * Reject non-ResponseData handler results with 500 and a log line that
 * names the route and the returned value. Defaults for valid results live in `send`.
 */
export declare function responseStage(ctx: PipelineContext): void;
export declare function sendStage(ctx: PipelineContext): Promise<void>;
