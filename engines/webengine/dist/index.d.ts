import type { Blueprint, DeploymentManifest, Environment } from "@citrusworx/types";
import { type KiwiConfig } from "./config/index.js";
import { KernelContext, type HealthSummary } from "./kernel/index.js";
export type { KiwiConfig, LoadedKiwiConfig, WebRuntimeConfig, YamlRuntimeConfig, } from "./config/index.js";
export { KIWI_CONFIG_FILENAME, findKiwiConfigPath, kiwiConfigSchema, loadKiwiConfigFromPath, parseYamlRuntimeDocument, resolveRuntimeConfigPath, webRuntimeConfigSchema, yamlRuntimeConfigSchema, } from "./config/index.js";
export type { HealthResult, HealthSummary, KernelModule, KernelRunResult, ModuleHealth, } from "./kernel/index.js";
export { KernelContext, computeModuleClosure, createBuiltinRegistry, coreModule, embeddedRuntimeModule, nativeRuntimeModule, runKernelLifecycle, shutdownKernel, topologicalSortModules, webRuntimeModule, } from "./kernel/index.js";
export interface WebEngineConfig {
    blueprint: Blueprint;
    environment: Environment;
    deploymentManifest: DeploymentManifest;
    /** Optional project directory used to locate kiwi.config.toml during init. */
    cwd?: string;
}
export declare class WebEngine {
    private static instance;
    initialized: boolean;
    initializing: boolean;
    /**
     * Metadata about the WebEngine and its operations for logging/debugging.
     */
    private static metadata;
    private blueprint;
    private environment;
    private deploymentManifest;
    private cwd;
    private kernelResult;
    private loadedKiwi;
    constructor(config: WebEngineConfig);
    static getInstance(): WebEngine | undefined;
    getKernelContext(): KernelContext | undefined;
    getHealthSummary(): HealthSummary | undefined;
    getKiwiConfig(): KiwiConfig | undefined;
    /**
     * Parse config payloads used across lifecycle stages.
     */
    parse<T>(input: string, method?: "yaml" | "toml" | "json"): T;
    /**
     * Initializes the WebEngine: loads kiwi.config.toml when present and runs
     * the kernel lifecycle (scaffold → bootstrap → health).
     */
    init(): Promise<this>;
    buildEnvironment(): Promise<void>;
    buildApplication(): Promise<void>;
    secureEnvironment(): Promise<void>;
    deployApplication(): Promise<void>;
    monitorApplication(): Promise<void>;
    scaleApplication(): Promise<void>;
    killApplication(): Promise<void>;
    cleanupEnvironment(): Promise<void>;
    teardown(): Promise<void>;
}
