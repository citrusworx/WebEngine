import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveBlueprintConfigPath, resolveBlueprintPackDir, resolveWorkspaceRoot } from "./paths.js";

describe("blueprint pack paths", () => {
    it("resolves packs from the monorepo, not process.cwd", () => {
        const root = resolveWorkspaceRoot();
        expect(path.basename(root)).not.toBe("provision");
        expect(existsSync(path.join(root, "libraries/grapevine/examples/blueprints/kiwipress-compose/grape.config.yaml"))).toBe(true);

        const compose = resolveBlueprintPackDir("kiwipress-compose");
        const managed = resolveBlueprintConfigPath("kiwipress-managed");
        expect(compose.startsWith(root)).toBe(true);
        expect(managed.endsWith(path.join("kiwipress-managed", "grape.config.yaml"))).toBe(true);
        expect(existsSync(managed)).toBe(true);
    });
});
