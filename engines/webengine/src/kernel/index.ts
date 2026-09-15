export {
    KernelContext,
    type HealthResult,
    type HealthSummary,
    type KernelModule,
    type ModuleHealth,
} from "./types.js";
export {
    computeModuleClosure,
    topologicalSortModules,
} from "./toposort.js";
export { createBuiltinRegistry } from "./registry.js";
export {
    runKernelLifecycle,
    shutdownKernel,
    type KernelRunResult,
} from "./orchestrator.js";
export { coreModule } from "./modules/core-module.js";
export { webRuntimeModule } from "./modules/web-runtime-module.js";
export { nativeRuntimeModule } from "./modules/native-runtime-module.js";
export { embeddedRuntimeModule } from "./modules/embedded-runtime-module.js";
export {
    NECTARINE_MODULE_ID,
    applyNectarineMigrations,
    createNectarineModule,
    listNectarineApiOperations,
    nectarineModule,
    type NectarineKernelAdapter,
    type NectarineModuleHandle,
    type NectarineModuleOptions,
} from "./modules/nectarine-module.js";
export {
    compileResourceQuery,
    createCompiledNectarineExecute,
    createNectarineHandleReadRoutes,
    createNectarineReadRoutes,
    createResourceReadRoutes,
    isSingularRead,
    listResourceReadOperations,
    pathBindValues,
    resolveResourceQueries,
    type CompiledNectarineExecuteOptions,
    type CreateNectarineReadRoutesOptions,
    type NectarineQueryFn,
    type NectarineRouteSource,
    type ReadRouteExclude,
} from "./modules/nectarine-routes.js";
