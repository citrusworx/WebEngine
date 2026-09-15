"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadNectarineConfig = loadNectarineConfig;
const NectarineConfig_js_1 = require("./NectarineConfig.js");
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
function loadNectarineConfig(configPath, options) {
    return NectarineConfig_js_1.NectarineConfig.load(configPath, options);
}
//# sourceMappingURL=loadConfig.js.map