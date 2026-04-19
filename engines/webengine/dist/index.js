import { runKernelLifecycle, shutdownKernel } from "./kernel/orchestrator.js";
export { findKiwiConfigPath, KIWI_CONFIG_FILENAME } from "./config/find-kiwi-config.js";
export { loadKiwiConfigFromPath, loadKiwiConfigFromPath as loadKiwiConfig } from "./config/load-kiwi-config.js";
export { kiwiConfigSchema, webRuntimeConfigSchema, yamlRuntimeConfigSchema } from "./config/kiwi-schema.js";
export { resolveRuntimeConfigPath } from "./config/runtime-paths.js";
export { runKernelLifecycle, shutdownKernel } from "./kernel/orchestrator.js";
export { createBuiltinRegistry } from "./kernel/registry.js";
export { KernelContext } from "./kernel/types.js";
export class WebEngine {
    currentBlueprint;
    manifest = null;
    kernelContext = null;
    healthSummary = null;
    modulesInOrder = [];
    constructor() {
        console.log("WebEngine initialized");
    }
    /**
     * Loads kiwi.config.toml, runs scaffold → bootstrap → health for enabled kernel modules.
     */
    async start(options) {
        const cwd = options?.cwd ?? process.cwd();
        const result = await runKernelLifecycle(cwd);
        this.kernelContext = result.context;
        this.healthSummary = result.healthSummary;
        this.modulesInOrder = result.modulesInOrder;
        console.log("WebEngine runtime started");
    }
    getKernelContext() {
        return this.kernelContext;
    }
    getHealthSummary() {
        return this.healthSummary;
    }
    assertHealthy() {
        if (!this.healthSummary) {
            throw new Error("Kernel has not been started; call start() first");
        }
        if (!this.healthSummary.allOk) {
            const failed = this.healthSummary.modules.filter((m) => !m.ok);
            const msg = failed.map((m) => `${m.id}: ${m.detail ?? "unhealthy"}`).join("; ");
            throw new Error(`Kernel health check failed: ${msg}`);
        }
    }
    async shutdown() {
        if (this.kernelContext && this.modulesInOrder.length > 0) {
            await shutdownKernel(this.modulesInOrder, this.kernelContext);
        }
        this.kernelContext = null;
        this.healthSummary = null;
        this.modulesInOrder = [];
    }
    loadBlueprint(blueprint, _custom) {
        this.validateBlueprint(blueprint);
        this.currentBlueprint = blueprint;
        console.log(`Blueprint loaded: ${blueprint.name}`);
    }
    resolveModules() {
        if (!this.currentBlueprint) {
            throw new Error("No blueprint loaded");
        }
        console.log("Resolving modules...");
        for (const module of this.currentBlueprint.modules) {
            console.log(`Loading module: ${module}`);
        }
    }
    deploy(env) {
        if (!this.currentBlueprint) {
            throw new Error("Cannot deploy without a blueprint");
        }
        console.log(`Deploying ${this.currentBlueprint.name} to ${env}`);
    }
    validateBlueprint(blueprint) {
        if (!blueprint.modules || blueprint.modules.length === 0) {
            throw new Error("Blueprint must include modules");
        }
    }
    buildManifest(id, createdAt, projectId, env, blueprintName) {
        const manifest = {
            id,
            createdAt,
            projectId,
            blueprint: blueprintName,
            environment: env,
            services: ["service"],
            modules: this.currentBlueprint.modules,
            adapters: this.currentBlueprint?.adapters,
            infrastructure: {
                server: true,
                database: true,
            },
        };
        this.manifest = manifest;
        return manifest;
    }
}
//# sourceMappingURL=index.js.map