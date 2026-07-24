import yaml from "js-yaml";
import { parse as parseToml } from "smol-toml";
import type {
    Blueprint,
    DeploymentManifest,
    Environment,
} from "@citrusworx/types";
import {
    findKiwiConfigPath,
    loadKiwiConfigFromPath,
    type KiwiConfig,
    type LoadedKiwiConfig,
} from "./config/index.js";
import {
    KernelContext,
    runKernelLifecycle,
    shutdownKernel,
    type HealthSummary,
    type KernelRunResult,
} from "./kernel/index.js";

export type {
    KiwiConfig,
    LoadedKiwiConfig,
    WebRuntimeConfig,
    YamlRuntimeConfig,
} from "./config/index.js";
export {
    KIWI_CONFIG_FILENAME,
    findKiwiConfigPath,
    kiwiConfigSchema,
    loadKiwiConfigFromPath,
    parseYamlRuntimeDocument,
    resolveRuntimeConfigPath,
    webRuntimeConfigSchema,
    yamlRuntimeConfigSchema,
} from "./config/index.js";

export type {
    HealthResult,
    HealthSummary,
    KernelModule,
    KernelRunResult,
    ModuleHealth,
} from "./kernel/index.js";
export {
    KernelContext,
    computeModuleClosure,
    createBuiltinRegistry,
    coreModule,
    embeddedRuntimeModule,
    nativeRuntimeModule,
    runKernelLifecycle,
    shutdownKernel,
    topologicalSortModules,
    webRuntimeModule,
} from "./kernel/index.js";

export interface WebEngineConfig {
    blueprint: Blueprint;
    environment: Environment;
    deploymentManifest: DeploymentManifest;
    /** Optional project directory used to locate kiwi.config.toml during init. */
    cwd?: string;
}

export class WebEngine {
    private static instance: WebEngine | undefined;
    initialized = false;
    initializing = false;

    /**
     * Metadata about the WebEngine and its operations for logging/debugging.
     */
    private static metadata: Record<string, unknown> = {};

    private blueprint: Blueprint;
    private environment: Environment;
    private deploymentManifest: DeploymentManifest;
    private cwd: string;

    private kernelResult: KernelRunResult | undefined;
    private loadedKiwi: LoadedKiwiConfig | undefined;

    constructor(config: WebEngineConfig) {
        this.blueprint = config.blueprint;
        this.environment = config.environment;
        this.deploymentManifest = config.deploymentManifest;
        this.cwd = config.cwd ?? process.cwd();
    }

    static getInstance(): WebEngine | undefined {
        return WebEngine.instance;
    }

    getKernelContext(): KernelContext | undefined {
        return this.kernelResult?.context;
    }

    getHealthSummary(): HealthSummary | undefined {
        return this.kernelResult?.healthSummary;
    }

    getKiwiConfig(): KiwiConfig | undefined {
        return this.loadedKiwi?.config ?? this.kernelResult?.context.kiwi;
    }

    /**
     * Parse config payloads used across lifecycle stages.
     */
    parse<T>(input: string, method?: "yaml" | "toml" | "json"): T {
        if (method === "yaml") {
            return yaml.load(input) as T;
        }
        if (method === "toml") {
            return parseToml(input) as T;
        }
        return JSON.parse(input) as T;
    }

    /**
     * Initializes the WebEngine: loads kiwi.config.toml when present and runs
     * the kernel lifecycle (scaffold → bootstrap → health).
     */
    async init(): Promise<this> {
        this.initializing = true;
        try {
            const configPath = findKiwiConfigPath(this.cwd);
            if (configPath) {
                this.loadedKiwi = await loadKiwiConfigFromPath(configPath);
                this.kernelResult = await runKernelLifecycle(
                    this.loadedKiwi.projectRoot,
                );
                WebEngine.metadata = {
                    ...WebEngine.metadata,
                    kiwiConfigPath: this.loadedKiwi.configPath,
                    health: this.kernelResult.healthSummary,
                    modules: this.kernelResult.sortedModuleIds,
                };
            } else {
                // Blueprint-only init: keep legacy path without requiring kiwi.config.toml.
                WebEngine.metadata = {
                    ...WebEngine.metadata,
                    blueprint: this.blueprint.name,
                    environment: this.environment,
                    note: "kiwi.config.toml not found; kernel lifecycle skipped",
                };
            }
            this.initialized = true;
            WebEngine.instance = this;
            return this;
        } finally {
            this.initializing = false;
        }
    }

    buildEnvironment(): Promise<void> {
        return Promise.resolve();
    }

    buildApplication(): Promise<void> {
        return Promise.resolve();
    }

    secureEnvironment(): Promise<void> {
        return Promise.resolve();
    }

    deployApplication(): Promise<void> {
        return Promise.resolve();
    }

    monitorApplication(): Promise<void> {
        return Promise.resolve();
    }

    scaleApplication(): Promise<void> {
        return Promise.resolve();
    }

    killApplication(): Promise<void> {
        return Promise.resolve();
    }

    cleanupEnvironment(): Promise<void> {
        return Promise.resolve();
    }

    async teardown(): Promise<void> {
        if (this.kernelResult) {
            await shutdownKernel(
                this.kernelResult.modulesInOrder,
                this.kernelResult.context,
            );
        }
        await this.cleanupEnvironment();
        this.kernelResult = undefined;
        this.loadedKiwi = undefined;
        this.initialized = false;
        WebEngine.metadata = {};
        if (WebEngine.instance === this) {
            WebEngine.instance = undefined;
        }
    }
}
