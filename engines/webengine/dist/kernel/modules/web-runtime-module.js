import * as fs from "node:fs/promises";
import JSON5 from "json5";
import { resolveRuntimeConfigPath } from "../../config/runtime-paths.js";
import { webRuntimeConfigSchema } from "../../config/kiwi-schema.js";
function resolveWebRuntimePath(ctx) {
    return resolveRuntimeConfigPath(ctx.kiwi, ctx.projectRoot, "web", "webengine.config.json5");
}
export const webRuntimeModule = {
    id: "web",
    dependencies: ["core"],
    async scaffold(_ctx) {
        // v1: optional future dirs for web assets
    },
    async bootstrap(ctx) {
        const configPath = resolveWebRuntimePath(ctx);
        let raw;
        try {
            raw = await fs.readFile(configPath, "utf8");
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(`Web runtime config not readable at ${configPath}: ${msg}`);
        }
        const parsed = JSON5.parse(raw);
        const result = webRuntimeConfigSchema.safeParse(parsed);
        if (!result.success) {
            const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
            throw new Error(`Invalid webengine.config.json5: ${msg}`);
        }
        ctx.webRuntime = result.data;
        ctx.registerModuleHandle("web", { configPath, config: result.data });
    },
    async health(ctx) {
        if (!ctx.webRuntime) {
            return { ok: false, detail: "webRuntime not loaded" };
        }
        return { ok: true, detail: "webengine.config.json5 applied" };
    },
    async shutdown(_ctx) {
        // noop
    },
};
//# sourceMappingURL=web-runtime-module.js.map