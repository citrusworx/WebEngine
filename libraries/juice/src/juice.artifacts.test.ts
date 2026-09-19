import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PACKAGE_ROOT = process.cwd();
const DIST_DIR = join(PACKAGE_ROOT, "dist");
const PACKAGE_JSON_PATH = join(PACKAGE_ROOT, "package.json");

type PackageExportTarget = { default?: string; types?: string } | string | null;

function readPackageJson() {
    return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8")) as {
        main?: string;
        types?: string;
        exports?: Record<string, PackageExportTarget>;
        files?: string[];
        browserslist?: string[];
        sideEffects?: string[] | boolean;
        dependencies?: Record<string, string>;
    };
}

function readBundledThemeIds() {
    return readdirSync(join(DIST_DIR, "themes"))
        .filter((file) => file.endsWith(".css"))
        .map((file) => file.replace(/\.css$/, ""))
        .sort();
}

describe("Juice build artifacts", () => {
    it("produces core CSS output without bundled themes", () => {
        const cssPath = join(DIST_DIR, "index.css");
        const css = readFileSync(cssPath, "utf-8");
        const bundledThemeIds = readBundledThemeIds();

        expect(css).toContain("[bgColor=");
        expect(css).toContain("[icon=");
        expect(css).toMatch(/\[iconSize=["']?sm["']?\]/);
        expect(css).toContain("[stack]");
        expect(css.length).toBeGreaterThan(1000);
        for (const id of bundledThemeIds) {
            expect(css).not.toContain(`[theme="${id}"]`);
        }
    });

    it("produces separate theme stylesheets", () => {
        const bundledThemeIds = readBundledThemeIds();

        expect(bundledThemeIds.length).toBeGreaterThan(0);

        for (const id of bundledThemeIds) {
            const themePath = join(DIST_DIR, "themes", `${id}.css`);
            expect(existsSync(themePath)).toBe(true);
            const themeCss = readFileSync(themePath, "utf-8");
            expect(themeCss).toMatch(new RegExp(`\\[theme=["']?${id}["']?\\]`));
        }
    });

    it("includes themeable surfaceTone soft, strong, and muted in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toMatch(/\[surfaceTone=["']?soft["']?\]/);
        expect(css).toMatch(/\[surfaceTone=["']?strong["']?\]/);
        expect(css).toMatch(/\[surfaceTone=["']?muted["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[surfaceTone=["']?soft["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[surfaceTone=["']?strong["']?\]/);
        expect(css).toContain("--juice-surface-soft-bg");
        expect(css).toContain("--juice-surface-soft-border");
        expect(css).toContain("--juice-surface-soft-shadow");
        expect(css).toContain("--juice-surface-soft-blur");
        expect(css).toContain("--juice-surface-strong-bg");
        expect(css).toContain("--juice-surface-muted-bg");
        expect(css).toMatch(/\[borderStrength=["']?soft["']?\]/);
        expect(css).toMatch(/\[borderStrength=["']?bold["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[borderStrength=["']?soft["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[borderStrength=["']?bold["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[borderStrength=["']?soft["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[borderStrength=["']?bold["']?\]/);
        expect(css).toContain("--juice-border-strength-soft-width");
        expect(css).toContain("--juice-border-strength-soft-color");
        expect(css).toContain("--juice-border-strength-bold-width");
        expect(css).toContain("--juice-border-strength-bold-color");
        expect(css).toMatch(/\[blur=["']?sm["']?\]/);
        expect(css).toMatch(/\[blur=["']?md["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[blur=["']?sm["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[blur=["']?md["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[blur=["']?sm["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[blur=["']?md["']?\]/);
        expect(css).toContain("--juice-blur-sm, 6px");
        expect(css).toContain("--juice-blur-md, 16px");
    });

    it("includes accordion structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[accordion]");
        expect(css).toContain("[accordion-item]");
        expect(css).toMatch(/\[accordion-item\]\[aria-expanded=["']?true["']?\]/);
        expect(css).toMatch(/\[accordion-item\]:focus-visible/);
        expect(css).not.toMatch(/\[accordion-item\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).toContain("--juice-accordion-trigger");
        expect(css).toContain("--juice-accordion-trigger-hover");
        expect(css).toContain("--juice-accordion-trigger-open");
        expect(css).toContain("--juice-accordion-chevron");
        expect(css).toContain("--juice-accordion-panel-rule");
        expect(css).toContain("--juice-accordion-focus-ring");
        expect(css).toContain("--juice-accordion-item-border,");
        expect(css).toContain("--juice-accordion-item-border-open,");
        expect(css).toContain("--juice-accordion-trigger-accent,");
        expect(css).toContain("--juice-accordion-panel,");
        expect(css).toContain("--juice-accordion-open-glow,");
        expect(css).toContain("--juice-accordion-chevron-size");
        expect(css).toMatch(/\[accordion-item\]\[aria-expanded=["']?true["']?\]::before/);
    });

    it("includes tabs structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[tabs]");
        expect(css).toContain("[tabs-list]");
        expect(css).toContain("[tab-panel]");
        expect(css).toContain("flex-direction: column");
        expect(css).toMatch(/\[tab\]\[active\]/);
        expect(css).toMatch(/\[tab\]\[aria-selected=["']?true["']?\]/);
        expect(css).toContain("--juice-tabs-trigger");
        expect(css).toContain("--juice-tabs-trigger-hover");
        expect(css).toContain("--juice-tabs-trigger-active");
        expect(css).toContain("--juice-tabs-text");
        expect(css).toContain("--juice-tabs-indicator");
        expect(css).toContain("--juice-tabs-list-rule");
        expect(css).toContain("--juice-tabs-focus-ring");
        expect(css).toContain("--juice-tabs-panel,");
        expect(css).toContain("--juice-tabs-panel-rule,");
        expect(css).not.toMatch(/\[tab-panel\][^{]*\{[^}]*content:\s*["']active["']/);
        expect(css).not.toMatch(/\[tab-panel\][^{]*\{[^}]*content:\s*["']hidden["']/);
    });

    it("keeps KiwiPress tab selectors in parity with [active] and aria-selected", () => {
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");

        expect(kiwiCss).toContain("[tabs-list]");
        expect(kiwiCss).toContain("[tab-panel]");
        expect(kiwiCss).toMatch(/\[tab\]\[active\]/);
        expect(kiwiCss).toMatch(/\[tab\]\[aria-selected=["']?true["']?\]/);
        expect(kiwiCss).toContain("border-bottom-color: var(--juice-tabs-indicator)");
        expect(kiwiCss).toContain("--juice-tabs-trigger: var(--kw-tabs-trigger)");
        expect(kiwiCss).not.toMatch(/button\[tab\][^{]*\{[^}]*--kw-cta-background/);
    });

    it("binds surface tone roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--juice-surface-soft-bg: var(--aqua-surface)");
        expect(aquaCss).toContain("--juice-surface-strong-bg: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--juice-surface-muted-bg: var(--aqua-surface-muted)");

        expect(kiwiCss).toContain("--juice-surface-soft-bg: var(--kw-surface-strong)");
        expect(kiwiCss).toContain("--juice-surface-strong-bg: var(--kw-surface)");
        expect(kiwiCss).toContain("--juice-surface-muted-bg: var(--kw-surface-muted)");

        expect(mintCss).toContain("--juice-surface-soft-bg: color-mix(in srgb, var(--cm-surface) 88%, transparent)");
        expect(mintCss).toContain("--juice-surface-strong-bg: var(--cm-surface)");
        expect(mintCss).toContain("--juice-surface-muted-bg: var(--cm-surface-muted)");

        expect(tideCss).toContain("--juice-surface-soft-bg: var(--tide-surface)");
        expect(tideCss).toContain("--juice-surface-strong-bg: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-surface-muted-bg: var(--tide-surface-muted)");
        expect(tideCss).toContain("--juice-surface-soft-shadow: var(--tide-line-glow)");
    });

    it("binds borderStrength roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--juice-border-strength-soft-color: var(--aqua-border)");
        expect(aquaCss).toContain("--juice-border-strength-bold-color: var(--aqua-border-strong)");
        expect(kiwiCss).toContain("--juice-border-strength-soft-color: var(--kw-border)");
        expect(kiwiCss).toContain("--juice-border-strength-bold-color: var(--kw-border-strong)");
        expect(mintCss).toContain("--juice-border-strength-soft-color: var(--cm-border)");
        expect(mintCss).toContain("--juice-border-strength-bold-color: color-mix(in srgb, var(--cm-heading) 22%, transparent)");
        expect(tideCss).toContain("--juice-border-strength-soft-color: var(--tide-border)");
        expect(tideCss).toContain("--juice-border-strength-bold-color: var(--tide-border-strong)");
        expect(tideCss).not.toContain("--juice-border-strength-bold-color: rgba(");
    });

    it("paints Aquaflux accordion triggers as surfaces, not CTA buttons", () => {
        const themeCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const accordionItemBlocks = [...themeCss.matchAll(/button\[accordion-item\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(themeCss).toContain("accordion-item");
        expect(themeCss).toContain("--aqua-trigger: var(--aqua-surface-strong)");
        expect(themeCss).toContain("--juice-accordion-trigger: var(--aqua-trigger)");
        expect(themeCss).toContain("--aqua-surface-strong");
        expect(themeCss).toContain("--aqua-heading");
        expect(themeCss).toContain("--aqua-accent");
        expect(themeCss).toContain("--aqua-highlight");
        expect(accordionItemBlocks.length).toBeGreaterThan(0);
        for (const block of accordionItemBlocks) {
            expect(block).not.toContain("--aqua-button-background");
        }
    });

    it("binds accordion chrome roles in KiwiPress, Citrusmint, and Tide", () => {
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(kiwiCss).toContain("--kw-trigger: var(--kw-surface-strong)");
        expect(kiwiCss).toContain("--juice-accordion-trigger: var(--kw-trigger)");
        expect(kiwiCss).toContain("button[accordion-item]");
        expect(kiwiCss).not.toMatch(/button\[accordion-item\][^{]*\{[^}]*--kw-cta-background/);

        expect(mintCss).toContain("--cm-trigger: var(--cm-surface)");
        expect(mintCss).toContain("--juice-accordion-trigger: var(--cm-trigger)");
        expect(mintCss).toContain("button[accordion-item]");

        expect(tideCss).toContain("--juice-accordion-trigger: var(--tide-trigger)");
        expect(tideCss).toContain("button[accordion-item]");
        expect(tideCss).not.toMatch(/button\[accordion-item\][^{]*\{[^}]*--tide-button-background/);
    });

    it("binds tabs chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-tabs-text: var(--aqua-text-muted)");
        expect(aquaCss).toContain("--juice-tabs-trigger: var(--aqua-tabs-trigger)");
        expect(aquaCss).toContain("button[tab]");
        expect(aquaCss).not.toMatch(/button\[tab\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-tabs-text: var(--kw-text-soft)");
        expect(kiwiCss).toContain("--juice-tabs-text-active: var(--kw-tabs-text-active)");

        expect(mintCss).toContain("--cm-tabs-text: var(--cm-text-muted)");
        expect(mintCss).toContain("--juice-tabs-trigger: var(--cm-tabs-trigger)");
        expect(mintCss).toContain("button[tab]");

        expect(tideCss).toContain("--juice-tabs-trigger: var(--tide-tabs-trigger)");
        expect(tideCss).toContain("--juice-tabs-panel: var(--tide-tabs-panel)");
        expect(tideCss).toContain("button[tab]");
        expect(tideCss).not.toMatch(/button\[tab\][^{]*\{[^}]*--tide-button-background/);
    });

    it("ships tide CSS as a stable theme export", () => {
        const bundledThemeIds = readBundledThemeIds();
        const themePath = join(DIST_DIR, "themes", "tide.css");
        const draftPath = join(DIST_DIR, "themes", "_draft", "tide.css");

        expect(bundledThemeIds).toEqual(expect.arrayContaining(["aquaflux", "citrusmint", "kiwipress", "tide"]));
        expect(bundledThemeIds).not.toContain("_draft");
        expect(existsSync(themePath)).toBe(true);
        expect(existsSync(draftPath)).toBe(false);

        const themeCss = readFileSync(themePath, "utf-8");
        expect(themeCss).toMatch(/\[theme=["']?tide["']?\]/);
        expect(themeCss).toContain("--tide-measure:");
        expect(themeCss).toContain("45rem");
        expect(themeCss).toContain("--juice-accordion-trigger: var(--tide-trigger)");
        expect(themeCss).toContain("--juice-accordion-trigger-accent: var(--tide-trigger-accent)");
        expect(themeCss).toContain("--juice-accordion-item-border: var(--tide-item-border)");
        expect(themeCss).toContain("--juice-accordion-panel: var(--tide-panel-well)");
        expect(themeCss).toContain("--juice-accordion-chevron-size:");
        expect(themeCss).toContain("button[accordion-item]");
        expect(themeCss).toContain("[accordion]:has(>");
        expect(themeCss).toContain("--tide-line-glow:");
        expect(themeCss).not.toContain("--tide-trigger-open: var(--tide-highlight)");
        expect(themeCss).not.toContain("--tide-accent: hsl(174, 65%, 54%)");
        expect(themeCss).not.toMatch(/button\[accordion-item\][^{]*\{[^}]*--tide-button-background/);
        expect(themeCss).toContain("--juice-tabs-trigger: var(--tide-tabs-trigger)");
        expect(themeCss).toContain("--juice-tabs-panel: var(--tide-tabs-panel)");
        expect(themeCss).toContain("button[tab]");
        expect(themeCss).not.toMatch(/button\[tab\][^{]*\{[^}]*--tide-button-background/);
        expect(themeCss).toContain("input:focus-visible");
        expect(themeCss).toContain("nav[type=bar]");
        expect(themeCss).toContain("main > header");
    });

    it("keeps draft theme paths out of the public package export map", () => {
        const pkg = readPackageJson();
        const exportsMap = pkg.exports ?? {};

        expect(exportsMap["./themes/tide.css"]).toEqual({
            types: "./dist/themes/index.d.ts",
            default: "./dist/themes/tide.css"
        });
        expect(exportsMap["./styles/themes/tide"]).toEqual({
            types: "./dist/themes/index.d.ts",
            default: "./dist/themes/tide.css"
        });
        expect(exportsMap["./themes/_draft"]).toBeNull();
        expect(exportsMap["./themes/_draft/*"]).toBeNull();
        expect(exportsMap["./themes/_draft/*.css"]).toBeNull();
        expect(exportsMap["./styles/themes/_draft"]).toBeNull();
        expect(exportsMap["./styles/themes/_draft/*"]).toBeNull();
        expect(pkg.files).toEqual(expect.arrayContaining(["!dist/themes/_draft", "!dist/themes/_draft/**"]));
    });

    it("rejects remaining draft theme paths through published package specifiers", async () => {
        const cssSpecifier = ["@citrusworx/juiceui", "themes/_draft/blush.css"].join("/");
        const aliasSpecifier = ["@citrusworx/juiceui", "styles/themes/_draft/blush"].join("/");
        const oldTideSpecifier = ["@citrusworx/juiceui", "themes/_draft/tide.css"].join("/");

        await expect(import(/* @vite-ignore */ cssSpecifier)).rejects.toThrow(/is not exported/);
        await expect(import(/* @vite-ignore */ aliasSpecifier)).rejects.toThrow(/is not exported/);
        await expect(import(/* @vite-ignore */ oldTideSpecifier)).rejects.toThrow(/is not exported/);
    });

    it("produces JS output", () => {
        const jsPath = join(DIST_DIR, "index.js");
        const js = readFileSync(jsPath, "utf-8");

        expect(js).toContain("export");
    });

    it("keeps the core CSS artifact under the size budget", () => {
        const cssStats = statSync(join(DIST_DIR, "index.css"));

        expect(cssStats.size).toBeLessThan(9_000_000);
    });

    it("keeps each theme stylesheet under the size budget", () => {
        for (const id of readBundledThemeIds()) {
            const themeStats = statSync(join(DIST_DIR, "themes", `${id}.css`));
            expect(themeStats.size).toBeLessThan(500_000);
        }
    });

    it("keeps the published icon payload under the current size budget", () => {
        const iconFiles = readdirSync(join(DIST_DIR, "icons"), { recursive: true, withFileTypes: true });
        const totalSize = iconFiles
            .filter((entry) => entry.isFile())
            .reduce((size, entry) => {
                return size + statSync(join(entry.parentPath, entry.name)).size;
            }, 0);

        expect(totalSize).toBeLessThan(4_000_000);
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
            if (target == null) {
                continue;
            }

            if (typeof target === "string") {
                if (target.includes("*")) {
                    expect(existsSync(join(PACKAGE_ROOT, target.split("*")[0]))).toBe(true);
                } else {
                    expect(existsSync(join(PACKAGE_ROOT, target))).toBe(true);
                }
                continue;
            }

            if (target.default) {
                if (target.default.includes("*")) {
                    expect(existsSync(join(PACKAGE_ROOT, target.default.split("*")[0]))).toBe(true);
                } else {
                    expect(existsSync(join(PACKAGE_ROOT, target.default))).toBe(true);
                }
            }

            if (target.types) {
                expect(existsSync(join(PACKAGE_ROOT, target.types))).toBe(true);
            }
        }
    });

    it("declares an explicit browserslist support target", () => {
        const pkg = readPackageJson();

        expect(pkg.browserslist).toEqual([
            "last 2 Chrome versions",
            "last 2 Edge versions",
            "last 2 Firefox versions",
            "last 2 Safari major versions",
            "iOS >= 16.4"
        ]);
    });

    it("marks the JS entry as side-effectful so auto-start runtimes survive tree-shaking", () => {
        const pkg = readPackageJson();

        expect(pkg.sideEffects).toEqual([
            "./dist/index.js",
            "./dist/index.css",
            "./dist/themes/*.css",
            "./dist/themes/aquaflux.css",
            "./dist/themes/kiwipress.css",
            "./dist/themes/citrusmint.css",
            "./dist/themes/tide.css"
        ]);
        expect(readFileSync(join(DIST_DIR, "index.js"), "utf-8")).toContain("DOMContentLoaded");
    });

    it("declares a published semver range for @citrusworx/sigjs", () => {
        const pkg = readPackageJson();
        const range = pkg.dependencies?.["@citrusworx/sigjs"];

        expect(range).toBeDefined();
        expect(range).not.toMatch(/^workspace:/);
        expect(range).toMatch(/^[~^]?\d+\.\d+\.\d+/);
    });

    it("can be imported from the built entrypoint with the stable runtime symbols", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);

        expect(module).toHaveProperty("Accordion");
        expect(module).toHaveProperty("createNavigation");
        expect(module).toHaveProperty("initNavigation");
        expect(module).toHaveProperty("startNavigationRuntime");
        expect(module).toHaveProperty("stopNavigationRuntime");
        expect(module).toHaveProperty("createAccordion");
        expect(module).toHaveProperty("initAccordion");
        expect(module).toHaveProperty("startAccordionRuntime");
        expect(module).toHaveProperty("stopAccordionRuntime");
        expect(module).toHaveProperty("createTabs");
        expect(module).toHaveProperty("initTabs");
        expect(module).toHaveProperty("startTabsRuntime");
        expect(module).toHaveProperty("stopTabsRuntime");
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
