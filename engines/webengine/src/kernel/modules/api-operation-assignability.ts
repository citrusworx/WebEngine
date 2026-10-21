import {
    listApiOperations,
    type ApiOperation as NectarineApiOperation,
} from "@citrusworx/nectarine";
import {
    generateRoutes,
    type ApiOperation as SeltzerApiOperation,
} from "@citrusworx/seltzer";

/**
 * True when the two `ApiOperation` aliases are the same structure.
 * Optional fields on only one side fail this check.
 */
type Identical<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false;

type NectarineMatchesSeltzer = Identical<NectarineApiOperation, SeltzerApiOperation>;

/**
 * Witness that Nectarine `listApiOperations` output is assignable to
 * Seltzer `ApiOperation`. `tsc` rejects this file when the shapes diverge.
 * Seltzer does not import Nectarine; this module lives in WebEngine,
 * which already depends on both.
 */
export const nectarineApiOperationMatchesSeltzer: NectarineMatchesSeltzer = true;

export function routesFromListApiOperations(
    resource: string,
    api: Record<string, unknown>,
) {
    const operations: readonly SeltzerApiOperation[] = listApiOperations(resource, api);
    return generateRoutes(operations, {
        execute: () => [],
    });
}
