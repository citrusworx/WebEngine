import * as fs from "node:fs/promises";
import { parseYamlRuntimeDocument } from "../../config/parse-yaml-runtime.js";
import { resolveRuntimeConfigPath } from "../../config/runtime-paths.js";
export const nativeRuntimeModule = {
    id: "native",
    dependencies: ["core"],
    async scaffold(_ctx) {
        // v1: optional native project scaffolding
    },
    async bootstrap(ctx) {
        const configPath = resolveRuntimeConfigPath(ctx.kiwi, ctx.projectRoot, "native", "native.runtime.yaml");
        let raw;
        try {
            raw = await fs.readFile(configPath, "utf8");
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(`Native runtime config not readable at ${configPath}: ${msg}`);
        }
        const data = parseYamlRuntimeDocument(raw, "Native runtime YAML");
        ctx.nativeRuntime = data;
        ctx.registerModuleHandle("native", { configPath, config: data });
    },
    async health(ctx) {
        if (!ctx.nativeRuntime) {
            return { ok: false, detail: "nativeRuntime not loaded" };
        }
        return { ok: true, detail: "native.runtime.yaml applied" };
    },
    async shutdown(_ctx) {
        // noop
    },
};
//# sourceMappingURL=native-runtime-module.js.map