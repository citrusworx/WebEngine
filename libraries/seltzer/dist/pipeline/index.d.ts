import type { CompiledRoute } from "./router.js";
import type { PipelineContext, PipelineEntry, Stage, StageName } from "./types.js";
export type { PipelineContext, PipelineEntry, Stage, StageName } from "./types.js";
export { STAGE_NAMES } from "./types.js";
export type { CompiledRoute } from "./router.js";
export { compileRoute } from "./router.js";
export declare class Pipeline {
    private readonly entries;
    constructor(entries: PipelineEntry[]);
    /** Insert `stage` immediately before the builtin stage named `name`. */
    before(name: StageName, stage: Stage): this;
    run(ctx: PipelineContext): Promise<void>;
}
export declare function createDefaultPipeline(getRoutes: () => CompiledRoute[]): Pipeline;
