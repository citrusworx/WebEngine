import type { GrapeConfig, StackConfig } from "./schema.js";
export declare const DEFAULT_STACK_WORKDIR = "/opt/kiwipress";
export declare const DEFAULT_HEALTH_WAIT_SECONDS = 180;
export declare const DEFAULT_BOOTSTRAP_NAME = "bootstrap.sh";
export interface StackFile {
    dest: string;
    content: string;
    permissions: string;
}
export interface ResolvedStack {
    name: string;
    droplet: string;
    workdir: string;
    composeDests: string[];
    envDest: string;
    envKeys: Record<string, string>;
    files: StackFile[];
    bootstrapPath: string;
    health: {
        waitSeconds: number;
        url?: string;
        command?: string;
    };
    steps: string[];
}
export interface ResolveStackOptions {
    baseDir?: string;
    envOverlay?: Record<string, string>;
}
/** True when a loose `services` object is an applied stack (droplet + compose source). */
export declare function isStackShaped(value: unknown): value is StackConfig;
export declare function declaredStacks(config: GrapeConfig): StackConfig[];
export declare function servicesNeedsLegacyWarning(config: GrapeConfig): boolean;
export declare function generateDefaultBootstrap(stack: ResolvedStack): string;
export declare function resolveStack(stack: StackConfig, options?: ResolveStackOptions): ResolvedStack;
export declare function resolveDeclaredStacks(config: GrapeConfig, options?: ResolveStackOptions): ResolvedStack[];
export declare function generateStackUserData(stack: ResolvedStack): string;
export declare function mergeUserData(existing: string | undefined, generated: string): string;
export declare function stackPlanDetails(stack: ResolvedStack): Record<string, string>;
