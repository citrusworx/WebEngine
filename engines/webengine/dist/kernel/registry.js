import { coreModule } from "./modules/core-module.js";
import { embeddedRuntimeModule } from "./modules/embedded-runtime-module.js";
import { nativeRuntimeModule } from "./modules/native-runtime-module.js";
import { webRuntimeModule } from "./modules/web-runtime-module.js";
/** Built-in modules keyed by id (extensible with dynamic registration later). */
export function createBuiltinRegistry() {
    return new Map([
        ["core", coreModule],
        ["web", webRuntimeModule],
        ["native", nativeRuntimeModule],
        ["embedded", embeddedRuntimeModule],
    ]);
}
//# sourceMappingURL=registry.js.map