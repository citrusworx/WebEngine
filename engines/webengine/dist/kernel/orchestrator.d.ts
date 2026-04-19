import { KernelContext, type HealthSummary, type KernelModule } from "./types.js";
export interface KernelRunResult {
    context: KernelContext;
    healthSummary: HealthSummary;
    sortedModuleIds: string[];
    modulesInOrder: KernelModule[];
}
/**
 * Full lifecycle: load kiwi.config.toml → scaffold → bootstrap → health.
 */
export declare function runKernelLifecycle(cwd?: string): Promise<KernelRunResult>;
export declare function shutdownKernel(modulesInOrder: readonly KernelModule[], ctx: KernelContext): Promise<void>;
