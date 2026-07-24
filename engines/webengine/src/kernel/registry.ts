import { coreModule } from "./modules/core-module.js";
import { embeddedRuntimeModule } from "./modules/embedded-runtime-module.js";
import { nativeRuntimeModule } from "./modules/native-runtime-module.js";
import { webRuntimeModule } from "./modules/web-runtime-module.js";
import type { KernelModule } from "./types.js";

/** Built-in modules keyed by id (extensible with dynamic registration later). */
export function createBuiltinRegistry(): Map<string, KernelModule> {
    return new Map([
        ["core", coreModule],
        ["web", webRuntimeModule],
        ["native", nativeRuntimeModule],
        ["embedded", embeddedRuntimeModule],
    ]);
}
