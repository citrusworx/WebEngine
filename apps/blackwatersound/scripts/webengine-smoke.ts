/**
 * Load-only WebEngine bridge smoke for Blackwater Sound.
 * Does not replace the Docker stack — only validates kiwi.config.toml + kernel health.
 *
 * Usage (from monorepo root):
 *   yarn workspace @citrusworx/webengine exec node --import tsx ../../apps/blackwatersound/scripts/webengine-smoke.ts
 *
 * Or after build:
 *   node apps/blackwatersound/scripts/webengine-smoke.mjs
 */
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { runKernelLifecycle } from "@citrusworx/webengine";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const result = await runKernelLifecycle(appRoot);

console.log(
  JSON.stringify(
    {
      projectRoot: result.context.projectRoot,
      appName: result.context.kiwi.webengine.app_name,
      modules: result.sortedModuleIds,
      health: result.healthSummary,
      webRuntime: result.context.webRuntime?.name,
    },
    null,
    2,
  ),
);

if (!result.healthSummary.allOk) {
  process.exitCode = 1;
}
