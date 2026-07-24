import yaml from "js-yaml";
import { parse as parseToml } from "smol-toml";
import { findKiwiConfigPath, loadKiwiConfigFromPath, } from "./config/index.js";
import { runKernelLifecycle, shutdownKernel, } from "./kernel/index.js";
export { KIWI_CONFIG_FILENAME, findKiwiConfigPath, kiwiConfigSchema, loadKiwiConfigFromPath, parseYamlRuntimeDocument, resolveRuntimeConfigPath, webRuntimeConfigSchema, yamlRuntimeConfigSchema, } from "./config/index.js";
export { KernelContext, computeModuleClosure, createBuiltinRegistry, coreModule, embeddedRuntimeModule, nativeRuntimeModule, runKernelLifecycle, shutdownKernel, topologicalSortModules, webRuntimeModule, } from "./kernel/index.js";
export class WebEngine {
    static instance;
    initialized = false;
    initializing = false;
    /**
     * Metadata about the WebEngine and its operations for logging/debugging.
     */
    static metadata = {};
    blueprint;
    environment;
    deploymentManifest;
    cwd;
    kernelResult;
    loadedKiwi;
    constructor(config) {
        this.blueprint = config.blueprint;
        this.environment = config.environment;
        this.deploymentManifest = config.deploymentManifest;
        this.cwd = config.cwd ?? process.cwd();
    }
    static getInstance() {
        return WebEngine.instance;
    }
    getKernelContext() {
        return this.kernelResult?.context;
    }
    getHealthSummary() {
        return this.kernelResult?.healthSummary;
    }
    getKiwiConfig() {
        return this.loadedKiwi?.config ?? this.kernelResult?.context.kiwi;
    }
    /**
     * Parse config payloads used across lifecycle stages.
     */
    parse(input, method) {
        if (method === "yaml") {
            return yaml.load(input);
        }
        if (method === "toml") {
            return parseToml(input);
        }
        return JSON.parse(input);
    }
    /**
     * Initializes the WebEngine: loads kiwi.config.toml when present and runs
     * the kernel lifecycle (scaffold → bootstrap → health).
     */
    async init() {
        this.initializing = true;
        try {
            const configPath = findKiwiConfigPath(this.cwd);
            if (configPath) {
                this.loadedKiwi = await loadKiwiConfigFromPath(configPath);
                this.kernelResult = await runKernelLifecycle(this.loadedKiwi.projectRoot);
                WebEngine.metadata = {
                    ...WebEngine.metadata,
                    kiwiConfigPath: this.loadedKiwi.configPath,
                    health: this.kernelResult.healthSummary,
                    modules: this.kernelResult.sortedModuleIds,
                };
            }
            else {
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
        }
        finally {
            this.initializing = false;
        }
    }
    buildEnvironment() {
        return Promise.resolve();
    }
    buildApplication() {
        return Promise.resolve();
    }
    secureEnvironment() {
        return Promise.resolve();
    }
    deployApplication() {
        return Promise.resolve();
    }
    monitorApplication() {
        return Promise.resolve();
    }
    scaleApplication() {
        return Promise.resolve();
    }
    killApplication() {
        return Promise.resolve();
    }
    cleanupEnvironment() {
        return Promise.resolve();
    }
    async teardown() {
        if (this.kernelResult) {
            await shutdownKernel(this.kernelResult.modulesInOrder, this.kernelResult.context);
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
//# sourceMappingURL=index.js.map