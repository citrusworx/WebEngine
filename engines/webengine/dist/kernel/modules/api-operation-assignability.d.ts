import { type ApiOperation as NectarineApiOperation } from "@citrusworx/nectarine";
import { type ApiOperation as SeltzerApiOperation } from "@citrusworx/seltzer";
/**
 * True when the two `ApiOperation` aliases are the same structure.
 * Optional fields on only one side fail this check.
 */
type Identical<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type NectarineMatchesSeltzer = Identical<NectarineApiOperation, SeltzerApiOperation>;
/**
 * Witness that Nectarine `listApiOperations` output is assignable to
 * Seltzer `ApiOperation`. `tsc` rejects this file when the shapes diverge.
 * Seltzer does not import Nectarine; this module lives in WebEngine,
 * which already depends on both.
 */
export declare const nectarineApiOperationMatchesSeltzer: NectarineMatchesSeltzer;
export declare function routesFromListApiOperations(resource: string, api: Record<string, unknown>): import("@citrusworx/seltzer").Route<import("@citrusworx/seltzer").RequestContext>[];
export {};
