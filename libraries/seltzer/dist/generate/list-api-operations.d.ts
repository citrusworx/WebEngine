import { type ApiOperation } from "./types.js";
/**
 * Flatten loaded `*API.yml` (`resource → crud → operation → api`) into {@link ApiOperation}s.
 *
 * Lives next to {@link generateRoutes} so Nectarine can absorb this helper later
 * without changing the route compiler.
 */
export declare function listApiOperations(api: Record<string, unknown>): ApiOperation[];
