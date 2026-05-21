import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PACKAGE_ROOT = process.cwd();
const DIST_DIR = join(PACKAGE_ROOT, "dist");
const PACKAGE_JSON_PATH = join(PACKAGE_ROOT, "package.json");

function readPackageJson() {
    return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8")) as {
        main?: string;
        types?: string;
        exports?: Record<string, { default?: string; types?: string } | string>;
    };
}

describe("Juice build artifacts", () => {
    it("produces CSS output", () => {
        const cssPath = join(DIST_DIR, "index.css");
        const css = readFileSync(cssPath, "utf-8");

        expect(css).toContain("[bgColor=");
        expect(css).toContain("[icon=");
        expect(css).toContain("[stack]");
        expect(css.length).toBeGreaterThan(1000);
    });

    it("produces JS output", () => {
        const jsPath = join(DIST_DIR, "index.js");
        const js = readFileSync(jsPath, "utf-8");

        expect(js).toContain("export");
    });

    it("keeps the published CSS artifact under the current size budget", () => {
        const cssStats = statSync(join(DIST_DIR, "index.css"));

        expect(cssStats.size).toBeLessThan(6_500_000);
    });
});

describe("Juice package contract", () => {
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

    it("can be imported from the built entrypoint with the stable runtime symbols", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);

        expect(module).toHaveProperty("Accordion");
        expect(module).toHaveProperty("createNavigation");
        expect(module).toHaveProperty("initNavigation");
        expect(module).toHaveProperty("startNavigationRuntime");
        expect(module).toHaveProperty("stopNavigationRuntime");
        expect(module).toHaveProperty("tokens");
    });

    it("does not reference missing local assets from the compiled stylesheet", () => {
        const cssPath = join(DIST_DIR, "index.css");
        const css = readFileSync(cssPath, "utf-8");
        const matches = css.matchAll(/url\((['"]?)(\.[^'")]+)\1\)/g);
        const missingAssets: string[] = [];

        for (const [, , assetPath] of matches) {
            if (assetPath.startsWith("./grid/svg/") || assetPath.startsWith("./hexa/svg/")) {
                continue;
            }

            const absolutePath = join(DIST_DIR, assetPath);

            if (!existsSync(absolutePath)) {
                missingAssets.push(assetPath);
            }
        }

        expect(missingAssets).toEqual([]);
    });
});
