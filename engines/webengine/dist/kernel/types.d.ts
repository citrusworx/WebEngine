import type { KiwiConfig, WebRuntimeConfig, YamlRuntimeConfig } from "../config/kiwi-schema.js";
export interface HealthResult {
    ok: boolean;
    detail?: string;
}
export interface ModuleHealth extends HealthResult {
    id: string;
}
export interface HealthSummary {
    allOk: boolean;
    modules: ModuleHealth[];
}
/**
 * Mutable kernel runtime: validated kiwi config, resolved paths, and module handles.
 */
export declare class KernelContext {
    readonly kiwi: KiwiConfig;
    /** Directory containing kiwi.config.toml */
    readonly projectRoot: string;
    webRuntime?: WebRuntimeConfig;
    /** Native desktop/mobile runtime (YAML). */
    nativeRuntime?: YamlRuntimeConfig;
    /** Embedded IoT runtime (YAML). */
    embeddedRuntime?: YamlRuntimeConfig;
    constructor(kiwi: KiwiConfig, 
    /** Directory containing kiwi.config.toml */
    projectRoot: string);
    private readonly handles;
    registerModuleHandle(id: string, value: unknown): void;
    getModuleHandle<T>(id: string): T | undefined;
}
export interface KernelModule {
    id: string;
    /** Module ids that must bootstrap before this one */
    dependencies?: string[];
    scaffold?: (ctx: KernelContext) => void | Promise<void>;
    bootstrap: (ctx: KernelContext) => void | Promise<void>;
    health: (ctx: KernelContext) => HealthResult | Promise<HealthResult>;
    shutdown?: (ctx: KernelContext) => void | Promise<void>;
}
