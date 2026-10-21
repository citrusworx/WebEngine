import { listApiOperations, } from "@citrusworx/nectarine";
import { generateRoutes, } from "@citrusworx/seltzer";
/**
 * Witness that Nectarine `listApiOperations` output is assignable to
 * Seltzer `ApiOperation`. `tsc` rejects this file when the shapes diverge.
 * Seltzer does not import Nectarine; this module lives in WebEngine,
 * which already depends on both.
 */
export const nectarineApiOperationMatchesSeltzer = true;
export function routesFromListApiOperations(resource, api) {
    const operations = listApiOperations(resource, api);
    return generateRoutes(operations, {
        execute: () => [],
    });
}
//# sourceMappingURL=api-operation-assignability.js.map