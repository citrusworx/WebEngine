export interface GrapeRunOptions {
    /** Directory used to resolve stack compose/env/script paths. Defaults to the config file dir. */
    baseDir?: string;
}
export declare function setConfigSourceDir(config: object, dir: string): void;
export declare function getConfigSourceDir(config: object, fallback?: string): string;
export declare function resolveAgainstBase(baseDir: string, target: string): string;
