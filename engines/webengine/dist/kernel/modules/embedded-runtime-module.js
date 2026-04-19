import * as fs from "node:fs/promises";
import { parseYamlRuntimeDocument } from "../../config/parse-yaml-runtime.js";
import { resolveRuntimeConfigPath } from "../../config/runtime-paths.js";
export const embeddedRuntimeModule = {
    id: "embedded",
    dependencies: ["core"],
    async scaffold(_ctx) {
        // v1: optional firmware / device tree hooks
    },
    async bootstrap(ctx) {
        const configPath = resolveRuntimeConfigPath(ctx.kiwi, ctx.projectRoot, "embedded", "embedded.runtime.yaml");
        let raw;
        try {
            raw = await fs.readFile(configPath, "utf8");
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(`Embedded runtime config not readable at ${configPath}: ${msg}`);
        }
        const data = parseYamlRuntimeDocument(raw, "Embedded runtime YAML");
        ctx.embeddedRuntime = data;
        ctx.registerModuleHandle("embedded", { configPath, config: data });
    },
    async health(ctx) {
        if (!ctx.embeddedRuntime) {
            return { ok: false, detail: "embeddedRuntime not loaded" };
        }
        return { ok: true, detail: "embedded.runtime.yaml applied" };
    },
    async shutdown(_ctx) {
        // noop
    },
};
//# sourceMappingURL=embedded-runtime-module.js.map