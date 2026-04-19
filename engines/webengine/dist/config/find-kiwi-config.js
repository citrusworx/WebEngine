import * as fs from "node:fs";
import * as path from "node:path";
export const KIWI_CONFIG_FILENAME = "kiwi.config.toml";
/**
 * Walks upward from `startDir` looking for {@link KIWI_CONFIG_FILENAME}.
 * Returns absolute path when found, or `null`.
 */
export function findKiwiConfigPath(startDir) {
    let dir = path.resolve(startDir);
    const { root } = path.parse(dir);
    for (;;) {
        const candidate = path.join(dir, KIWI_CONFIG_FILENAME);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
        if (dir === root) {
            return null;
        }
        dir = path.dirname(dir);
    }
}
//# sourceMappingURL=find-kiwi-config.js.map