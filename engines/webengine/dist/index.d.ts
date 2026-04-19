import { Blueprint } from "@citrusworx/types";
import { Environment } from "@citrusworx/types";
import type { HealthSummary, KernelContext } from "./kernel/types.js";
export { findKiwiConfigPath, KIWI_CONFIG_FILENAME } from "./config/find-kiwi-config.js";
export { loadKiwiConfigFromPath, loadKiwiConfigFromPath as loadKiwiConfig } from "./config/load-kiwi-config.js";
export type { KiwiConfig, WebRuntimeConfig, YamlRuntimeConfig } from "./config/kiwi-schema.js";
export { kiwiConfigSchema, webRuntimeConfigSchema, yamlRuntimeConfigSchema } from "./config/kiwi-schema.js";
export { resolveRuntimeConfigPath, type RuntimeKind } from "./config/runtime-paths.js";
export { runKernelLifecycle, shutdownKernel } from "./kernel/orchestrator.js";
export { createBuiltinRegistry } from "./kernel/registry.js";
export type { HealthResult, HealthSummary, KernelModule, ModuleHealth } from "./kernel/types.js";
export { KernelContext } from "./kernel/types.js";
export declare class WebEngine {
    private currentBlueprint?;
    private manifest;
    private kernelContext;
    private healthSummary;
    private modulesInOrder;
    constructor();
    /**
     * Loads kiwi.config.toml, runs scaffold → bootstrap → health for enabled kernel modules.
     */
    start(options?: {
        cwd?: string;
    }): Promise<void>;
    getKernelContext(): KernelContext | null;
    getHealthSummary(): HealthSummary | null;
    assertHealthy(): void;
    shutdown(): Promise<void>;
    loadBlueprint(blueprint: Blueprint, _custom?: string): void;
    resolveModules(): void;
    deploy(env: Environment): void;
    private validateBlueprint;
    private buildManifest;
}
