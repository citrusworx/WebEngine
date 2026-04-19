import { type KiwiConfig } from "./kiwi-schema.js";
export interface LoadedKiwiConfig {
    config: KiwiConfig;
    /** Directory containing kiwi.config.toml */
    projectRoot: string;
    configPath: string;
}
export declare function loadKiwiConfigFromPath(configPath: string): Promise<LoadedKiwiConfig>;
