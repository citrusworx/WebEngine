import { findKiwiConfigPath } from "../config/find-kiwi-config.js";
import { loadKiwiConfigFromPath } from "../config/load-kiwi-config.js";
import { createBuiltinRegistry } from "./registry.js";
import { computeModuleClosure, topologicalSortModules } from "./toposort.js";
import {
    KernelContext,
    type HealthSummary,
    type KernelModule,
} from "./types.js";

export interface KernelRunResult {
    context: KernelContext;
    healthSummary: HealthSummary;
    sortedModuleIds: string[];
    modulesInOrder: KernelModule[];
}

/**
 * Full lifecycle: load kiwi.config.toml → scaffold → bootstrap → health.
 */
export async function runKernelLifecycle(
    cwd: string = process.cwd(),
): Promise<KernelRunResult> {
    const configPath = findKiwiConfigPath(cwd);
    if (!configPath) {
        throw new Error(
            `kiwi.config.toml not found searching upward from ${cwd}`,
        );
    }
    const { config, projectRoot } = await loadKiwiConfigFromPath(configPath);
    const ctx = new KernelContext(config, projectRoot);
    const registry = createBuiltinRegistry();
    const enabled = config.kernel.modules;
    const closure = computeModuleClosure(enabled, registry);
    const sortedIds = topologicalSortModules(closure, registry);
    const modulesInOrder = sortedIds.map((id) => registry.get(id)!);

    for (const mod of modulesInOrder) {
        await mod.scaffold?.(ctx);
    }
    for (const mod of modulesInOrder) {
        await mod.bootstrap(ctx);
    }

    const modules = [];
    for (const mod of modulesInOrder) {
        const h = await mod.health(ctx);
        modules.push({ id: mod.id, ok: h.ok, detail: h.detail });
    }

    const healthSummary: HealthSummary = {
        allOk: modules.every((m) => m.ok),
        modules,
    };

    return {
        context: ctx,
        healthSummary,
        sortedModuleIds: sortedIds,
        modulesInOrder,
    };
}

export async function shutdownKernel(
    modulesInOrder: readonly KernelModule[],
    ctx: KernelContext,
): Promise<void> {
    for (const mod of [...modulesInOrder].reverse()) {
        await mod.shutdown?.(ctx);
    }
}
