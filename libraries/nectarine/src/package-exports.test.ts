import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PACKAGE_ROOT = process.cwd();
const DIST_DIR = join(PACKAGE_ROOT, "dist");
const PACKAGE_JSON_PATH = join(PACKAGE_ROOT, "package.json");

type ExportTarget = {
    types?: string;
    default?: string;
};

type NectarinePackageJson = {
    name: string;
    license?: string;
    main?: string;
    types?: string;
    files?: string[];
    publishConfig?: { access?: string };
    peerDependencies?: Record<string, string>;
    peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    dependencies?: Record<string, string>;
    exports?: Record<string, ExportTarget | string>;
};

function readPackageJson(): NectarinePackageJson {
    return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8")) as NectarinePackageJson;
}

describe("Nectarine package contract", () => {
    it("declares MIT license, public publish, and dist-only files", () => {
        const pkg = readPackageJson();

        expect(pkg.name).toBe("@citrusworx/nectarine");
        expect(pkg.license).toBe("MIT");
        expect(existsSync(join(PACKAGE_ROOT, "LICENSE"))).toBe(true);
        expect(pkg.files).toEqual(["dist"]);
        expect(pkg.publishConfig?.access).toBe("public");
        expect(pkg.dependencies).toHaveProperty("js-yaml");
    });

    it("marks database drivers as optional peers", () => {
        const pkg = readPackageJson();
        const peers = ["pg", "mysql2", "mongodb"];

        for (const peer of peers) {
            expect(pkg.peerDependencies).toHaveProperty(peer);
            expect(pkg.peerDependenciesMeta?.[peer]?.optional).toBe(true);
        }
    });

    it("has a manifest whose published entrypoints exist", () => {
        const pkg = readPackageJson();
        const mainPath = join(PACKAGE_ROOT, pkg.main ?? "");
        const typesPath = join(PACKAGE_ROOT, pkg.types ?? "");

        expect(existsSync(mainPath)).toBe(true);
        expect(existsSync(typesPath)).toBe(true);

        for (const target of Object.values(pkg.exports ?? {})) {
            if (typeof target === "string") {
                expect(existsSync(join(PACKAGE_ROOT, target))).toBe(true);
                continue;
            }

            if (target.default) {
                expect(existsSync(join(PACKAGE_ROOT, target.default))).toBe(true);
            }

            if (target.types) {
                expect(existsSync(join(PACKAGE_ROOT, target.types))).toBe(true);
            }
        }
    });

    it("does not load database adapters from the root entry", () => {
        const indexJs = readFileSync(join(DIST_DIR, "index.js"), "utf-8");

        expect(indexJs).not.toMatch(/adapters\/(?:pg|ms|mg)/);
        expect(indexJs).toContain("./compiler/compiler");
        expect(indexJs).toContain("./config/index");
        expect(indexJs).toContain("./migrate/index");
    });

    it("exports config and compiler from the built root entry, not adapters", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);

        expect(module.loadNectarineConfig).toEqual(expect.any(Function));
        expect(module.listApiOperations).toEqual(expect.any(Function));
        expect(module.CCompiler).toEqual(expect.any(Function));
        expect(module.applyMigrations).toEqual(expect.any(Function));
        expect(module.compileMigration).toEqual(expect.any(Function));
        expect(module.createPgAdapter).toBeUndefined();
        expect(module.createMysqlAdapter).toBeUndefined();
        expect(module.createMongoAdapter).toBeUndefined();
    });
});
