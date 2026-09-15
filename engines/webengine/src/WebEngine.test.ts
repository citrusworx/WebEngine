import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach } from "vitest";
import type { Blueprint, DeploymentManifest } from "@citrusworx/types";
import { Environment } from "@citrusworx/types";
import { WebEngine } from "./index.js";

const packageFixturesRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "__fixtures__",
    "project",
);

const tempDirs: string[] = [];

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

function copyFixtureProject(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "webengine-we-"));
    tempDirs.push(dir);
    fs.cpSync(packageFixturesRoot, dir, { recursive: true });
    return dir;
}

const blueprint: Blueprint = {
    name: "fixture",
    version: "0.0.1",
    description: "fixture",
    modules: ["core", "web"],
    adapters: {},
    services: [],
};

const deploymentManifest: DeploymentManifest = {
    id: "fixture-deploy",
    createdAt: new Date(0),
    projectId: "fixture",
    blueprint,
    environment: Environment.DEVELOPMENT,
    modules: ["core", "web"],
    services: [],
    infrastructure: {
        server: true,
        database: false,
    },
};

describe("WebEngine", () => {
    it("parses yaml toml and json", () => {
        const engine = new WebEngine({
            blueprint,
            environment: Environment.DEVELOPMENT,
            deploymentManifest,
        });

        expect(engine.parse<{ a: number }>('{"a":1}', "json")).toEqual({ a: 1 });
        expect(engine.parse<{ a: number }>("a: 1\n", "yaml")).toEqual({ a: 1 });
        expect(engine.parse<{ a: number }>("a = 1\n", "toml")).toEqual({ a: 1 });
    });

    it("init runs kernel lifecycle when kiwi.config.toml is present", async () => {
        const fixturesRoot = copyFixtureProject();
        const engine = new WebEngine({
            blueprint,
            environment: Environment.DEVELOPMENT,
            deploymentManifest,
            cwd: fixturesRoot,
        });

        await engine.init();
        expect(engine.initialized).toBe(true);
        expect(engine.getHealthSummary()?.allOk).toBe(true);
        expect(engine.getKiwiConfig()?.webengine.app_name).toBe(
            "webengine-fixture",
        );
        await engine.teardown();
        expect(engine.initialized).toBe(false);
    });
});
