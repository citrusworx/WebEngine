import type { KernelModule } from "./types.js";
/**
 * Adds transitive dependencies so prerequisites are included in the graph.
 */
export declare function computeModuleClosure(enabled: readonly string[], registry: ReadonlyMap<string, KernelModule>): string[];
/**
 * Kahn topological sort. `ids` must include every dependency edge endpoint.
 */
export declare function topologicalSortModules(ids: readonly string[], registry: ReadonlyMap<string, KernelModule>): string[];
