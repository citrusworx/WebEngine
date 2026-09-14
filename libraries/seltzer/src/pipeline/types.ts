import type { RequestContext, Route } from "../core/types.js";
import type { ResponseData } from "../core/response.js";

export const STAGE_NAMES = [
    "parse",
    "context",
    "route",
    "validate",
    "handle",
    "response",
    "send",
] as const;

export type StageName = (typeof STAGE_NAMES)[number];

/**
 * Per-request pipeline state. Stages mutate this object in place.
 * Handlers still receive the public `RequestContext` shape; extra fields
 * (`route`, `response`) are for pipeline stages.
 */
export type PipelineContext<TLocals = unknown> = RequestContext<TLocals> & {
    route?: Route;
    response?: ResponseData;
};

/**
 * A pipeline stage. Mutate `ctx` and return void/undefined to continue.
 * Return `ResponseData` to halt remaining stages and jump to `send`.
 */
export type Stage<TLocals = unknown> = (
    ctx: PipelineContext<TLocals>,
) => void | ResponseData | Promise<void | ResponseData | undefined>;

export type PipelineEntry = {
    name: StageName;
    stage: Stage;
    builtin?: boolean;
};
