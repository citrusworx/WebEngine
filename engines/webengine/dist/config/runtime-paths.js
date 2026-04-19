import * as path from "node:path";
/**
 * Resolves the config file path for a KiwiEngine runtime relative to the kiwi.config.toml directory.
 * Precedence: `[runtimes.<kind>].path` → `[runtimes.<kind>].config_file` → (web only) legacy `[web.runtime].config_file` → default basename.
 */
export function resolveRuntimeConfigPath(kiwi, projectRoot, kind, defaultBasename) {
    const entry = kiwi.runtimes?.[kind];
    const legacyWeb = kind === "web" ? kiwi.web?.runtime?.config_file : undefined;
    const rel = entry?.path ?? entry?.config_file ?? legacyWeb ?? defaultBasename;
    return path.resolve(projectRoot, rel);
}
//# sourceMappingURL=runtime-paths.js.map