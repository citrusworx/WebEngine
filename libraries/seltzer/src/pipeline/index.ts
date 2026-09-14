import { isResponseData, type ResponseData } from "../core/response.js";
import type { CompiledRoute } from "./router.js";
import {
    contextStage,
    createRouteStage,
    handleStage,
    parseStage,
    responseStage,
    sendStage,
    validateStage,
} from "./stages.js";
import type { PipelineContext, PipelineEntry, Stage, StageName } from "./types.js";

export type { PipelineContext, PipelineEntry, Stage, StageName } from "./types.js";
export { STAGE_NAMES } from "./types.js";
export type { CompiledRoute } from "./router.js";
export { compileRoute } from "./router.js";

function internalError(error: unknown): ResponseData {
    return {
        status: 500,
        body: {
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : String(error),
        },
    };
}

export class Pipeline {
    private readonly entries: PipelineEntry[];

    constructor(entries: PipelineEntry[]) {
        this.entries = [...entries];
    }

    /** Insert `stage` immediately before the builtin stage named `name`. */
    before(name: StageName, stage: Stage): this {
        const index = this.entries.findIndex((entry) => entry.name === name && entry.builtin);
        if (index === -1) {
            throw new Error(`Unknown pipeline stage "${name}"`);
        }

        this.entries.splice(index, 0, { name, stage });
        return this;
    }

    async run(ctx: PipelineContext): Promise<void> {
        let skipToSend = false;

        for (const entry of this.entries) {
            if (skipToSend && !(entry.name === "send" && entry.builtin)) {
                continue;
            }

            try {
                const result = await entry.stage(ctx);
                if (result !== undefined && isResponseData(result)) {
                    ctx.response = result;
                    skipToSend = true;
                }
            } catch (error) {
                ctx.response = internalError(error);
                skipToSend = true;
            }
        }
    }
}

export function createDefaultPipeline(getRoutes: () => CompiledRoute[]): Pipeline {
    return new Pipeline([
        { name: "parse", stage: parseStage, builtin: true },
        { name: "context", stage: contextStage, builtin: true },
        { name: "route", stage: createRouteStage(getRoutes), builtin: true },
        { name: "validate", stage: validateStage, builtin: true },
        { name: "handle", stage: handleStage, builtin: true },
        { name: "response", stage: responseStage, builtin: true },
        { name: "send", stage: sendStage, builtin: true },
    ]);
}
