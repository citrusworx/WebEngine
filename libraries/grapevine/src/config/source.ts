import path from "node:path";

export interface GrapeRunOptions {
    /** Directory used to resolve stack compose/env/script paths. Defaults to the config file dir. */
    baseDir?: string;
}

const sourceDirs = new WeakMap<object, string>();

export function setConfigSourceDir(config: object, dir: string): void {
    sourceDirs.set(config, dir);
}

export function getConfigSourceDir(config: object, fallback?: string): string {
    return sourceDirs.get(config) ?? fallback ?? process.cwd();
}

export function resolveAgainstBase(baseDir: string, target: string): string {
    return path.isAbsolute(target) ? target : path.resolve(baseDir, target);
}
