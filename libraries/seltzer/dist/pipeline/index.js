import { isResponseData } from "../core/response.js";
import { contextStage, createRouteStage, handleStage, parseStage, responseStage, sendStage, validateStage, } from "./stages.js";
export { STAGE_NAMES } from "./types.js";
export { compileRoute, comparePathRank, matchRoute, rankPath } from "./router.js";
function internalError(error) {
    return {
        status: 500,
        body: {
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : String(error),
        },
    };
}
export class Pipeline {
    constructor(entries) {
        this.entries = [...entries];
    }
    builtinIndex(name) {
        const index = this.entries.findIndex((entry) => entry.name === name && entry.builtin);
        if (index === -1) {
            throw new Error(`Unknown pipeline stage "${name}"`);
        }
        return index;
    }
    /** Insert `stage` immediately before the builtin stage named `name`. */
    before(name, stage) {
        this.entries.splice(this.builtinIndex(name), 0, { name, stage });
        return this;
    }
    /**
     * Swap the builtin stage named `name`. Inserted `before` stages are left in place.
     * The replacement stays builtin so later `before(name, …)` still finds it.
     */
    replace(name, stage) {
        const index = this.builtinIndex(name);
        this.entries[index] = { name, stage, builtin: true };
        return this;
    }
    async run(ctx) {
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
            }
            catch (error) {
                ctx.response = internalError(error);
                skipToSend = true;
            }
        }
    }
}
export function createDefaultPipeline(getRoutes) {
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
//# sourceMappingURL=index.js.map