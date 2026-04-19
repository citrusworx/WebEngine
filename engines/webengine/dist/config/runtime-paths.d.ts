import type { KiwiConfig } from "./kiwi-schema.js";
export type RuntimeKind = "web" | "native" | "embedded";
/**
 * Resolves the config file path for a KiwiEngine runtime relative to the kiwi.config.toml directory.
 * Precedence: `[runtimes.<kind>].path` → `[runtimes.<kind>].config_file` → (web only) legacy `[web.runtime].config_file` → default basename.
 */
export declare function resolveRuntimeConfigPath(kiwi: KiwiConfig, projectRoot: string, kind: RuntimeKind, defaultBasename: string): string;
