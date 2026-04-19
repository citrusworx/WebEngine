import type { KernelModule } from "./types.js";
/** Built-in modules keyed by id (extensible with dynamic registration later). */
export declare function createBuiltinRegistry(): Map<string, KernelModule>;
