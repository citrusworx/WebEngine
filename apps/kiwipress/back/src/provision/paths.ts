import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BlueprintPackId } from "./types.js";

const PACK_MARKER = path.join("libraries", "grapevine", "examples", "blueprints");

export function resolveWorkspaceRoot(
    startDir = path.dirname(fileURLToPath(import.meta.url))
): string {
    let dir = path.resolve(startDir);

    while (true) {
        if (existsSync(path.join(dir, PACK_MARKER))) {
            return dir;
        }

        const parent = path.dirname(dir);
        if (parent === dir) {
            throw new Error(
                `Could not locate the WebEngine workspace root (missing ${PACK_MARKER}).`
            );
        }

        dir = parent;
    }
}

export function resolveBlueprintPackDir(
    packId: BlueprintPackId,
    workspaceRoot = resolveWorkspaceRoot()
): string {
    const packDir = path.join(workspaceRoot, PACK_MARKER, packId);
    const configPath = path.join(packDir, "grape.config.yaml");

    if (!existsSync(configPath)) {
        throw new Error(`KiwiPress blueprint pack not found: ${packId} (${configPath})`);
    }

    return packDir;
}

export function resolveBlueprintConfigPath(
    packId: BlueprintPackId,
    workspaceRoot = resolveWorkspaceRoot()
): string {
    return path.join(resolveBlueprintPackDir(packId, workspaceRoot), "grape.config.yaml");
}
