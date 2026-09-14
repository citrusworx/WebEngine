import type { CompiledRoute } from "./router.js";
import type { PipelineContext, PipelineEntry, Stage, StageName } from "./types.js";
export type { PipelineContext, PipelineEntry, Stage, StageName } from "./types.js";
export { STAGE_NAMES } from "./types.js";
export type { CompiledRoute } from "./router.js";
export { compileRoute, comparePathRank, matchRoute, rankPath } from "./router.js";
export declare class Pipeline {
    private readonly entries;
    constructor(entries: PipelineEntry[]);
    private builtinIndex;
    /** Insert `stage` immediately before the builtin stage named `name`. */
    before(name: StageName, stage: Stage): this;
    /**
     * Swap the builtin stage named `name`. Inserted `before` stages are left in place.
     * The replacement stays builtin so later `before(name, …)` still finds it.
     */
    replace(name: StageName, stage: Stage): this;
    run(ctx: PipelineContext): Promise<void>;
}
export declare function createDefaultPipeline(getRoutes: () => CompiledRoute[]): Pipeline;
