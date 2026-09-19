import path from "node:path";
const sourceDirs = new WeakMap();
export function setConfigSourceDir(config, dir) {
    sourceDirs.set(config, dir);
}
export function getConfigSourceDir(config, fallback) {
    return sourceDirs.get(config) ?? fallback ?? process.cwd();
}
export function resolveAgainstBase(baseDir, target) {
    return path.isAbsolute(target) ? target : path.resolve(baseDir, target);
}
//# sourceMappingURL=source.js.map