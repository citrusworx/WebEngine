import { type ResponseData } from "../core/response.js";
import type { CompiledRoute } from "./router.js";
import type { PipelineContext, Stage } from "./types.js";
/** Read the request body. Invalid JSON short-circuits with 400. */
export declare function parseStage(ctx: PipelineContext): Promise<ResponseData | void>;
/** Normalize method, path, query, and headers onto ctx. */
export declare function contextStage(ctx: PipelineContext): void;
export declare function createRouteStage(getRoutes: () => CompiledRoute[]): Stage;
/**
 * Enforce `.required` keys from `ctx.route.contract.body` on `ctx.body`.
 * No body specs → no-op (GET product/waitlist reads). Nectarine can
 * `replace("validate", …)` for richer contracts.
 */
export declare function validateStage(ctx: PipelineContext): ResponseData | void;
export declare function handleStage(ctx: PipelineContext): Promise<void>;
/** Reject non-ResponseData handler results with 500. Defaults live in `send`. */
export declare function responseStage(ctx: PipelineContext): void;
export declare function sendStage(ctx: PipelineContext): void;
