import { NectarineConfig } from "./NectarineConfig.js";
import type { LoadNectarineConfigOptions } from "./types.js";

/**
 * Load a project `nectarine.config.yaml` and its resource triads.
 *
 * This is the supported entrypoint for apps. Consumers should not write
 * their own YAML/config bootstrap helpers.
 *
 * @example
 * ```ts
 * import { loadNectarineConfig } from "@citrusworx/nectarine";
 *
 * const config = loadNectarineConfig("./nectarine.config.yaml");
 * const creds = config.resolveCredentials();
 * const product = config.getResource("product");
 * ```
 */
export function loadNectarineConfig(
    configPath: string,
    options?: LoadNectarineConfigOptions,
): NectarineConfig {
    return NectarineConfig.load(configPath, options);
}
