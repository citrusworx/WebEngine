import {
    genericInternalError,
    invalidReturnResponse,
    logInvalidReturn,
    logThrown,
    routePhrase,
} from "../core/log.js";
import { guardRawResponse } from "../core/raw-response.js";
import { isResponseData } from "../core/response.js";
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
export { compileRoute, comparePathRank, matchRoute, rankPath } from "./router.js";

export class Pipeline {
    private readonly entries: PipelineEntry[];

    constructor(entries: PipelineEntry[]) {
        this.entries = [...entries];
    }

    private builtinIndex(name: StageName): number {
        const index = this.entries.findIndex((entry) => entry.name === name && entry.builtin);
        if (index === -1) {
            throw new Error(`Unknown pipeline stage "${name}"`);
        }

        return index;
    }

    /** Insert `stage` immediately before the builtin stage named `name`. */
    before(name: StageName, stage: Stage): this {
        this.entries.splice(this.builtinIndex(name), 0, { name, stage, user: true });
        return this;
    }

    /**
     * Swap the builtin stage named `name`. Inserted `before` stages are left in place.
     * The replacement stays builtin so later `before(name, …)` still finds it.
     * `send` cannot be replaced: the runtime is the only writer.
     */
    replace(name: StageName, stage: Stage): this {
        if (name === "send") {
            throw new Error(
                'Cannot replace pipeline stage "send". Handlers and hooks return ResponseData; Seltzer writes the HTTP response.',
            );
        }

        const index = this.builtinIndex(name);
        this.entries[index] = { name, stage, builtin: true, user: true };
        return this;
    }

    async run(ctx: PipelineContext): Promise<void> {
        let skipToSend = false;

        for (const entry of this.entries) {
            if (skipToSend && !(entry.name === "send" && entry.builtin)) {
                continue;
            }

            const realRes = ctx.res;
            if (entry.user && ctx.res) {
                ctx.res = guardRawResponse(ctx.res);
            }

            try {
                const result = await entry.stage(ctx);
                if (result !== undefined) {
                    if (isResponseData(result)) {
                        ctx.response = result;
                        skipToSend = true;
                    } else {
                        const kind = entry.user ? "hook" : "stage";
                        logInvalidReturn(ctx, result, `${routePhrase(ctx)} ${kind} "${entry.name}"`);
                        ctx.response = invalidReturnResponse();
                        skipToSend = true;
                    }
                }
            } catch (error) {
                logThrown(ctx, entry.user ? `hook "${entry.name}"` : `stage "${entry.name}"`, error);
                ctx.response = genericInternalError();
                skipToSend = true;
            } finally {
                if (entry.user && realRes) {
                    ctx.res = realRes;
                }
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
