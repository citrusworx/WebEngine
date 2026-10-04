export interface CommandOptions {
    config?: string;
    json?: boolean;
    yes?: boolean;
    dryRun?: boolean;
    tag?: string;
    list?: boolean;
    force?: boolean;
    blueprint?: string;
    offerings?: boolean;
    droplet?: string;
    start?: string;
    end?: string;
}
export declare function handleValidate(options: CommandOptions): Promise<void>;
export declare function handlePlan(options: CommandOptions, heading?: string): Promise<void>;
export declare function handleApply(options: CommandOptions): Promise<void>;
export declare function handleDestroy(options: CommandOptions): Promise<void>;
export declare function handleStatus(options: CommandOptions): Promise<void>;
export declare function handleCatalog(options: CommandOptions): Promise<void>;
export declare function handleOfferings(options: CommandOptions): Promise<void>;
export declare function handleTelemetry(options: CommandOptions): Promise<void>;
export declare function handleInit(options: CommandOptions): Promise<void>;
