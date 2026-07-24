import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
    findKiwiConfigPath,
    loadKiwiConfigFromPath,
} from "../config/index.js";
import {
    computeModuleClosure,
    createBuiltinRegistry,
    runKernelLifecycle,
    topologicalSortModules,
} from "./index.js";

const packageFixturesRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "__fixtures__",
    "project",
);

const tempDirs: string[] = [];

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

function makeTempDir(prefix: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
}

function copyFixtureProject(): string {
    const dir = makeTempDir("webengine-fixture-");
    fs.cpSync(packageFixturesRoot, dir, { recursive: true });
    return dir;
}

describe("findKiwiConfigPath", () => {
    it("finds kiwi.config.toml walking upward", () => {
        const project = copyFixtureProject();
        const nested = path.join(project, "nested", "deeper");
        fs.mkdirSync(nested, { recursive: true });
        const found = findKiwiConfigPath(nested);
        expect(found).toBe(path.join(project, "kiwi.config.toml"));
    });

    it("returns null when no config exists", () => {
        const empty = makeTempDir("webengine-no-kiwi-");
        expect(findKiwiConfigPath(empty)).toBeNull();
    });
});

describe("loadKiwiConfigFromPath", () => {
    it("loads and validates a fixture config", async () => {
        const project = copyFixtureProject();
        const loaded = await loadKiwiConfigFromPath(
            path.join(project, "kiwi.config.toml"),
        );
        expect(loaded.config.webengine.app_name).toBe("webengine-fixture");
        expect(loaded.config.kernel.modules).toEqual(["core", "web"]);
        expect(loaded.projectRoot).toBe(project);
    });

    it("rejects invalid kiwi.config.toml", async () => {
        const dir = makeTempDir("webengine-bad-kiwi-");
        const badPath = path.join(dir, "kiwi.config.toml");
        fs.writeFileSync(
            badPath,
            `version = "0.1.0"\n\n[webengine]\napp_name = "x"\n`,
            "utf8",
        );
        await expect(loadKiwiConfigFromPath(badPath)).rejects.toThrow(
            /Invalid kiwi.config.toml/,
        );
    });
});

describe("toposort", () => {
    it("orders modules by dependencies", () => {
        const registry = createBuiltinRegistry();
        const closure = computeModuleClosure(["web"], registry);
        const sorted = topologicalSortModules(closure, registry);
        expect(sorted.indexOf("core")).toBeLessThan(sorted.indexOf("web"));
    });

    it("detects dependency cycles", () => {
        const registry = createBuiltinRegistry();
        registry.set("a", {
            id: "a",
            dependencies: ["b"],
            bootstrap: async () => {},
            health: async () => ({ ok: true }),
        });
        registry.set("b", {
            id: "b",
            dependencies: ["a"],
            bootstrap: async () => {},
            health: async () => ({ ok: true }),
        });
        expect(() => topologicalSortModules(["a", "b"], registry)).toThrow(
            /cycle/i,
        );
    });
});

describe("runKernelLifecycle", () => {
    it("bootstraps core+web and reports healthy", async () => {
        const project = copyFixtureProject();
        const result = await runKernelLifecycle(project);
        expect(result.sortedModuleIds).toEqual(["core", "web"]);
        expect(result.healthSummary.allOk).toBe(true);
        expect(result.context.webRuntime?.name).toBe("fixture-app");
        expect(
            result.context.getModuleHandle<{ ready?: boolean }>("core")?.ready,
        ).toBe(true);
    });
});
