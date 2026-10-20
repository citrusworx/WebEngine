import type { SeltzerLogger } from "../core/log.js";
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
    /**
     * Byte cap for `parse`. Set from `listen({ bodyLimit })`.
     * `0` is unlimited. Omitted uses the 1 MB default inside `parse`.
     */
    bodyLimit?: number;
    /** From `listen({ logger })`. Omitted lines go to `console.error`. */
    logger?: SeltzerLogger;
    /** From `listen({ debug })`. Stack traces are logged only when true. */
    debug?: boolean;
};

/**
 * A pipeline stage. Mutate `ctx` and return void/undefined to continue.
 * Return `ResponseData` to halt remaining stages and jump to `send`.
 * Any other return is a 500.
 */
export type Stage<TLocals = unknown> = (
    ctx: PipelineContext<TLocals>,
) => void | ResponseData | Promise<void | ResponseData | undefined>;

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
