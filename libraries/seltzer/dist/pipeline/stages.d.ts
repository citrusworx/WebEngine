import { type ResponseData } from "../core/response.js";
import type { CompiledRoute } from "./router.js";
import type { PipelineContext, Stage } from "./types.js";
/** Read the request body. Invalid JSON short-circuits with 400. */
export declare function parseStage(ctx: PipelineContext): Promise<ResponseData | void>;
/** Normalize method, path, query, and headers onto ctx. */
export declare function contextStage(ctx: PipelineContext): void;
export declare function createRouteStage(getRoutes: () => CompiledRoute[]): Stage;
/** Stub for Nectarine contract validation. */
export declare function validateStage(_ctx: PipelineContext): void;
export declare function handleStage(ctx: PipelineContext): Promise<void>;
/** Reject non-ResponseData handler results with 500. Defaults live in `send`. */
export declare function responseStage(ctx: PipelineContext): void;
export declare function sendStage(ctx: PipelineContext): void;
