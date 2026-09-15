import type {
    KiwiConfig,
    WebRuntimeConfig,
    YamlRuntimeConfig,
} from "../config/kiwi-schema.js";

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
export class KernelContext {
    webRuntime?: WebRuntimeConfig;
    /** Native desktop/mobile runtime (YAML). */
    nativeRuntime?: YamlRuntimeConfig;
    /** Embedded IoT runtime (YAML). */
    embeddedRuntime?: YamlRuntimeConfig;

    private readonly handles = new Map<string, unknown>();

    constructor(
        readonly kiwi: KiwiConfig,
        /** Directory containing kiwi.config.toml */
        readonly projectRoot: string,
    ) {}

    registerModuleHandle(id: string, value: unknown): void {
        this.handles.set(id, value);
    }

    getModuleHandle<T>(id: string): T | undefined {
        return this.handles.get(id) as T | undefined;
    }
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
