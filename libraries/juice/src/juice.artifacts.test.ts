import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { SHIPPED_LIBRARY_THEMES } from "./juice.theme-contract.js";

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

function reducedMotionBlocks(css: string): string[] {
    const blocks: string[] = [];
    const needle = "@media (prefers-reduced-motion: reduce)";
    let from = 0;

    while (from < css.length) {
        const start = css.indexOf(needle, from);
        if (start < 0) {
            break;
        }

        const open = css.indexOf("{", start);
        let depth = 0;
        let end = open;

        for (let i = open; i < css.length; i += 1) {
            if (css[i] === "{") {
                depth += 1;
            } else if (css[i] === "}") {
                depth -= 1;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }

        blocks.push(css.slice(start, end + 1));
        from = end + 1;
    }

    return blocks;
}

function splitSelectors(selector: string) {
    const parts: string[] = [];
    let current = "";
    let depth = 0;

    for (const char of selector) {
        if (char === "(") depth += 1;
        if (char === ")") depth -= 1;
        if (char === "," && depth === 0) {
            parts.push(current);
            current = "";
            continue;
        }
        current += char;
    }

    if (current.trim()) parts.push(current);
    return parts;
}

function flatSelector(selector: string) {
    return selector.replace(/\s+/g, "");
}

function stripWhere(selector: string) {
    const needle = ":where(";
    let result = "";
    let index = 0;

    while (index < selector.length) {
        if (selector.startsWith(needle, index)) {
            let depth = 1;
            index += needle.length;
            while (index < selector.length && depth > 0) {
                if (selector[index] === "(") depth += 1;
                else if (selector[index] === ")") depth -= 1;
                index += 1;
            }
            continue;
        }
        result += selector[index];
        index += 1;
    }

    return result;
}

function selectorSpecificity(selector: string): [number, number, number] {
    const source = stripWhere(selector);
    let ids = 0;
    let attrs = 0;
    let types = 0;

    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        if (char === "[") {
            attrs += 1;
            const close = source.indexOf("]", index);
            if (close < 0) break;
            index = close;
            continue;
        }
        if (char === "#") {
            ids += 1;
            continue;
        }
        if (char === ".") {
            attrs += 1;
            continue;
        }
        if (char === ":" && source[index + 1] === ":") {
            types += 1;
            index += 1;
            continue;
        }
        if (char === ":") {
            attrs += 1;
            continue;
        }
        if (/[a-zA-Z*]/.test(char)) {
            const start = index;
            while (index < source.length && /[a-zA-Z0-9-]/.test(source[index] ?? "")) index += 1;
            if (source.slice(start, index) !== "*") types += 1;
            index -= 1;
        }
    }

    return [ids, attrs, types];
}

function cssDeclarations(css: string) {
    return [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map((match) => ({
        selector: match[1] ?? "",
        body: match[2] ?? "",
    }));
}

function declaredProperty(body: string, property: string) {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, "i").exec(body);
    return match?.[1]?.trim() ?? null;
}

function motionDeclarationsWithDurationLiterals(css: string): string[] {
    const found: string[] = [];
    const re = /(?:^|[{;])\s*((?:-\w+-)?(?:transition|animation)(?:-duration|-delay)?)\s*:\s*([^;{}]+)/g;

    for (const match of css.matchAll(re)) {
        const value = match[2].replace(/\s+/g, " ").trim();
        if (/\d+(?:\.\d+)?(?:ms|s)\b/.test(value)) {
            found.push(`${match[1].trim()}: ${value}`);
        }
    }

    return found;
}

// Demo and site SCSS stays on literal timing: developers, how-it-works, dashboard.
const MOTION_DURATION_ALLOWLIST = new Set([
    "transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s",
    "transition: border-color 0.2s, transform 0.2s",
    "transition: background-color 0.15s, color 0.15s",
    "transition: border-color 0.2s, box-shadow 0.2s",
]);

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
        expect(css).toMatch(/\[shadowTone=["']?cool["']?\]/);
        expect(css).toMatch(/\[shadowTone=["']?warm["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[shadowTone=["']?cool["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[shadowTone=["']?warm["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[shadowTone=["']?cool["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[shadowTone=["']?warm["']?\]/);
        expect(css).toContain("--juice-shadow-tone-cool-color");
        expect(css).toContain("--juice-shadow-tone-cool-shadow");
        expect(css).toContain("--juice-shadow-tone-warm-color");
        expect(css).toContain("--juice-shadow-tone-warm-shadow");
        expect(css).toMatch(/\[overlay=["']?frost["']?\]/);
        expect(css).toMatch(/\[overlay=["']?tint["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[overlay=["']?frost["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[overlay=["']?tint["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[overlay=["']?frost["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[overlay=["']?tint["']?\]/);
        expect(css).toContain("--juice-overlay-frost-wash");
        expect(css).toContain("--juice-overlay-frost-layer");
        expect(css).toContain("--juice-overlay-tint-wash");
        expect(css).toContain("--juice-overlay-tint-layer");
        expect(css).toMatch(/\[variant=["']?glass["']?\]/);
        expect(css).toMatch(/\[variant=["']?tinted["']?\]/);
        expect(css).toMatch(/\[variant=["']?monochromatic["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[variant=["']?glass["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[variant=["']?tinted["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[variant=["']?monochromatic["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[variant=["']?glass["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[variant=["']?tinted["']?\]/);
        expect(css).toMatch(/\[surfaceTone\]\[variant=["']?monochromatic["']?\]/);
        expect(css).toContain("--juice-surface-soft-blur, 10px");
        expect(css).not.toMatch(/--juice-variant-[a-z]+:/);
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

    it("includes modal structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[modal-overlay]");
        expect(css).toContain("[modal]");
        expect(css).toContain("[modal-header]");
        expect(css).toContain("[modal-body]");
        expect(css).toContain("[modal-close]");
        expect(css).toMatch(/\[theme\]\s+\[modal-overlay\]/);
        expect(css).toMatch(/\[theme\]\s+\[modal\]:not\(\[surfaceTone\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[modal-close\]/);
        expect(css).toMatch(/\[modal-overlay\]\[hidden\]/);
        expect(css).toMatch(/\[modal-close\]:focus-visible/);
        expect(css).toContain("--juice-modal-overlay");
        expect(css).toContain("--juice-modal-panel");
        expect(css).toContain("--juice-modal-panel-border");
        expect(css).toContain("--juice-modal-panel-shadow");
        expect(css).toContain("--juice-modal-close");
        expect(css).toContain("--juice-modal-close-color");
        expect(css).toContain("--juice-modal-close-hover");
        expect(css).toContain("--juice-modal-focus-ring");
        expect(css).not.toMatch(/\[modal-close\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).not.toMatch(/\[modal-overlay\][^{]*\{[^}]*--juice-overlay-frost/);
    });

    it("includes drawer structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[drawer-overlay]");
        expect(css).toContain("[drawer]");
        expect(css).toContain("[drawer-header]");
        expect(css).toContain("[drawer-body]");
        expect(css).toContain("[drawer-close]");
        expect(css).toContain("[drawer-size=");
        expect(css).toMatch(/\[theme\]\s+\[drawer-overlay\]/);
        expect(css).toMatch(/\[theme\]\s+\[drawer\]:not\(\[surfaceTone\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[drawer-close\]/);
        expect(css).toMatch(/\[drawer-overlay\]\[hidden\]/);
        expect(css).toMatch(/\[drawer=["']?left["']?\]/);
        expect(css).toMatch(/\[drawer-size=["']?sm["']?\]/);
        expect(css).toMatch(/\[drawer-size=["']?lg["']?\]/);
        expect(css).toMatch(/\[drawer-close\]:focus-visible/);
        expect(css).toContain("--juice-drawer-overlay");
        expect(css).toContain("--juice-drawer-panel");
        expect(css).toContain("--juice-drawer-panel-border");
        expect(css).toContain("--juice-drawer-panel-shadow");
        expect(css).toContain("--juice-drawer-close");
        expect(css).toContain("--juice-drawer-close-color");
        expect(css).toContain("--juice-drawer-close-hover");
        expect(css).toContain("--juice-drawer-focus-ring");
        expect(css).not.toMatch(/\[drawer-close\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).not.toMatch(/\[drawer-overlay\][^{]*\{[^}]*--juice-overlay-frost/);
    });

    it("includes toast structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[toast-region]");
        expect(css).toContain("[toast]");
        expect(css).toContain("[toast-title]");
        expect(css).toContain("[toast-body]");
        expect(css).toContain("[toast-close]");
        expect(css).toMatch(/\[theme\]\s+\[toast-region\]/);
        expect(css).toMatch(/\[theme\]\s+\[toast\]:not\(\[surfaceTone\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[toast-close\]/);
        expect(css).toMatch(/\[toast\]\[hidden\]/);
        expect(css).toMatch(/\[toast-region=["']?top-left["']?\]/);
        expect(css).toMatch(/\[toast-region=["']?bottom-right["']?\]/);
        expect(css).toMatch(/\[toast-region=["']?bottom-left["']?\]/);
        expect(css).toMatch(/\[toast=["']?success["']?\]/);
        expect(css).toMatch(/\[toast=["']?error["']?\]/);
        expect(css).toMatch(/\[toast=["']?info["']?\]/);
        expect(css).toMatch(/\[toast=["']?warning["']?\]/);
        expect(css).toMatch(/\[toast-close\]:focus-visible/);
        expect(css).toContain("z-index: 1100");
        expect(css).toContain("pointer-events: none");
        expect(css).toContain("--juice-toast-panel");
        expect(css).toContain("--juice-toast-panel-border");
        expect(css).toContain("--juice-toast-panel-shadow");
        expect(css).toContain("--juice-toast-ink");
        expect(css).toContain("--juice-toast-close");
        expect(css).toContain("--juice-toast-close-color");
        expect(css).toContain("--juice-toast-close-hover");
        expect(css).toContain("--juice-toast-focus-ring");
        expect(css).toContain("--juice-toast-success");
        expect(css).toContain("--juice-toast-success-soft");
        expect(css).toContain("--juice-toast-error");
        expect(css).toContain("--juice-toast-error-soft");
        expect(css).toContain("--juice-toast-info");
        expect(css).toContain("--juice-toast-info-soft");
        expect(css).toContain("--juice-toast-warning");
        expect(css).toContain("--juice-toast-warning-soft");
        expect(css).not.toMatch(/\[toast-close\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).not.toMatch(/\[toast-region\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[toast-region\][^{]*\{[^}]*--juice-drawer-overlay/);
        expect(css).not.toMatch(/\[toast-region\][^{]*\{[^}]*--juice-modal-overlay/);
    });

    it("includes banner structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[banner]");
        expect(css).toContain("[banner-body]");
        expect(css).toContain("[banner-close]");
        expect(css).toMatch(/\[theme\]\s+\[banner\]:not\(\[surfaceTone\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[banner-body\]/);
        expect(css).toMatch(/\[theme\]\s+\[banner-close\]/);
        expect(css).toMatch(/\[banner\]\[hidden\]/);
        expect(css).toMatch(/\[banner=["']?full["']?\]/);
        expect(css).toMatch(/\[banner-tone=["']?success["']?\]/);
        expect(css).toMatch(/\[banner-tone=["']?error["']?\]/);
        expect(css).toMatch(/\[banner-tone=["']?info["']?\]/);
        expect(css).toMatch(/\[banner-tone=["']?warning["']?\]/);
        expect(css).toMatch(/\[banner-close\]:focus-visible/);
        expect(css).toContain("--juice-banner-panel");
        expect(css).toContain("--juice-banner-panel-border");
        expect(css).toContain("--juice-banner-ink");
        expect(css).toContain("--juice-banner-close");
        expect(css).toContain("--juice-banner-close-color");
        expect(css).toContain("--juice-banner-close-hover");
        expect(css).toContain("--juice-banner-focus-ring");
        expect(css).toContain("--juice-banner-success");
        expect(css).toContain("--juice-banner-success-soft");
        expect(css).toContain("--juice-banner-error");
        expect(css).toContain("--juice-banner-error-soft");
        expect(css).toContain("--juice-banner-info");
        expect(css).toContain("--juice-banner-info-soft");
        expect(css).toContain("--juice-banner-warning");
        expect(css).toContain("--juice-banner-warning-soft");
        expect(css).not.toContain("--juice-banner-panel-shadow");
        expect(css).not.toMatch(/\[banner-close\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).not.toMatch(/\[banner\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[banner\][^{]*\{[^}]*--juice-drawer-overlay/);
        expect(css).not.toMatch(/\[banner\][^{]*\{[^}]*--juice-modal-overlay/);
        expect(css).not.toMatch(/\[banner\][^{]*\{[^}]*--juice-toast-panel/);
        expect(css).not.toMatch(/\[banner=["']?success["']?\]/);
    });

    it("includes popover structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[popover-root]");
        expect(css).toContain("[popover-panel]");
        expect(css).toContain("[popover-header]");
        expect(css).toContain("[popover-body]");
        expect(css).toContain("[popover-close]");
        expect(css).toMatch(/\[theme\]\s+\[popover-root\]/);
        expect(css).toMatch(/\[theme\]\s+\[popover-panel\]:not\(\[surfaceTone\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[popover-close\]/);
        expect(css).toMatch(/\[popover-root\]\[hidden\]/);
        expect(css).toMatch(/\[popover-root=["']?top["']?\]/);
        expect(css).toMatch(/\[popover-root=["']?left["']?\]/);
        expect(css).toMatch(/\[popover-root=["']?right["']?\]/);
        expect(css).toMatch(/\[popover-close\]:focus-visible/);
        expect(css).toContain("z-index: 1050");
        expect(css).toContain("--juice-popover-panel");
        expect(css).toContain("--juice-popover-panel-border");
        expect(css).toContain("--juice-popover-panel-shadow");
        expect(css).toContain("--juice-popover-ink");
        expect(css).toContain("--juice-popover-close");
        expect(css).toContain("--juice-popover-close-color");
        expect(css).toContain("--juice-popover-close-hover");
        expect(css).toContain("--juice-popover-focus-ring");
        expect(css).not.toMatch(/\[popover\](?![-a-z])/);
        expect(css).not.toMatch(/\[popover-close\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).not.toMatch(/\[popover-root\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[popover-root\][^{]*\{[^}]*--juice-drawer-overlay/);
        expect(css).not.toMatch(/\[popover-root\][^{]*\{[^}]*--juice-modal-overlay/);
        expect(css).not.toMatch(/\[popover-root\][^{]*\{[^}]*--juice-toast-panel/);
    });

    it("includes tooltip structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[tooltip-root]");
        expect(css).toContain("[tooltip-panel]");
        expect(css).toMatch(/\[theme\]\s+\[tooltip-root\]/);
        expect(css).toMatch(/\[theme\]\s+\[tooltip-panel\]:not\(\[surfaceTone\]\)/);
        expect(css).toMatch(/\[tooltip-root\]\[hidden\]/);
        expect(css).toMatch(/\[tooltip-root=["']?bottom["']?\]/);
        expect(css).toMatch(/\[tooltip-root=["']?left["']?\]/);
        expect(css).toMatch(/\[tooltip-root=["']?right["']?\]/);
        expect(css).toContain("z-index: 1060");
        expect(css).toContain("--juice-tooltip-panel");
        expect(css).toContain("--juice-tooltip-panel-border");
        expect(css).toContain("--juice-tooltip-panel-shadow");
        expect(css).toContain("--juice-tooltip-ink");
        expect(css).not.toMatch(/\[tooltip\](?![-a-z])/);
        expect(css).not.toContain("[tooltip-close]");
        expect(css).not.toContain("--juice-tooltip-close");
        expect(css).not.toContain("--juice-tooltip-focus-ring");
        expect(css).not.toMatch(/\[tooltip-root\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[tooltip-root\][^{]*\{[^}]*--juice-drawer-overlay/);
        expect(css).not.toMatch(/\[tooltip-root\][^{]*\{[^}]*--juice-modal-overlay/);
        expect(css).not.toMatch(/\[tooltip-root\][^{]*\{[^}]*--juice-toast-panel/);
        expect(css).not.toMatch(/\[tooltip-root\][^{]*\{[^}]*--juice-popover-panel/);
        expect(css).not.toMatch(/\[title\]/);
    });

    it("includes combobox structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[combobox]");
        expect(css).toContain("[combobox-input]");
        expect(css).toContain("[combobox-trigger]");
        expect(css).toContain("[combobox-list]");
        expect(css).toContain("[combobox-option]");
        expect(css).toMatch(/\[theme\]\s+\[combobox\](?![-a-z])/);
        expect(css).toMatch(/\[theme\]\s+\[combobox-input\]/);
        expect(css).toMatch(/\[theme\]\s+\[combobox-trigger\]/);
        expect(css).toMatch(/\[theme\]\s+\[combobox-list\]:not\(\[surfaceTone\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[combobox-option\]/);
        expect(css).toMatch(/\[combobox-list\]\[hidden\]/);
        expect(css).toMatch(/\[combobox-option\]\[aria-selected=["']?true["']?\]/);
        expect(css).toMatch(/\[combobox-option=["']?active["']?\]/);
        expect(css).toMatch(/\[combobox-input\]:focus-visible/);
        expect(css).toMatch(/\[combobox-trigger\]:focus-visible/);
        expect(css).toContain("z-index: 1050");
        expect(css).toContain("--juice-combobox-input");
        expect(css).toContain("--juice-combobox-input-border");
        expect(css).toContain("--juice-combobox-input-ink");
        expect(css).toContain("--juice-combobox-list");
        expect(css).toContain("--juice-combobox-list-border");
        expect(css).toContain("--juice-combobox-list-shadow");
        expect(css).toContain("--juice-combobox-option");
        expect(css).toContain("--juice-combobox-option-hover");
        expect(css).toContain("--juice-combobox-option-selected");
        expect(css).toContain("--juice-combobox-option-ink");
        expect(css).toContain("--juice-combobox-trigger");
        expect(css).toContain("--juice-combobox-trigger-ink");
        expect(css).toContain("--juice-combobox-focus-ring");
        expect(css).not.toMatch(/select\[combobox/);
        expect(css).not.toMatch(/\[role=["']?listbox["']?\]/);
        expect(css).not.toMatch(/\[combobox-trigger\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).not.toMatch(/\[combobox\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[combobox-list\][^{]*\{[^}]*--juice-popover-panel/);
        expect(css).not.toMatch(/\[combobox-list\][^{]*\{[^}]*--juice-tooltip-panel/);
        expect(css).not.toMatch(/\[combobox-list\][^{]*\{[^}]*--juice-modal-overlay/);
        expect(css).not.toMatch(/\[combobox-list\][^{]*\{[^}]*--juice-drawer-overlay/);
    });

    it("includes menu structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[menu-root]");
        expect(css).toContain("[menu-button]");
        expect(css).toContain("[menu]");
        expect(css).toContain("[menuitem]");
        expect(css).toContain("[menu-separator]");
        expect(css).toContain("[menu-label]");
        expect(css).toMatch(/\[theme\]\s+\[menu-root\]/);
        expect(css).toMatch(/\[theme\]\s+\[menu-button\]/);
        expect(css).toMatch(/\[theme\]\s+\[menu\]:not\(\[surfaceTone\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[menuitem\]/);
        expect(css).toMatch(/\[menu\]\[hidden\]/);
        expect(css).toMatch(/\[menu-root=["']?top["']?\]/);
        expect(css).toMatch(/\[menu-root=["']?left["']?\]/);
        expect(css).toMatch(/\[menu-root=["']?right["']?\]/);
        expect(css).toMatch(/\[menuitem=["']?active["']?\]/);
        expect(css).toMatch(/\[menu-button\]:focus-visible/);
        expect(css).toMatch(/\[menuitem\]:focus-visible/);
        expect(css).toContain("z-index: 1050");
        expect(css).toContain("--juice-menu-panel");
        expect(css).toContain("--juice-menu-panel-border");
        expect(css).toContain("--juice-menu-panel-shadow");
        expect(css).toContain("--juice-menu-ink");
        expect(css).toContain("--juice-menu-item");
        expect(css).toContain("--juice-menu-item-hover");
        expect(css).toContain("--juice-menu-item-active");
        expect(css).toContain("--juice-menu-separator");
        expect(css).toContain("--juice-menu-focus-ring");
        expect(css).toContain("--juice-menu-opener");
        expect(css).toContain("--juice-menu-opener-ink");
        expect(css).not.toMatch(/select\[menu/);
        expect(css).not.toMatch(/\[role=["']?menu["']?\]/);
        expect(css).not.toMatch(/\[role=["']?menuitem["']?\]/);
        expect(css).not.toMatch(/\[menu-button\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).not.toMatch(/\[menu-root\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[menu\][^{]*\{[^}]*--juice-popover-panel/);
        expect(css).not.toMatch(/\[menu\][^{]*\{[^}]*--juice-combobox-list/);
        expect(css).not.toMatch(/\[menu\][^{]*\{[^}]*--juice-tooltip-panel/);
        expect(css).not.toMatch(/\[menu\][^{]*\{[^}]*--juice-modal-overlay/);
        expect(css).not.toMatch(/\[menu\][^{]*\{[^}]*--juice-drawer-overlay/);
    });

    it("includes switch structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[switch]");
        expect(css).toMatch(/\[theme\]\s+\[switch\]/);
        expect(css).toMatch(/\[switch\]\[aria-checked=["']?true["']?\]/);
        expect(css).toMatch(/\[switch\]:checked/);
        expect(css).toMatch(/\[switch\]:focus-visible/);
        expect(css).toMatch(/\[switch\]::after/);
        expect(css).toContain("--juice-switch-track");
        expect(css).toContain("--juice-switch-track-checked");
        expect(css).toContain("--juice-switch-thumb");
        expect(css).toContain("--juice-switch-thumb-checked");
        expect(css).toContain("--juice-switch-focus-ring");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).not.toMatch(/\[role=["']?switch["']?\]/);
        expect(css).not.toMatch(/\[switch-track\]/);
        expect(css).not.toMatch(/\[switch-thumb\]/);
        expect(css).not.toMatch(/\[switch-size/);
        expect(css).not.toMatch(/\[switch\]\[scale/);
        expect(css).not.toMatch(/\[switch=["']?on["']?\]/);
        expect(css).not.toMatch(/\[switch\][^{]*\{[^}]*--aqua-button-background/);
        expect(css).not.toMatch(/\[switch\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[switch\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[switch\][^{]*\{[^}]*--juice-menu-panel/);
    });

    it("includes slider structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[slider]");
        expect(css).toContain("[slider-thumb]");
        expect(css).toContain("[slider-fill]");
        expect(css).toMatch(/\[theme\]\s+\[slider\]:not\(\[slider=vertical\]\)/);
        expect(css).toMatch(/\[aria-valuenow=["']?40["']?\]/);
        expect(css).toMatch(/\[aria-valuemin=["']?0["']?\]/);
        expect(css).toMatch(/\[aria-valuemax=["']?100["']?\]/);
        expect(css).toContain("--juice-slider-ratio");
        expect(css).toContain("--juice-slider-track");
        expect(css).toContain("--juice-slider-track-border");
        expect(css).toContain("--juice-slider-fill");
        expect(css).toContain("--juice-slider-thumb");
        expect(css).toContain("--juice-slider-thumb-border");
        expect(css).toContain("--juice-slider-thumb-shadow");
        expect(css).toContain("--juice-slider-focus-ring");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).not.toMatch(/\[role=["']?slider["']?\]/);
        expect(css).not.toMatch(/\[slider-track\]/);
        expect(css).not.toMatch(/\[slider-value/);
        expect(css).not.toMatch(/\[slider-size/);
        expect(css).not.toMatch(/\[slider\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[slider\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[slider\][^{]*\{[^}]*--juice-switch-track/);
    });

    it("includes checkbox structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[checkbox]");
        expect(css).toMatch(/\[theme\]\s+\[checkbox\]/);
        expect(css).toMatch(/\[checkbox\]\[aria-checked=["']?true["']?\]/);
        expect(css).toMatch(/\[checkbox\]:checked/);
        expect(css).toMatch(/\[checkbox\]:focus-visible/);
        expect(css).toMatch(/\[checkbox\]::after/);
        expect(css).toContain("--juice-checkbox-control");
        expect(css).toContain("--juice-checkbox-control-checked");
        expect(css).toContain("--juice-checkbox-border");
        expect(css).toContain("--juice-checkbox-border-checked");
        expect(css).toContain("--juice-checkbox-mark");
        expect(css).toContain("--juice-checkbox-focus-ring");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).not.toMatch(/\[role=["']?checkbox["']?\]/);
        expect(css).not.toMatch(/aria-checked=["']?mixed["']?/);
        expect(css).not.toMatch(/\[checkbox-size/);
        expect(css).not.toMatch(/\[checkbox\]\[scale/);
        expect(css).not.toMatch(/\[checkbox\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[checkbox\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[checkbox\][^{]*\{[^}]*--juice-switch-track/);
        expect(css).not.toContain("--juice-radiogroup-");
    });

    it("includes radio structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[radio]");
        expect(css).toContain("[radiogroup]");
        expect(css).toMatch(/\[theme\]\s+\[radio\]/);
        expect(css).toMatch(/\[theme\]\s+\[radiogroup\]/);
        expect(css).toMatch(/\[radio\]\[aria-checked=["']?true["']?\]/);
        expect(css).toMatch(/\[radio\]:checked/);
        expect(css).toMatch(/\[radio\]:focus-visible/);
        expect(css).toMatch(/\[radio\]::after/);
        expect(css).toContain("--juice-radio-control");
        expect(css).toContain("--juice-radio-control-checked");
        expect(css).toContain("--juice-radio-border");
        expect(css).toContain("--juice-radio-border-checked");
        expect(css).toContain("--juice-radio-mark");
        expect(css).toContain("--juice-radio-focus-ring");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).not.toMatch(/\[role=["']?radio["']?\]/);
        expect(css).not.toMatch(/\[role=["']?radiogroup["']?\]/);
        expect(css).not.toMatch(/\[radio-size/);
        expect(css).not.toMatch(/\[radio\]\[scale/);
        expect(css).not.toMatch(/\[radio\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[radio\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[radio\][^{]*\{[^}]*--juice-checkbox-control/);
        expect(css).not.toContain("--juice-radiogroup-");
    });

    it("includes breadcrumb structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[breadcrumb]");
        expect(css).toContain("[breadcrumb-item]");
        expect(css).toContain("[breadcrumb-link]");
        expect(css).toContain("[breadcrumb-separator]");
        expect(css).toMatch(/\[theme\]\s+\[breadcrumb\]/);
        expect(css).toMatch(/\[breadcrumb\]\s+\[aria-current=["']?page["']?\]/);
        expect(css).toMatch(/\[breadcrumb-item\]:not\(:last-child\)/);
        expect(css).toContain("--juice-breadcrumb-ink");
        expect(css).toContain("--juice-breadcrumb-ink-current");
        expect(css).toContain("--juice-breadcrumb-ink-hover");
        expect(css).toContain("--juice-breadcrumb-separator");
        expect(css).toContain("--juice-breadcrumb-focus-ring");
        expect(css).toContain("--juice-breadcrumb-surface");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).not.toMatch(/(^|[,{])\s*\[aria-current=["']?page["']?\]/);
        expect(css).not.toMatch(/\[breadcrumb\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[breadcrumb\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[breadcrumb\][^{]*\{[^}]*--juice-tabs-text/);
        expect(css).not.toMatch(/nav\[type=["']?breadcrumb["']?\][^{]*--juice-breadcrumb-ink/);
    });

    it("includes progress structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[progress]");
        expect(css).toContain("[progress-fill]");
        expect(css).toContain("[progress-label]");
        expect(css).toMatch(/\[theme\]\s+\[progress\]/);
        expect(css).toMatch(/\[progress=["']?indeterminate["']?\]/);
        expect(css).toMatch(/\[progress\]:not\(\[progress=indeterminate\]\)\[aria-valuenow=["']?40["']?\]/);
        expect(css).toMatch(/\[aria-valuemin=["']?0["']?\]/);
        expect(css).toMatch(/\[aria-valuemax=["']?100["']?\]/);
        expect(css).toContain("--juice-progress-track");
        expect(css).toContain("--juice-progress-track-border");
        expect(css).toContain("--juice-progress-fill");
        expect(css).toContain("--juice-progress-ink");
        expect(css).toContain("--juice-progress-focus-ring");
        expect(css).toContain("--juice-progress-ratio");
        expect(css).toContain("juice-progress-indeterminate");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).not.toMatch(/\[role=["']?progressbar["']?\]/);
        expect(css).not.toMatch(/\[progress-bar\]/);
        expect(css).not.toMatch(/\[progress-track\]/);
        expect(css).not.toMatch(/\[progress-value/);
        expect(css).not.toMatch(/\[progress-size/);
        expect(css).not.toMatch(/(^|[,}\n])progress\s*[,{]/);
        expect(css).not.toMatch(/\[progress\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[progress\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[progress\][^{]*\{[^}]*--juice-slider-fill/);
    });

    it("includes pagination structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[pagination]");
        expect(css).toContain("[pagination-item]");
        expect(css).toContain("[pagination-link]");
        expect(css).toContain("[pagination-prev]");
        expect(css).toContain("[pagination-next]");
        expect(css).toContain("[pagination-ellipsis]");
        expect(css).toContain("[pagination-status]");
        expect(css).toMatch(/\[theme\]\s+\[pagination\]/);
        expect(css).toMatch(/\[pagination\]\s+\[aria-current=["']?page["']?\]/);
        expect(css).toMatch(/\[aria-disabled=["']?true["']?\]/);
        expect(css).toContain("--juice-pagination-surface");
        expect(css).toContain("--juice-pagination-surface-hover");
        expect(css).toContain("--juice-pagination-surface-current");
        expect(css).toContain("--juice-pagination-ink");
        expect(css).toContain("--juice-pagination-ink-hover");
        expect(css).toContain("--juice-pagination-ink-current");
        expect(css).toContain("--juice-pagination-ink-disabled");
        expect(css).toContain("--juice-pagination-border");
        expect(css).toContain("--juice-pagination-focus-ring");
        expect(css).toContain("--juice-pagination-ellipsis");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).not.toMatch(/(^|[,{])\s*\[aria-current=["']?page["']?\]/);
        expect(css).not.toMatch(/\[role=["']?navigation["']?\]/);
        expect(css).not.toMatch(/\[pagination\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[pagination\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[pagination\][^{]*\{[^}]*--juice-breadcrumb-ink/);
        expect(css).not.toMatch(/nav\[type=["']?pagination["']?\][^{]*--juice-pagination-ink/);
    });

    it("includes disclosure structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[disclosure]");
        expect(css).toContain("[disclosure-trigger]");
        expect(css).toContain("[disclosure-panel]");
        expect(css).toMatch(/\[theme\]\s+\[disclosure\]/);
        expect(css).toMatch(/\[disclosure-trigger\]\[aria-expanded=["']?true["']?\]/);
        expect(css).toContain("--juice-disclosure-surface");
        expect(css).toContain("--juice-disclosure-border");
        expect(css).toContain("--juice-disclosure-trigger");
        expect(css).toContain("--juice-disclosure-trigger-hover");
        expect(css).toContain("--juice-disclosure-trigger-open");
        expect(css).toContain("--juice-disclosure-ink");
        expect(css).toContain("--juice-disclosure-chevron");
        expect(css).toContain("--juice-disclosure-focus-ring");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).toContain("rotate(-45deg)");
        expect(css).toContain("rotate(45deg)");
        expect(css).not.toMatch(/\[disclosure\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[disclosure\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[disclosure\][^{]*\{[^}]*--juice-accordion-trigger/);
        expect(css).not.toMatch(/\[accordion-item\][^{]*--juice-disclosure/);
        expect(css).not.toMatch(/\[accordion\][^{]*--juice-disclosure/);
        expect(css).not.toMatch(/(^|[,{])\s*details\s*[,{]/);
        expect(css).not.toMatch(/(^|[,{])\s*summary\s*[,{]/);
    });

    it("includes icon-button structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const reduced = reducedMotionBlocks(css);
        const blocks = [...css.matchAll(/\[icon-button\][^{]*\{[^}]*\}/g)].map((match) => match[0]);

        expect(blocks.length).toBeGreaterThan(0);
        for (const block of blocks) {
            expect(block).not.toMatch(/(^|[;{\s])background-color\s*:/);
            expect(block).not.toMatch(/(^|[;{\s])background-image\s*:/);
            expect(block).not.toMatch(/(^|[;{\s])background\s*:/);
            expect(block).not.toMatch(/z-index:\s*10/);
        }

        expect(css).toContain("[icon-button]");
        expect(css).toMatch(/\[icon-button=["']?round["']?\]/);
        expect(css).toContain("[icon-button][round]");
        expect(css).toMatch(/\[icon-button\]\[scale=["']?sm["']?\]/);
        expect(css).toMatch(/\[icon-button\]\[scale=["']?lg["']?\]/);
        expect(css).toContain("[icon-button][pressed]");
        expect(css).toMatch(/\[icon-button\]\[aria-pressed=["']?true["']?\]/);
        expect(css).toContain("[icon-button]:focus-visible");
        expect(css).toContain("[icon-button]:active");
        expect(css).toContain("[icon-button]:disabled");
        expect(css).toMatch(/\[icon-button\]\[aria-disabled=["']?true["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[icon-button\]/);
        expect(css).toMatch(/\[icon-button\]:active[^{]*\{[^}]*translateY\(2px\)/);
        expect(css).toContain("outline: 2px solid var(--juice-icon-button-focus-ring)");
        expect(css).toContain("--juice-icon-button-padding: 0.625rem");
        expect(css).toContain("--juice-icon-button-padding-sm: 0.4rem");
        expect(css).toContain("--juice-icon-button-padding-lg: 0.875rem");
        expect(css).toContain("--juice-icon-button-icon-size: 1.25rem");
        expect(css).toContain("--juice-icon-button-icon-size-sm: 1rem");
        expect(css).toContain("--juice-icon-button-icon-size-lg: 1.5rem");
        expect(css).toContain(
            "--juice-icon-button-size: calc(var(--juice-icon-button-icon-size) + (var(--juice-icon-button-padding) * 2))"
        );
        expect(css).toContain("--juice-icon-button-radius: 0.5rem");
        expect(css).toContain("--juice-icon-button-radius-round: 999px");
        expect(css).toContain("--juice-icon-button-focus-ring: currentColor");
        expect(css).toContain(
            "transition: background-color var(--juice-motion-duration-instant) var(--juice-motion-ease-standard)"
        );
        expect(reduced.some((block) => block.includes("[icon-button]") && block.includes("transition: none"))).toBe(true);
        expect(css).not.toMatch(/\[icon-button\][^{]*\{[^}]*z-index:\s*10/);
    });

    it("includes spinner structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[spinner]");
        expect(css).toContain("[spinner-label]");
        expect(css).toMatch(/\[theme\]\s+\[spinner\]/);
        expect(css).toContain("--juice-spinner-track");
        expect(css).toContain("--juice-spinner-indicator");
        expect(css).toContain("--juice-spinner-ink");
        expect(css).toContain("--juice-spinner-focus-ring");
        expect(css).toContain("juice-spinner-spin");
        expect(css).toContain("border-top-color");
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
        expect(css).not.toMatch(/\[spinner-track\]/);
        expect(css).not.toMatch(/\[spinner-indicator\]/);
        expect(css).not.toMatch(/\[spinner-size/);
        expect(css).not.toMatch(/\[role=["']?status["']?\]/);
        expect(css).not.toMatch(/\[spinner\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[spinner\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/\[spinner\][^{]*\{[^}]*--juice-progress-fill/);
        expect(css).not.toMatch(/\[progress\][^{]*\{[^}]*--juice-spinner/);
        expect(css).not.toMatch(/\[disclosure\][^{]*\{[^}]*--juice-spinner/);
    });

    it("includes skeleton structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const reduced = reducedMotionBlocks(css);

        expect(css).toContain("[skeleton]");
        expect(css).toMatch(/\[skeleton=["']?text["']?\]/);
        expect(css).toMatch(/\[skeleton=["']?circle["']?\]/);
        expect(css).toMatch(/\[skeleton=["']?rect["']?\]/);
        expect(css).toMatch(/\[skeleton\]\[scale=["']?sm["']?\]/);
        expect(css).toMatch(/\[skeleton\]\[scale=["']?lg["']?\]/);
        expect(css).toMatch(/\[skeleton=["']?circle["']?\]\[scale=["']?sm["']?\]/);
        expect(css).toMatch(/\[skeleton=["']?circle["']?\]\[scale=["']?lg["']?\]/);
        expect(css).toMatch(/\[skeleton=["']?text["']?\]\[lines=["']?3["']?\]/);
        expect(css).toMatch(/\[skeleton=["']?text["']?\]\[lines=["']?8["']?\]/);
        expect(css).not.toMatch(/\[skeleton=["']?text["']?\]\[lines=["']?9["']?\]/);
        expect(css).toContain("[skeleton][static]");
        expect(css).toMatch(/\[theme\]\s+\[skeleton\]/);
        expect(css).toContain("--juice-skeleton-base:");
        expect(css).toContain("--juice-skeleton-highlight:");
        expect(css).toContain("--juice-skeleton-radius: 0.375rem");
        expect(css).toContain("--juice-skeleton-line-height: 0.75rem");
        expect(css).toContain("--juice-skeleton-line-height-sm: 0.5rem");
        expect(css).toContain("--juice-skeleton-line-height-lg: 1rem");
        expect(css).toContain("--juice-skeleton-line-gap: 0.5rem");
        expect(css).toContain("--juice-skeleton-circle-size: 2.5rem");
        expect(css).toContain("--juice-skeleton-circle-size-sm: 1.5rem");
        expect(css).toContain("--juice-skeleton-circle-size-lg: 4rem");
        expect(css).toContain("--juice-skeleton-rect-height: 4rem");
        expect(css).toContain("--juice-skeleton-rect-height-sm: 2.5rem");
        expect(css).toContain("--juice-skeleton-rect-height-lg: 6rem");
        expect(css).toContain("--juice-skeleton-duration: calc(var(--juice-motion-duration-slow) * 1.6)");
        expect(css).toContain("color-mix(in srgb, currentColor 14%, var(--juice-surface-muted-bg,");
        expect(css).toContain("juice-skeleton-shimmer");
        expect(css).toContain("var(--juice-motion-ease-linear)");
        expect(css).toContain("-webkit-text-fill-color: transparent");
        expect(css).toContain("clip-path: inset(50%)");
        expect(css).toContain("repeating-linear-gradient");
        expect(reduced.some((block) => block.includes("[skeleton]") && block.includes("animation: none"))).toBe(true);
        expect(css).not.toMatch(/\[skeleton-line\]/);
        expect(css).not.toMatch(/\[skeleton\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[skeleton\][^{]*\{[^}]*--juice-spinner/);
        expect(css).not.toMatch(/\[skeleton\][^{]*\{[^}]*--juice-progress/);
        expect(css).not.toMatch(/\[skeleton\][^{]*(?:^|[^-\w])color:\s*transparent/);
        expect(css).not.toMatch(/\[role=["']?status["']?\]/);
    });

    it("includes avatar structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const reduced = reducedMotionBlocks(css);

        expect(css).toContain("[avatar]");
        expect(css).toMatch(/\[avatar=["']?round["']?\]/);
        expect(css).toMatch(/\[avatar=["']?square["']?\]/);
        expect(css).toMatch(/\[avatar\]\[scale=["']?sm["']?\]/);
        expect(css).toMatch(/\[avatar\]\[scale=["']?lg["']?\]/);
        expect(css).not.toMatch(/\[avatar\]\[scale=["']?md["']?\]/);
        expect(css).toMatch(/\[avatar\]\[status=["']?online["']?\]/);
        expect(css).toMatch(/\[avatar\]\[status=["']?away["']?\]/);
        expect(css).toMatch(/\[avatar\]\[status=["']?busy["']?\]/);
        expect(css).toMatch(/\[avatar\]\[status=["']?offline["']?\]/);
        expect(css).toContain("[avatar-group]");
        expect(css).toContain("[avatar-more]");
        expect(css).toMatch(/\[avatar-group\]\[scale=["']?sm["']?\]/);
        expect(css).toMatch(/\[avatar-group\]\[scale=["']?lg["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[avatar\]/);
        expect(css).toContain("--juice-avatar-size: 2.5rem");
        expect(css).toContain("--juice-avatar-size-sm: 1.5rem");
        expect(css).toContain("--juice-avatar-size-lg: 4rem");
        expect(css).toContain("--juice-avatar-font-size: calc(var(--juice-avatar-size) * 0.4)");
        expect(css).toContain("--juice-avatar-font-size-sm: calc(var(--juice-avatar-size-sm) * 0.4)");
        expect(css).toContain("--juice-avatar-font-size-lg: calc(var(--juice-avatar-size-lg) * 0.4)");
        expect(css).toContain("--juice-avatar-radius: 999px");
        expect(css).toContain("--juice-avatar-radius-square: 0.375rem");
        expect(css).toContain("--juice-avatar-bg:");
        expect(css).toContain("--juice-avatar-ink: currentColor");
        expect(css).toContain("--juice-avatar-ring:");
        expect(css).toContain("--juice-avatar-ring-width: 2px");
        expect(css).toContain("--juice-avatar-status-size: calc(var(--juice-avatar-size) * 0.28)");
        expect(css).toContain("--juice-avatar-group-overlap: calc(var(--juice-avatar-size) * -0.25)");
        expect(css).toContain("--juice-avatar-status-online:");
        expect(css).toContain("--juice-avatar-status-away:");
        expect(css).toContain("--juice-avatar-status-busy:");
        expect(css).toContain("--juice-avatar-status-offline:");
        expect(css).toContain("var(--juice-surface-muted-bg,");
        expect(css).toContain("var(--juice-banner-success, var(--juice-toast-success,");
        expect(css).toContain("object-fit: cover");
        expect(css).toContain("text-transform: uppercase");
        expect(css).toContain("margin-inline-start: var(--juice-avatar-group-overlap)");
        expect(css).toContain(
            "transition: background-color var(--juice-motion-duration-fast) var(--juice-motion-ease-standard)"
        );
        expect(reduced.some((block) => block.includes("[avatar]") && block.includes("transition: none"))).toBe(true);
        expect(css).not.toMatch(/\[avatar-status\]/);
        expect(css).not.toMatch(/\[avatar\]\[scale=["']?md["']?\]/);
        expect(css).not.toMatch(/\[avatar\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[avatar\][^{]*\{[^}]*z-index:\s*1000/);
        expect(css).not.toMatch(/\[role=["']?status["']?\]/);

        for (const id of ["kiwipress", "aquaflux"]) {
            const themeCss = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");
            expect(themeCss).not.toContain("--juice-avatar-");
        }

        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");
        expect(tideCss).toContain("--juice-avatar-status-away:");
        expect(tideCss).not.toContain("--juice-avatar-size");
        expect(tideCss).not.toContain("--juice-avatar-bg");
        expect(tideCss).not.toContain("--juice-avatar-status-online");
    });

    it("includes list structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const reduced = reducedMotionBlocks(css);

        expect(css).toContain(":where(ul, ol, div)[list]");
        expect(css).toContain("[list-item]");
        expect(css).toContain("[list-leading]");
        expect(css).toContain("[list-content]");
        expect(css).toContain("[list-secondary]");
        expect(css).toContain("[list-trailing]");
        expect(css).toMatch(/\[list\]\[divided\]/);
        expect(css).toMatch(/\[list\]\[dense\]/);
        expect(css).toMatch(/\[list-item\]\[selected\]/);
        expect(css).toMatch(/\[aria-current\]:not\(\[aria-current=["']?false["']?\]\)/);
        expect(css).toMatch(/\[list-leading\] :is\(\[avatar\], \[icon\]\)/);
        expect(css).toMatch(/:where\(a, button\)\[list-item\]:focus-visible/);
        expect(css).toMatch(/\[list-item\] > :where\(a, button\):focus-visible/);
        expect(css).toMatch(/\[theme\]\s+:where\(a, button\)\[list-item\]/);
        expect(css).toMatch(/\[theme\]\s+:where\(ul, ol, div\)\[list\]/);
        expect(css).toContain("--juice-list-gap: 0;");
        expect(css).toContain("--juice-list-padding: 0.75rem 1rem");
        expect(css).toContain("--juice-list-padding-dense: 0.375rem 0.75rem");
        expect(css).toContain("--juice-list-radius: 0.375rem");
        expect(css).toContain("--juice-list-divider:");
        expect(css).toContain("--juice-list-secondary:");
        expect(css).toContain("--juice-list-hover:");
        expect(css).toContain("--juice-list-selected:");
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-list-divider:/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-list-secondary:/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-list-hover:/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-list-selected:/);
        expect(css).toContain("color-mix(in srgb, currentColor 92%, transparent)");
        expect(css).toContain("color-mix(in srgb, currentColor 8%, transparent)");
        expect(css).toContain("color-mix(in srgb, currentColor 14%, transparent)");
        expect(css).toContain("color-mix(in srgb, currentColor 28%, transparent)");
        expect(css).toContain("list-style: none");
        expect(css).toContain("text-overflow: ellipsis");
        expect(css).toContain("overflow-wrap: anywhere");
        expect(css).toContain("outline: 2px solid currentColor");
        expect(css).toContain("outline-offset: 2px");
        expect(css).toContain(
            "transition: background-color var(--juice-motion-duration-fast) var(--juice-motion-ease-standard), color var(--juice-motion-duration-fast) var(--juice-motion-ease-standard)"
        );
        expect(reduced.some((block) => block.includes("[list-item]") && block.includes("transition: none"))).toBe(true);
        expect(css).not.toMatch(/input\[list\]/);
        expect(css).not.toMatch(/\[role=["']?list["']?\]/);
        expect(css).not.toMatch(/\[role=["']?listitem["']?\]/);
        expect(css).not.toMatch(/\[list-item\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[list-item\][^{]*\{[^}]*z-index:\s*1000/);
        expect(css).not.toMatch(/:where\(ul, ol, div\)\[list\][^{]*\{[^}]*--juice-menu/);
        expect(css).not.toMatch(/:where\(ul, ol, div\)\[list\][^{]*\{[^}]*--juice-combobox/);
        expect(css).not.toMatch(/:where\(ul, ol, div\)\[list\][^{]*\{[^}]*--juice-avatar/);
        expect(css).not.toMatch(/:where\(ul, ol, div\)\[list\][^{]*\{[^}]*--juice-pagination/);

        for (const id of readBundledThemeIds()) {
            const themeCss = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");
            expect(themeCss).not.toContain("--juice-list-");
        }
    });

    it("includes table structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const reduced = reducedMotionBlocks(css);

        expect(css).toContain(":where(table)[table]");
        expect(css).toContain("[table-scroll]");
        expect(css).toMatch(/\[table\]\[striped\]/);
        expect(css).toMatch(/\[table\]\[dense\]/);
        expect(css).toMatch(/\[table\]\[sticky\]/);
        expect(css).toContain("[table-align=start]");
        expect(css).toContain("[table-align=center]");
        expect(css).toContain("[table-align=end]");
        expect(css).toContain("[numeric]");
        expect(css).toContain("font-variant-numeric: tabular-nums");
        expect(css).toContain(":where(table)[table] :where(th, td, caption) :where(p, span, li, label)");
        expect(css).toMatch(/tbody > tr:is\(\[selected\], \[aria-selected=["']?true["']?\]\)/);
        expect(css).toMatch(/\[table-scroll\]:focus-visible/);
        expect(css).toMatch(/\[theme\]\s+:where\(table\)\[table\]/);
        expect(css).toMatch(/\[theme\]\s+\[table-scroll\]/);
        expect(css).toContain("--juice-table-padding: 0.75rem 1rem");
        expect(css).toContain("--juice-table-padding-dense: 0.375rem 0.75rem");
        expect(css).toContain("--juice-table-radius: 0.375rem");
        expect(css).toContain("--juice-table-border:");
        expect(css).toContain("--juice-table-header-bg:");
        expect(css).toContain("--juice-table-stripe:");
        expect(css).toContain("--juice-table-hover:");
        expect(css).toContain("--juice-table-selected:");
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-table-border:/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-table-header-bg:/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-table-stripe:/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-table-hover:/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-table-selected:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-table-padding:/);
        expect(css).toContain("color-mix(in srgb, currentColor 24%, transparent)");
        expect(css).toContain("color-mix(in srgb, currentColor 4%, transparent)");
        expect(css).toContain("color-mix(in srgb, currentColor 6%, transparent)");
        expect(css).toContain("color-mix(in srgb, currentColor 8%, transparent)");
        expect(css).toContain("border-collapse: separate");
        expect(css).toContain("border-spacing: 0");
        expect(css).toContain("overflow-x: auto");
        expect(css).toContain("position: sticky");
        expect(css).toContain("inset-block-start: 0");
        expect(css).toContain("outline: 2px solid currentColor");
        expect(css).toContain("outline-offset: 2px");
        expect(css).toContain(
            "transition: background-color var(--juice-motion-duration-fast) var(--juice-motion-ease-standard)"
        );
        expect(reduced.some((block) => block.includes(":where(table)[table]") && block.includes("transition: none"))).toBe(
            true
        );
        expect(css).toMatch(/\[table\]\[sticky\] > thead > tr > :where\(th, td\)[^{]*\{[^}]*z-index:\s*1/);
        expect(css).not.toMatch(/:where\(table\)\[table\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/:where\(table\)\[table\][^{]*\{[^}]*z-index:\s*1000/);
        expect(css).toContain("th[sortable]");
        expect(css).toContain("[aria-sort=ascending]");
        expect(css).toContain("[aria-sort=descending]");
        expect(css).toContain("[aria-sort=none]");
        expect(css).toMatch(/th\[sortable\] > button:focus-visible/);
        expect(css).toMatch(/th\[sortable\] > button[^{]*\{[^}]*font: inherit/);
        expect(css).toMatch(/th\[sortable\] > button[^{]*\{[^}]*background-color: transparent/);
        expect(css).toMatch(/th\[sortable\] > button[^{]*\{[^}]*border: none/);
        expect(css).toMatch(/\[aria-sort=ascending\][^{]*\{[^}]*border-block-end:[^;]*currentColor/);
        expect(css).toMatch(/\[aria-sort=descending\][^{]*\{[^}]*border-block-start:[^;]*currentColor/);
        expect(css).toMatch(
            /th\[sortable\] > button::after[^{]*\{[^}]*transition: opacity var\(--juice-motion-duration-fast\) var\(--juice-motion-ease-standard\)/
        );
        expect(
            reduced.some((block) => block.includes("th[sortable]") && block.includes("transition: none"))
        ).toBe(true);
        expect(css).not.toMatch(/\[role=["']?table["']?\]/);
        expect(css).not.toMatch(/\[role=["']?grid["']?\]/);
        expect(css).not.toMatch(/:where\(table\)\[table\][^{]*\{[^}]*--juice-list-/);
        expect(css).not.toMatch(/div\[table\]/);

        for (const id of readBundledThemeIds()) {
            const themeCss = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");
            expect(themeCss).not.toContain("--juice-table-");
        }
    });

    it("includes badge structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[badge]");
        expect(css).toContain("[badge=square]");
        expect(css).toContain("[badge=ribbon]");
        expect(css).toMatch(/\[theme\]\s+\[badge\]/);
        expect(css).toMatch(/\[theme\]\s+\[badge=square\]/);
        expect(css).toMatch(/\[theme\]\s+\[badge=ribbon\]/);
        expect(css).toMatch(/\[theme\]\s+\[cta\]\s+\[badge\]/);
        expect(css).toMatch(/:where\(a,\s*button\)\[badge\]:focus-visible/);
        expect(css).toMatch(/\[theme\]\s+:where\(a,\s*button\)\[badge\]:focus-visible/);
        expect(css).toContain("--juice-badge-padding: 0.375rem 0.75rem");
        expect(css).toContain("--juice-badge-radius: 999px");
        expect(css).toContain("--juice-badge-radius-square: 0.375rem");
        expect(css).toContain("--juice-badge-font-size: 0.8125rem");
        expect(css).toContain("--juice-badge-gap: 0.375rem");
        expect(css).toContain("--juice-badge-bg:");
        expect(css).toContain("--juice-badge-ink:");
        expect(css).toContain("--juice-badge-border:");
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-badge-bg:\s*color-mix\(in srgb, currentColor 1%, transparent\)/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-badge-ink:\s*currentColor/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-badge-border:\s*color-mix\(in srgb, currentColor 24%, transparent\)/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-badge-padding:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-badge-radius:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-badge-font-size:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-badge-gap:/);
        expect(css).toMatch(/\[theme\]\s+\[badge\]\s*\{[^}]*color:\s*var\(--juice-badge-ink\)/);
        expect(css).toMatch(/\[theme\]\s+\[badge\]\s*\{[^}]*background-color:\s*var\(--juice-badge-bg\)/);
        expect(css).toMatch(/\[theme\]\s+\[badge\]\s*\{[^}]*line-height:\s*1;/);
        expect(css).toMatch(/\[theme\]\s+\[badge\]\s*\{[^}]*border:\s*1px solid var\(--juice-badge-border\)/);
        expect(css).toMatch(/\[theme\]\s+\[cta\]\s+\[badge\]\s*\{[^}]*color:\s*var\(--juice-badge-ink\)/);
        expect(css).toMatch(/\[theme\]\s+\[cta\]\s+\[badge\]\s*\{[^}]*background-color:\s*var\(--juice-badge-bg\)/);
        expect(css).toMatch(/\[theme\]\s+\[cta\]\s+\[badge\]\s*\{[^}]*border-color:\s*var\(--juice-badge-border\)/);
        expect(css).toContain("outline: 2px solid currentColor");
        expect(css).toContain("outline-offset: 2px");
        expect(css).not.toMatch(/\[badge=dot\]/);
        expect(css).not.toMatch(/\[badge=lg\]/);
        expect(css).not.toMatch(/\[badge\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[badge\][^{]*\{[^}]*z-index:\s*1000/);
        expect(css).not.toContain("--juice-badge-focus-ring");

        for (const id of readBundledThemeIds()) {
            const themeCss = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");
            expect(themeCss).not.toContain("--juice-badge-");
        }
    });

    it("includes safe-area structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[safe-area]");
        expect(css).toMatch(/\[safe-area=["']?top["']?\]/);
        expect(css).toMatch(/\[safe-area=["']?bottom["']?\]/);
        expect(css).toMatch(/\[safe-area=["']?x["']?\]/);
        expect(css).toMatch(/\[safe-area=["']?y["']?\]/);
        expect(css).toMatch(/\[safe-area\]:not\(\[safe-area=["']?top["']?\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[safe-area\]/);
        expect(css).toMatch(/\[theme\]\s+\[safe-area=["']?top["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[safe-area=["']?bottom["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[safe-area=["']?x["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[safe-area=["']?y["']?\]/);
        expect(css).toMatch(/nav\[fixed\] > \[container\]\[safe-area\]/);
        expect(css).toMatch(/nav\[sticky\] > \[container\]\[safe-area\]/);
        expect(css).toMatch(/\[wizard-header\] > \[container\]\[safe-area\]/);
        expect(css).toContain("--juice-safe-area-pad: 1rem");
        expect(css).toMatch(/:root\s*\{[^}]*--juice-safe-area-pad:\s*1rem/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-safe-area-pad:/);
        expect(css).toContain("max(var(--juice-safe-area-pad), env(safe-area-inset-top, 0px))");
        expect(css).toContain("max(var(--juice-safe-area-pad), env(safe-area-inset-right, 0px))");
        expect(css).toContain("max(var(--juice-safe-area-pad), env(safe-area-inset-bottom, 0px))");
        expect(css).toContain("max(var(--juice-safe-area-pad), env(safe-area-inset-left, 0px))");
        expect(css).toContain("box-sizing: border-box");

        const topRule = css.match(/(?:^|[},])\s*\[safe-area=top\],[^{]*\{[^}]*\}/);
        expect(topRule?.[0]).toContain("padding-top:");
        expect(topRule?.[0]).toContain("env(safe-area-inset-top, 0px)");
        expect(topRule?.[0]).not.toContain("padding-right:");
        expect(topRule?.[0]).not.toContain("padding-bottom:");
        expect(topRule?.[0]).not.toContain("padding-left:");

        const bottomRule = css.match(/(?:^|[},])\s*\[safe-area=bottom\],[^{]*\{[^}]*\}/);
        expect(bottomRule?.[0]).toContain("padding-bottom:");
        expect(bottomRule?.[0]).not.toContain("padding-top:");

        const xRule = css.match(/(?:^|[},])\s*\[safe-area=x\],[^{]*\{[^}]*\}/);
        expect(xRule?.[0]).toContain("padding-left:");
        expect(xRule?.[0]).toContain("padding-right:");
        expect(xRule?.[0]).toContain("env(safe-area-inset-left, 0px)");
        expect(xRule?.[0]).toContain("env(safe-area-inset-right, 0px)");
        expect(xRule?.[0]).not.toContain("padding-top:");
        expect(xRule?.[0]).not.toContain("padding-bottom:");

        const yRule = css.match(/(?:^|[},])\s*\[safe-area=y\],[^{]*\{[^}]*\}/);
        expect(yRule?.[0]).toContain("padding-top:");
        expect(yRule?.[0]).toContain("padding-bottom:");
        expect(yRule?.[0]).not.toContain("padding-left:");
        expect(yRule?.[0]).not.toContain("padding-right:");

        expect(css).not.toMatch(/\[safe-area-margin\]/);
        expect(css).not.toMatch(/\[safe-area\][^{]*\{[^}]*position:\s*(?:fixed|sticky)/);
        expect(css).not.toMatch(/\[safe-area\][^{]*\{[^}]*z-index:/);
        expect(css).not.toMatch(/\[safe-area\][^{]*\{[^}]*margin(?:-|\s*:)/);

        for (const id of readBundledThemeIds()) {
            const themeCss = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");
            expect(themeCss).not.toContain("--juice-safe-area-");
            expect(themeCss).not.toContain("[safe-area]");
        }
    });

    describe("keyboard-avoider structural chrome", () => {
        it("includes keyboard-avoider layout chrome in core CSS", () => {
            const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
            const start = css.indexOf("@property --juice-keyboard-inset");
            const end = css.indexOf("[search-panel]", start);
            expect(start).toBeGreaterThan(-1);
            expect(end).toBeGreaterThan(start);
            const slice = css.slice(start, end);

            const word = (name: string) => new RegExp(`\\[keyboard-avoider~=["']?${name}["']?\\]`);

            expect(slice).toContain("[keyboard-avoider]");
            expect(slice).toMatch(word("padding"));
            expect(slice).toMatch(word("translate"));
            expect(slice).toMatch(word("footer"));
            expect(slice).toMatch(/\[keyboard-avoider\]:not\(\[keyboard-avoider~=["']?padding["']?\]\)/);
            expect(slice).toMatch(/:not\(\[keyboard-avoider~=["']?translate["']?\]\)/);
            expect(slice).toMatch(/:not\(\[keyboard-avoider~=["']?footer["']?\]\)/);
            expect(slice).toMatch(/\[theme\]\s+\[keyboard-avoider\]/);
            expect(slice).toMatch(/\[theme\]\s+\[keyboard-avoider~=["']?padding["']?\]/);
            expect(slice).toMatch(/\[theme\]\s+\[keyboard-avoider~=["']?translate["']?\]/);
            expect(slice).toMatch(/\[theme\]\s+\[keyboard-avoider~=["']?footer["']?\]/);
            expect(slice).toMatch(/nav\[fixed\] > \[container\]\[keyboard-avoider\]/);
            expect(slice).toMatch(/nav\[sticky\] > \[container\]\[keyboard-avoider\]/);
            expect(slice).toMatch(/\[wizard-header\] > \[container\]\[keyboard-avoider\]/);
            expect(slice).toMatch(/nav\[fixed\] > \[container\]\[keyboard-avoider~=["']?padding["']?\]/);
            expect(slice).toMatch(/nav\[sticky\] > \[container\]\[keyboard-avoider~=["']?translate["']?\]/);
            expect(slice).toMatch(/\[wizard-header\] > \[container\]\[keyboard-avoider~=["']?footer["']?\]/);
            expect(slice).toMatch(/\[safe-area\]:not\(\[safe-area=["']?top["']?\]\)[^{]*\[keyboard-avoider\]/);
            expect(slice).toMatch(/\[safe-area=["']?bottom["']?\]\[keyboard-avoider\]/);
            expect(slice).toMatch(/\[safe-area=["']?y["']?\]\[keyboard-avoider\]/);
            expect(slice).toMatch(/\[theme\]\s+\[safe-area=["']?bottom["']?\]\[keyboard-avoider\]/);
            expect(slice).toMatch(/\[theme\]\s+\[safe-area=["']?y["']?\]\[keyboard-avoider~=["']?padding["']?\]/);
            expect(slice).toMatch(/nav\[fixed\] > \[container\]\[safe-area=["']?bottom["']?\]\[keyboard-avoider\]/);
            expect(slice).toMatch(/nav\[sticky\] > \[container\]\[safe-area=["']?y["']?\]\[keyboard-avoider\]/);
            expect(slice).toMatch(/\[wizard-header\] > \[container\]\[safe-area\][^{]*\[keyboard-avoider\]/);

            expect(slice).toContain("--juice-keyboard-inset: 0px");
            expect(slice).toMatch(/:root\s*\{[^}]*--juice-keyboard-inset:\s*0px/);
            expect(slice).toMatch(/:root\s*\{[^}]*--juice-keyboard-duration:\s*var\(--juice-motion-duration-base\)/);
            expect(slice).toMatch(/:root\s*\{[^}]*--juice-keyboard-easing:\s*var\(--juice-motion-ease-enter\)/);
            expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-keyboard-inset:/);
            expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-keyboard-duration:/);
            expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-keyboard-easing:/);
            expect(slice).toContain("@supports (height: env(keyboard-inset-height))");
            expect(slice).toContain("env(keyboard-inset-height, 0px)");
            expect(slice).toContain("padding-bottom: var(--juice-keyboard-inset)");
            expect(slice).toContain("transform: translateY(calc(-1 * var(--juice-keyboard-inset)))");
            expect(slice).toContain("transition: transform var(--juice-keyboard-duration) var(--juice-keyboard-easing)");
            expect(slice).toContain("max(var(--juice-safe-area-pad), env(safe-area-inset-bottom, 0px), var(--juice-keyboard-inset))");
            expect(slice).not.toContain("z-index");
            expect(slice).not.toMatch(/\bmargin\b/);

            const blocks: { selector: string; body: string }[] = [];
            const collect = (source: string) => {
                let cursor = 0;
                while (cursor < source.length) {
                    const open = source.indexOf("{", cursor);
                    if (open < 0) {
                        break;
                    }
                    let depth = 0;
                    let close = open;
                    for (let i = open; i < source.length; i += 1) {
                        if (source[i] === "{") {
                            depth += 1;
                        } else if (source[i] === "}") {
                            depth -= 1;
                            if (depth === 0) {
                                close = i;
                                break;
                            }
                        }
                    }
                    const selector = source.slice(cursor, open).trim();
                    const body = source.slice(open + 1, close);
                    if (selector.startsWith("@")) {
                        collect(body);
                    } else if (selector.length > 0) {
                        blocks.push({ selector, body });
                    }
                    cursor = close + 1;
                }
            };
            collect(slice);

            const positioned = blocks.filter((block) => /position\s*:/.test(block.body));
            expect(positioned.length).toBeGreaterThan(0);
            for (const block of positioned) {
                expect(block.selector).toMatch(/\[keyboard-avoider~=["']?footer["']?\]/);
                expect(block.body).toContain("bottom: var(--juice-keyboard-inset)");
                expect(block.body.match(/position\s*:\s*[^;]+/g)).toEqual(["position: sticky"]);
            }
            for (const block of blocks) {
                if (!/\[keyboard-avoider~=["']?footer["']?\]/.test(block.selector)) {
                    expect(block.body).not.toMatch(/position\s*:/);
                }
                expect(block.body).not.toMatch(/z-index\s*:/);
            }

            const reduced = reducedMotionBlocks(css).find((block) => block.includes("[keyboard-avoider"));
            expect(reduced).toBeDefined();
            expect(reduced).toContain("transition: none");
            expect(reduced).toMatch(/\[keyboard-avoider~=["']?translate["']?\]/);

            for (const id of readBundledThemeIds()) {
                const themeCss = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");
                expect(themeCss).not.toContain("--juice-keyboard-");
            }
        });

        it("resets bottom on a fixed nav in footer mode and still sticks a normal footer", () => {
            const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
            const start = css.indexOf("@property --juice-keyboard-inset");
            const end = css.indexOf("[search-panel]", start);
            expect(start).toBeGreaterThan(-1);
            expect(end).toBeGreaterThan(start);
            const slice = css.slice(start, end);

            const blocks: { selector: string; body: string }[] = [];
            const collect = (source: string) => {
                let cursor = 0;
                while (cursor < source.length) {
                    const open = source.indexOf("{", cursor);
                    if (open < 0) {
                        break;
                    }
                    let depth = 0;
                    let close = open;
                    for (let i = open; i < source.length; i += 1) {
                        if (source[i] === "{") {
                            depth += 1;
                        } else if (source[i] === "}") {
                            depth -= 1;
                            if (depth === 0) {
                                close = i;
                                break;
                            }
                        }
                    }
                    const selector = source.slice(cursor, open).trim();
                    const body = source.slice(open + 1, close);
                    if (selector.startsWith("@")) {
                        collect(body);
                    } else if (selector.length > 0) {
                        blocks.push({ selector, body });
                    }
                    cursor = close + 1;
                }
            };
            collect(slice);

            const footerWord = String.raw`\[keyboard-avoider~=["']?footer["']?\]`;
            const fixedHost = new RegExp(`nav\\[fixed\\]${footerWord}`);
            const themedFixedHost = new RegExp(`\\[theme\\]\\s+nav\\[fixed\\]${footerWord}`);
            const stickyHost = new RegExp(`nav\\[sticky\\]${footerWord}`);
            const fixedContainer = new RegExp(`nav\\[fixed\\] > \\[container\\]${footerWord}`);

            const reset = blocks.filter((block) => fixedHost.test(block.selector));
            expect(reset).toHaveLength(1);
            expect(reset[0]?.selector).toMatch(themedFixedHost);
            expect(reset[0]?.body).toMatch(/bottom:\s*auto/);
            expect(reset[0]?.body).not.toMatch(/position\s*:/);
            expect(reset[0]?.body).not.toMatch(/bottom:\s*var\(--juice-keyboard-inset\)/);
            expect(reset[0]?.selector).not.toMatch(/:not\(nav\[fixed\]\)/);

            const stuck = blocks.filter((block) => (
                new RegExp(footerWord).test(block.selector) &&
                /position\s*:\s*sticky/.test(block.body)
            ));
            expect(stuck.length).toBeGreaterThan(0);
            for (const block of stuck) {
                expect(block.body).toContain("bottom: var(--juice-keyboard-inset)");
                expect(block.body.match(/position\s*:\s*[^;]+/g)).toEqual(["position: sticky"]);
                expect(block.selector).not.toMatch(/:not\(nav\[fixed\]\)/);
                expect(block.selector).not.toMatch(fixedHost);
            }
            expect(stuck.some((block) => fixedContainer.test(block.selector))).toBe(true);
            expect(stuck.some((block) => new RegExp(`(^|,)\\s*${footerWord}`).test(block.selector))).toBe(true);
            expect(slice).not.toMatch(stickyHost);
        });
    });

    it("includes pressable structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const reduced = reducedMotionBlocks(css);
        const hoverBlocks: string[] = [];
        const hoverNeedle = "@media (hover: hover)";
        let hoverFrom = 0;

        while (hoverFrom < css.length) {
            const hoverAt = css.indexOf(hoverNeedle, hoverFrom);
            if (hoverAt < 0) {
                break;
            }

            const hoverOpen = css.indexOf("{", hoverAt);
            let hoverDepth = 0;
            let hoverEnd = hoverOpen;

            for (let i = hoverOpen; i < css.length; i += 1) {
                if (css[i] === "{") {
                    hoverDepth += 1;
                } else if (css[i] === "}") {
                    hoverDepth -= 1;
                    if (hoverDepth === 0) {
                        hoverEnd = i;
                        break;
                    }
                }
            }

            hoverBlocks.push(css.slice(hoverAt, hoverEnd + 1));
            hoverFrom = hoverEnd + 1;
        }

        const hoverBlock = hoverBlocks.find((block) => block.includes("[pressable]"));
        if (!hoverBlock) {
            throw new Error("missing pressable hover block");
        }

        const ruleAt = (selector: string) => {
            const at = css.indexOf(selector);
            expect(at).toBeGreaterThan(-1);
            const open = css.indexOf("{", at);
            const close = css.indexOf("}", open);
            return css.slice(at, close + 1);
        };

        expect(css).toContain("[pressable]");
        expect(css).toMatch(/\[pressable=["']?scale["']?\]/);
        expect(css).toMatch(/\[pressable\]:is\(:active,\s*\[pressed\]\)/);
        expect(css).toContain("[pressable]:focus-visible");
        expect(css).toMatch(/\[pressable\]:is\(:disabled,\s*\[disabled\],\s*\[aria-disabled=["']?true["']?\]\)/);
        expect(css).toMatch(/\[theme\]\s+\[pressable\]/);
        expect(css).toMatch(/\[theme\]\s+\[pressable=scale\]/);
        expect(css).toMatch(/\[theme\]\s+\[pressable\]:focus-visible/);
        expect(css).not.toMatch(/\[pressable\][^{]*::before/);
        expect(css).not.toMatch(/\[pressable\][^{]*::after/);
        expect(hoverBlock).toContain("[pressable]:hover");
        expect(hoverBlock).toContain("box-shadow: inset 0 0 0 1px var(--juice-pressable-hover-ring)");
        expect(hoverBlock).not.toContain(":active");
        expect(hoverBlock).not.toContain("[pressed]");
        expect(hoverBlock).not.toContain("::before");
        expect(css).toContain("box-shadow: inset 0 0 0 2px var(--juice-pressable-pressed-ring)");
        expect(css).toContain("cursor: pointer");
        expect(css).toContain("touch-action: manipulation");
        expect(css).toContain("-webkit-tap-highlight-color: transparent");
        expect(css).toContain("user-select: none");
        expect(css).toContain("outline: 2px solid var(--juice-pressable-focus-ring)");
        expect(css).toContain("outline-offset: 2px");
        expect(css).toContain("transform: scale(var(--juice-pressable-scale))");
        expect(css).toContain("transition: box-shadow var(--juice-pressable-duration) var(--juice-pressable-easing)");
        expect(css).toContain(
            "transition: box-shadow var(--juice-pressable-duration) var(--juice-pressable-easing), transform var(--juice-pressable-duration) var(--juice-pressable-easing)"
        );
        expect(css).toContain("--juice-pressable-hover-ring:");
        expect(css).toContain("--juice-pressable-pressed-ring:");
        expect(css).toContain("--juice-pressable-focus-ring:");
        expect(css).not.toContain("--juice-pressable-hover-bg");
        expect(css).not.toContain("--juice-pressable-pressed-bg");
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-pressable-hover-ring:\s*currentColor/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-pressable-pressed-ring:\s*currentColor/);
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-pressable-focus-ring:\s*currentColor/);
        expect(css).toContain("--juice-pressable-radius: 0.375rem");
        expect(css).toContain("--juice-pressable-duration: var(--juice-motion-duration-fast)");
        expect(css).toContain("--juice-pressable-easing: var(--juice-motion-ease-standard)");
        expect(css).toContain("--juice-pressable-scale: 0.98");
        expect(css).toMatch(/:root\s*\{[^}]*--juice-pressable-radius:\s*0\.375rem/);
        expect(css).toMatch(/:root\s*\{[^}]*--juice-pressable-duration:\s*var\(--juice-motion-duration-fast\)/);
        expect(css).toMatch(/:root\s*\{[^}]*--juice-pressable-easing:\s*var\(--juice-motion-ease-standard\)/);
        expect(css).toMatch(/:root\s*\{[^}]*--juice-pressable-scale:\s*0?\.98/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-pressable-radius:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-pressable-duration:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-pressable-easing:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-pressable-scale:/);
        expect(css).toMatch(/\[pressable\]:is\(:disabled,\s*\[disabled\],\s*\[aria-disabled=true\]\)[^{]*\{[^}]*cursor:\s*default/);
        const pressableEnabled = String.raw`:where\(:not\(:disabled\):not\(\[disabled\]\):not\(\[aria-disabled=true\]\)\)`;
        expect(css).toMatch(
            new RegExp(String.raw`\[pressable\]:hover${pressableEnabled}`)
        );
        expect(css).toMatch(
            new RegExp(String.raw`\[pressable\]:is\(:active,\s*\[pressed\]\)${pressableEnabled}`)
        );
        expect(css).toMatch(
            new RegExp(
                String.raw`\[pressable=scale\]:is\(:active,\s*\[pressed\]\)${pressableEnabled}[^{]*\{[^}]*transform:\s*scale\(var\(--juice-pressable-scale\)\)`
            )
        );

        const focusRule = ruleAt("[pressable]:focus-visible,");
        expect(focusRule).toContain("outline: 2px solid var(--juice-pressable-focus-ring)");
        expect(focusRule).not.toContain("box-shadow");

        const pressableRules = [...css.matchAll(/[^{}]*\[pressable\][^{]*\{[^}]*\}/g)].map((match) => match[0]);
        expect(pressableRules.length).toBeGreaterThan(0);
        for (const block of pressableRules) {
            expect(block).not.toMatch(/position\s*:/);
            expect(block).not.toContain("::before");
            expect(block).not.toContain("::after");
        }

        const spinnerBefore = ruleAt("[spinner]::before,");
        expect(spinnerBefore).toContain("animation: juice-spinner-spin");
        expect(spinnerBefore).toContain("border-top-color:");
        expect(spinnerBefore).not.toContain("pressable");
        expect(spinnerBefore).not.toContain("--juice-pressable");

        const progressBefore = ruleAt("[progress]::before,");
        expect(progressBefore).toContain("background-color: var(--juice-progress-track");
        expect(progressBefore).toContain("border-radius: 999px");
        expect(progressBefore).not.toContain("pressable");
        expect(progressBefore).not.toContain("--juice-pressable");

        const sliderBefore = ruleAt("[slider]:not([slider=vertical])::before,");
        expect(sliderBefore).toContain("background-color: var(--juice-slider-track");
        expect(sliderBefore).toContain("transform: translateY(-50%)");
        expect(sliderBefore).not.toContain("pressable");
        expect(sliderBefore).not.toContain("--juice-pressable");

        const accordionBefore = ruleAt("[accordion-item][aria-expanded=true]::before");
        expect(accordionBefore).toContain("width: 0.28rem");
        expect(accordionBefore).toContain("background:");
        expect(accordionBefore).not.toContain("pressable");
        expect(accordionBefore).not.toContain("--juice-pressable");

        expect(css).toMatch(/\[drawer\]\s*\{[^}]*position:\s*absolute/);
        expect(css).toMatch(/\[toast-region\],\s*\[theme\]\s+\[toast-region\]\s*\{[^}]*position:\s*fixed/);
        expect(css).toMatch(/nav\[fixed\]\s*\{[^}]*position:\s*fixed/);
        expect(css).toMatch(/nav\[sticky\]\s*\{[^}]*position:\s*sticky/);
        expect(reduced.some((block) => block.includes("[pressable]") && block.includes("transition: none"))).toBe(true);
        expect(reduced.every((block) => !/\[pressable\][^{]*::before/.test(block))).toBe(true);
        expect(
            reduced.some((block) => block.includes("[pressable=scale]") && block.includes("transform: none"))
        ).toBe(true);
        expect(css).not.toMatch(/\[pressable\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[pressable\][^{]*\{[^}]*z-index:\s*1000/);
        expect(css).not.toMatch(/\[pressable\](?![=:])[^{]*\{[^}]*transform:\s*scale/);
        expect(css).not.toMatch(/\[pressable\]\[scale/);

        for (const id of readBundledThemeIds()) {
            const themeCss = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");
            expect(themeCss).not.toContain("--juice-pressable-");
            expect(themeCss).not.toContain("[pressable]");
        }
    });

    it("keeps a disabled icon-button pressed ring and paints no pressable ring on a disabled pressable", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const pressableRules = [...css.matchAll(/[^{}]*\[pressable\][^{]*\{[^}]*\}/g)].map((match) => match[0]);
        const shadowResets = pressableRules.filter((block) => /box-shadow:\s*none/.test(block));
        expect(shadowResets).toEqual([]);

        const gate = String.raw`:where\(:not\(:disabled\):not\(\[disabled\]\):not\(\[aria-disabled=true\]\)\)`;
        const pressedRing = pressableRules.find(
            (block) =>
                /\[pressable\]:is\(:active,\s*\[pressed\]\)/.test(block) &&
                block.includes("box-shadow: inset 0 0 0 2px var(--juice-pressable-pressed-ring)")
        );
        const hoverRing = pressableRules.find(
            (block) =>
                /\[pressable\]:hover/.test(block) &&
                block.includes("box-shadow: inset 0 0 0 1px var(--juice-pressable-hover-ring)")
        );
        expect(pressedRing).toBeDefined();
        expect(hoverRing).toBeDefined();
        expect(pressedRing).toMatch(new RegExp(gate));
        expect(hoverRing).toMatch(new RegExp(gate));

        const disabledPressable = pressableRules.filter((block) =>
            /\[pressable\][^{]*:is\(:disabled,\s*\[disabled\],\s*\[aria-disabled=true\]\)/.test(block)
        );
        expect(disabledPressable.length).toBeGreaterThan(0);
        for (const block of disabledPressable) {
            expect(block).not.toMatch(/box-shadow/);
            expect(block).not.toMatch(/transform/);
            expect(block).toMatch(/cursor:\s*default/);
        }

        expect(css).toMatch(
            /\[theme\] button\[icon-button\]\[pressed\][^{]*\{[^}]*box-shadow:\s*inset 0 0 0 2px currentColor/
        );
        expect(css).not.toMatch(
            /\[pressable\][^{]*:is\(:disabled,\s*\[disabled\],\s*\[aria-disabled=true\]\)[^{]*:is\(:hover,\s*:active,\s*\[pressed\]\)[^{]*\{[^}]*box-shadow:\s*none/
        );
    });

    it("includes touchable-row structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const reduced = reducedMotionBlocks(css);

        const ruleAt = (selector: string) => {
            const at = css.indexOf(selector);
            expect(at).toBeGreaterThan(-1);
            const open = css.indexOf("{", at);
            const close = css.indexOf("}", open);
            return css.slice(at, close + 1);
        };

        expect(css).toContain("@property --juice-touchable-row-ink");
        expect(css).toContain('syntax: "<color>"');
        expect(css).toContain("inherits: true");
        expect(css).toContain("initial-value: #000");
        expect(css).toContain(":where(a, button, li, div)[touchable-row]");
        expect(css).toContain("[touchable-row-leading]");
        expect(css).toContain("[touchable-row-content]");
        expect(css).toContain("[touchable-row-title]");
        expect(css).toContain("[touchable-row-subtitle]");
        expect(css).toContain("[touchable-row-trailing]");
        expect(css).toMatch(/\[touchable-row~=["']?dense["']?\]/);
        expect(css).toMatch(/\[touchable-row~=["']?chevron["']?\]/);
        expect(css).toMatch(/\[touchable-row~=["']?undivided["']?\]/);
        expect(css).toMatch(/\[touchable-row-title=["']?clamp["']?\]/);
        expect(css).toMatch(/\[touchable-row-subtitle=["']?clamp["']?\]/);
        expect(css).toMatch(/\[theme\]\s+:where\(a,\s*button,\s*li,\s*div\)\[touchable-row\]/);
        expect(css).toMatch(/:where\(a,\s*button,\s*li,\s*div\)\[touchable-row\]:focus-visible/);
        expect(css).toMatch(
            /\[touchable-row\]:is\(:disabled,\s*\[disabled\],\s*\[aria-disabled=["']?true["']?\]\)/
        );
        expect(css).toMatch(/\[touchable-row\]:is\(\[selected\],\s*\[aria-selected=["']?true["']?\]/);
        expect(css).toMatch(/\[aria-current\]:not\(\[aria-current=["']?false["']?\]\)/);
        expect(css).toMatch(/\[touchable-row-leading\] :is\(\[avatar\], \[icon\]\)/);
        expect(css).toMatch(
            /\[touchable-row-trailing\] :is\(\[avatar\], \[icon\], \[icon-button\], \[switch\], \[badge\]\)/
        );
        expect(css).toContain("--juice-touchable-row-min-height: 44px");
        expect(css).toContain("--juice-touchable-row-padding: 0.75rem 1rem");
        expect(css).toContain("--juice-touchable-row-padding-dense: 0.5rem 0.75rem");
        expect(css).toContain("--juice-touchable-row-gap: 0.75rem");
        expect(css).toContain("--juice-touchable-row-gap-dense: 0.5rem");
        expect(css).toContain("--juice-touchable-row-radius: 0.375rem");
        expect(css).toContain("--juice-touchable-row-selected-width: 3px");
        expect(css).toContain("--juice-touchable-row-line-clamp: 2");
        expect(css).toContain("--juice-touchable-row-ink:");
        expect(css).toContain("--juice-touchable-row-divider:");
        expect(css).toContain("--juice-touchable-row-selected:");
        expect(css).toContain("--juice-touchable-row-chevron:");
        expect(css).toContain("--juice-touchable-row-subtitle:");
        expect(css).toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-ink:\s*currentColor/);
        expect(css).toMatch(
            /:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-divider:\s*color-mix\(in srgb, var\(--juice-touchable-row-ink\) 28%, transparent\)/
        );
        expect(css).toMatch(
            /:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-selected:\s*var\(--juice-touchable-row-ink\)/
        );
        expect(css).toMatch(
            /:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-chevron:\s*var\(--juice-touchable-row-ink\)/
        );
        expect(css).toMatch(
            /:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-subtitle:\s*var\(--juice-touchable-row-ink\)/
        );
        expect(css).toMatch(/:root\s*\{[^}]*--juice-touchable-row-min-height:\s*44px/);
        expect(css).toMatch(/:root\s*\{[^}]*--juice-touchable-row-padding:\s*0\.75rem 1rem/);
        expect(css).toMatch(/:root\s*\{[^}]*--juice-touchable-row-radius:\s*0\.375rem/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-min-height:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-padding:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-padding-dense:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-gap:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-radius:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-selected-width:/);
        expect(css).not.toMatch(/:root,\s*\[theme\]\s*\{[^}]*--juice-touchable-row-line-clamp:/);
        expect(css).not.toContain("--juice-touchable-row-min-height-dense");
        expect(css).not.toContain("--juice-touchable-row-hover");
        expect(css).not.toContain("--juice-touchable-row-pressed");
        expect(css).toContain("min-height: var(--juice-touchable-row-min-height)");
        expect(css).toContain("padding: var(--juice-touchable-row-padding-dense)");
        expect(css).toContain("text-overflow: ellipsis");
        expect(css).toContain("white-space: nowrap");
        expect(css).toContain("-webkit-line-clamp: var(--juice-touchable-row-line-clamp)");
        expect(css).toContain("line-clamp: var(--juice-touchable-row-line-clamp)");
        expect(css).toContain("outline: 2px solid currentColor");
        expect(css).toContain("outline-offset: 2px");
        expect(css).toContain("border-inline-start-color: var(--juice-touchable-row-selected)");
        expect(css).toContain("border-inline-start-width: var(--juice-touchable-row-selected-width)");
        expect(css).toContain("border-block-end: 1px solid var(--juice-touchable-row-divider)");
        expect(css).toContain(':not([touchable-row~=undivided]):has(+ :where(a, button, li, div)[touchable-row]:not([touchable-row~=undivided]))');
        expect(css).toMatch(/\[touchable-row~=chevron\]::after/);
        expect(css).toContain("border-width: 0 2px 2px 0");
        expect(css).toContain("transform: rotate(-45deg)");
        expect(css).toMatch(/:dir\(rtl\) :where\(a, button, li, div\)\[touchable-row~=chevron\]::after/);
        expect(css).toContain("border-width: 0 0 2px 2px");
        expect(css).toContain("transform: rotate(45deg)");
        expect(css).not.toMatch(/\[touchable-row[^\]]*\][^{]*::before/);
        expect(css).not.toMatch(/\[touchable-row~=chevron\]::before/);
        expect(css).toContain("width: 100%");
        expect(css).toContain("opacity: 0.5");
        expect(css).toMatch(
            /\[touchable-row\]:is\(:disabled,\s*\[disabled\],\s*\[aria-disabled=true\]\)[^{]*\{[^}]*cursor:\s*default/
        );
        expect(css).not.toMatch(/\[touchable-row\][^{]*\{[^}]*pointer-events:\s*none/);
        expect(css).not.toMatch(/\[touchable-row\][^{]*\{[^}]*z-index:/);
        expect(css).not.toMatch(/\[touchable-row\][^{]*\{[^}]*position:\s*(?:fixed|absolute|sticky)/);
        expect(css).not.toMatch(/\[touchable-row\][^{]*\{[^}]*margin(?:-inline|-left|-right)?:\s*-/);
        expect(css).not.toMatch(/\[touchable-row\][^{]*env\(safe-area-inset/);
        expect(css).not.toContain("--juice-touchable-row-hover-bg");
        expect(css).not.toContain("--juice-touchable-row-pressed-bg");

        const denseRule = ruleAt('[touchable-row~=dense],\n[theme] :where(a, button, li, div)[touchable-row~=dense]');
        expect(denseRule).toContain("padding: var(--juice-touchable-row-padding-dense)");
        expect(denseRule).not.toContain("min-height");

        const focusRule = ruleAt(":where(a, button, li, div)[touchable-row]:focus-visible,");
        expect(focusRule).toContain("outline: 2px solid currentColor");
        expect(focusRule).toContain("outline-offset: 2px");
        expect(focusRule).not.toContain("box-shadow");
        expect(focusRule).not.toContain("background");

        const selectedRule = ruleAt(
            ':where(a, button, li, div)[touchable-row]:is([selected], [aria-selected=true], [aria-current]:not([aria-current=false]))'
        );
        expect(selectedRule).toContain("border-inline-start-color: var(--juice-touchable-row-selected)");
        expect(selectedRule).not.toContain("background");

        const chevronRule = ruleAt(":where(a, button, li, div)[touchable-row~=chevron]::after,");
        expect(chevronRule).toContain("content: \"\"");
        expect(chevronRule).toContain("border-width: 0 2px 2px 0");
        expect(chevronRule).not.toContain("::before");

        const radiusRule = ruleAt(":where(a, button, li, div)[touchable-row]:not([pressable]),");
        expect(radiusRule).toContain("border-radius: var(--juice-touchable-row-radius)");

        const sortAfter = ruleAt("th[sortable] > button::after,");
        expect(sortAfter).toContain("border-block-start:");
        expect(sortAfter).toContain("border-block-end:");
        expect(sortAfter).not.toContain("touchable-row");

        const switchAfter = ruleAt("[switch]::after,");
        expect(switchAfter).toContain("border-radius: 999px");
        expect(switchAfter).not.toContain("touchable-row");

        const avatarAfter = ruleAt('[avatar][status=online]::after,');
        expect(avatarAfter).toContain("border-radius: 999px");
        expect(avatarAfter).not.toContain("touchable-row");

        const pressableHover = css.indexOf("[pressable]:hover");
        const rowRule = css.indexOf(":where(a, button, li, div)[touchable-row]");
        const safeAreaX = css.indexOf("[safe-area=x]");
        expect(pressableHover).toBeGreaterThan(-1);
        expect(rowRule).toBeGreaterThan(pressableHover);
        expect(safeAreaX).toBeGreaterThan(rowRule);

        expect(
            reduced.some(
                (block) => block.includes("[touchable-row]") && block.includes("transition: none")
            )
        ).toBe(true);
        expect(reduced.every((block) => !/\[touchable-row[^\]]*\][^{]*::before/.test(block))).toBe(true);
        expect(css).not.toMatch(/tr\[touchable-row\]/);
        expect(css).not.toMatch(/\[menuitem\]\[touchable-row\]/);
        expect(css).not.toContain("[touchable-row-meta]");
        expect(css).not.toContain("[touchable-row-chevron]");

        for (const id of readBundledThemeIds()) {
            const themeCss = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");
            expect(themeCss).not.toContain("--juice-touchable-row-");
            expect(themeCss).not.toContain("[touchable-row]");
        }
    });

    it("lets a direct touchable-row title ellipsize and clamp", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const rules = cssDeclarations(css);
        const directTitle = ":where(a, button, li, div)[touchable-row] > [touchable-row-title]";
        const themedDirectTitle = `[theme] ${directTitle}`;
        const content = ":where(a, button, li, div)[touchable-row] > [touchable-row-content]";

        // The direct-child selector is more specific than both truncation
        // modes. A display declaration on it would keep the title a flex
        // container, which cannot ellipsize, and would beat ="clamp".
        expect(selectorSpecificity(directTitle)).toEqual([0, 2, 0]);
        expect(selectorSpecificity("[touchable-row-title]")).toEqual([0, 1, 0]);
        expect(selectorSpecificity("[touchable-row-title=clamp]")).toEqual([0, 1, 0]);
        expect(selectorSpecificity(themedDirectTitle)).toEqual([0, 3, 0]);
        expect(selectorSpecificity("[theme] [touchable-row-title]")).toEqual([0, 2, 0]);
        expect(selectorSpecificity("[theme] [touchable-row-title=clamp]")).toEqual([0, 2, 0]);

        const directRule = rules.find((rule) =>
            splitSelectors(rule.selector).some((part) => flatSelector(part) === flatSelector(directTitle))
        );
        expect(directRule, "direct title rule").toBeDefined();
        expect(declaredProperty(directRule!.body, "display")).toBeNull();
        expect(directRule!.body).toContain("flex: 1 1 auto");
        expect(directRule!.body).toContain("align-self: stretch");
        expect(directRule!.body).toContain("min-width: 0");
        expect(directRule!.body).not.toContain("flex-direction");
        expect(directRule!.body).not.toContain("justify-content");
        expect(
            splitSelectors(directRule!.selector).some((part) => flatSelector(part) === flatSelector(themedDirectTitle))
        ).toBe(true);

        const contentRule = rules.find((rule) =>
            splitSelectors(rule.selector).some((part) => flatSelector(part) === flatSelector(content))
        );
        expect(contentRule, "content wrapper rule").toBeDefined();
        expect(declaredProperty(contentRule!.body, "display")).toBe("flex");
        expect(contentRule!.body).toContain("flex-direction: column");
        expect(contentRule!.body).toContain("justify-content: center");
        expect(
            splitSelectors(contentRule!.selector).some((part) => part.includes("[touchable-row-title]"))
        ).toBe(false);

        for (const rule of rules) {
            for (const part of splitSelectors(rule.selector)) {
                const selector = part.replace(/\s+/g, " ").trim();
                if (!/>\s*\[touchable-row-title(?:\]|=)/.test(selector)) continue;
                expect(declaredProperty(rule.body, "display"), selector).toBeNull();
            }
        }

        const titleRule = rules.find((rule) =>
            splitSelectors(rule.selector).some((part) => flatSelector(part) === "[touchable-row-title]")
        );
        expect(titleRule, "title ellipsis rule").toBeDefined();
        expect(declaredProperty(titleRule!.body, "display")).toBe("block");
        expect(declaredProperty(titleRule!.body, "overflow")).toBe("hidden");
        expect(declaredProperty(titleRule!.body, "text-overflow")).toBe("ellipsis");
        expect(declaredProperty(titleRule!.body, "white-space")).toBe("nowrap");

        const clampRule = rules.find((rule) =>
            splitSelectors(rule.selector).some((part) => {
                const flat = flatSelector(part);
                return (
                    flat === "[touchable-row-title=clamp]" ||
                    flat === '[touchable-row-title="clamp"]' ||
                    flat === "[touchable-row-title='clamp']"
                );
            })
        );
        expect(clampRule, "title clamp rule").toBeDefined();
        expect(declaredProperty(clampRule!.body, "display")).toBe("-webkit-box");
        expect(declaredProperty(clampRule!.body, "white-space")).toBe("normal");
        expect(declaredProperty(clampRule!.body, "-webkit-box-orient")).toBe("vertical");
        expect(declaredProperty(clampRule!.body, "-webkit-line-clamp")).toBe(
            "var(--juice-touchable-row-line-clamp)"
        );
        expect(declaredProperty(clampRule!.body, "line-clamp")).toBe(
            "var(--juice-touchable-row-line-clamp)"
        );

        expect(css).toContain(
            "> :is([touchable-row-content], [touchable-row-trailing], [touchable-row-title])"
        );
        const hairline = rules.find((rule) => rule.selector.includes("> :is([touchable-row-content], [touchable-row-trailing], [touchable-row-title])"));
        expect(hairline?.body).toContain("border-block-end: 1px solid var(--juice-touchable-row-divider)");
        expect(declaredProperty(hairline?.body ?? "", "display")).toBeNull();
    });

    it("includes select structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("select[select]");
        expect(css).toContain("[select-label]");
        expect(css).toMatch(/\[theme\]\s+select\[select\]/);
        expect(css).toContain("--juice-select-surface");
        expect(css).toContain("--juice-select-border");
        expect(css).toContain("--juice-select-ink");
        expect(css).toContain("--juice-select-chevron");
        expect(css).toContain("--juice-select-focus-ring");
        expect(css).toContain("appearance: none");
        expect(css).toContain("background-image:");
        expect(css).not.toMatch(/\[select-option\]/);
        expect(css).not.toMatch(/\[select-list\]/);
        expect(css).not.toMatch(/select\[select\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/select\[select\][^{]*\{[^}]*--juice-overlay-frost/);
        expect(css).not.toMatch(/select\[select\][^{]*\{[^}]*--juice-combobox/);
        expect(css).not.toMatch(/\[combobox\][^{]*\{[^}]*--juice-select/);
        expect(css).not.toMatch(/\[combobox-list\][^{]*--juice-select/);
    });

    it("includes input structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("input[input]");
        expect(css).toContain("[input-label]");
        expect(css).toMatch(/\[theme\]\s+input\[input\]/);
        expect(css).toContain("--juice-input-surface");
        expect(css).toContain("--juice-input-border");
        expect(css).toContain("--juice-input-ink");
        expect(css).toContain("--juice-input-placeholder");
        expect(css).toContain("--juice-input-focus-ring");
        expect(css).toMatch(/\[type=["']?text["']?\s+i\]/);
        expect(css).toMatch(/\[type=["']?email["']?\s+i\]/);
        expect(css).toMatch(/\[type=["']?password["']?\s+i\]/);
        expect(css).toMatch(/\[type=["']?search["']?\s+i\]/);
        expect(css).toMatch(/\[type=["']?tel["']?\s+i\]/);
        expect(css).toMatch(/\[type=["']?url["']?\s+i\]/);
        expect(css).toMatch(/\[type=["']?number["']?\s+i\]/);
        expect(css).toContain(":not([type])");
        expect(css).toContain(":not([combobox-input])");
        expect(css).not.toMatch(/\[type=["']checkbox["']/);
        expect(css).not.toMatch(/\[type=["']radio["']/);
        expect(css).not.toMatch(/\[type=["']range["']/);
        expect(css).not.toMatch(/\[type=["']file["']/);
        expect(css).not.toMatch(/\[type=["']date["']/);
        expect(css).not.toMatch(/\[type=["']time["']/);
        expect(css).not.toMatch(/\[type=["']datetime-local["']/);
        expect(css).not.toMatch(/\[type=["']month["']/);
        expect(css).not.toMatch(/\[type=["']week["']/);
        expect(css).not.toMatch(/\[type=["']color["']/);
        expect(css).not.toMatch(/\[type=["']hidden["']/);
        expect(css).not.toMatch(/\[type=["']button["']/);
        expect(css).not.toMatch(/\[type=["']submit["']/);
        expect(css).not.toMatch(/\[type=["']reset["']/);
        expect(css).not.toMatch(/\[type=["']image["']/);
        const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
            selector: match[1] ?? "",
            body: match[2] ?? "",
        }));

        for (const rule of rules) {
            if (/input\[input\]/.test(rule.selector)) {
                expect(rule.body).not.toMatch(/z-index:\s*10/);
                expect(rule.body).not.toContain("--juice-overlay-frost");
                expect(rule.body).not.toContain("--juice-combobox-");
                expect(rule.body).not.toContain("--juice-select-");
            }

            if (/\[combobox/.test(rule.selector) && !/input\[input\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-input-");
            }

            if (/select\[select\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-input-");
            }

            if (/\[field\]\[invalid\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-input-");
            }
        }
    });

    it("includes textarea structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("textarea[textarea]");
        expect(css).toContain("[textarea-label]");
        expect(css).toMatch(/\[theme\]\s+textarea\[textarea\]/);
        expect(css).toContain("--juice-textarea-surface");
        expect(css).toContain("--juice-textarea-border");
        expect(css).toContain("--juice-textarea-ink");
        expect(css).toContain("--juice-textarea-placeholder");
        expect(css).toContain("--juice-textarea-focus-ring");
        expect(css).toContain("--aqua-textarea-surface");
        expect(css).toContain("--kw-textarea-surface");
        expect(css).toContain("--cm-textarea-surface");
        expect(css).toContain("--tide-textarea-surface");
        expect(css).toContain("--jx-textarea-surface");
        expect(css).toMatch(/textarea\[textarea\]:focus-visible/);
        expect(css).toContain("resize: vertical");
        expect(css).not.toMatch(/textarea\[textarea\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/textarea\[textarea\][^{]*\{[^}]*field-sizing/);
        expect(css).not.toMatch(/textarea\[textarea\][^{]*\{[^}]*--juice-overlay-frost/);

        const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
            selector: match[1] ?? "",
            body: match[2] ?? "",
        }));

        for (const rule of rules) {
            if (/textarea\[textarea\]/.test(rule.selector)) {
                expect(rule.body).not.toMatch(/z-index:\s*10/);
                expect(rule.body).not.toContain("--juice-overlay-frost");
                expect(rule.body).not.toContain("--juice-input-");
                expect(rule.body).not.toContain("--juice-combobox-");
                expect(rule.body).not.toContain("--juice-select-");
            }

            if (/\btextarea\b/.test(rule.selector) && !/textarea\[textarea\]/.test(rule.selector) && !/\[textarea-label\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-textarea-");
            }

            if (/input\[input\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-textarea-");
            }

            if (/select\[select\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-textarea-");
            }

            if (/\[combobox/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-textarea-");
            }

            if (/\[field\]\[invalid\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-textarea-");
            }
        }
    });

    it("includes field structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[field-label]");
        expect(css).toContain("[field-help]");
        expect(css).toContain("[field-error]");
        expect(css).toContain("[field][invalid]");
        expect(css).toMatch(/\[theme\]\s+\[field\]/);
        expect(css).toContain(":has([field-label]");
        expect(css).toContain("--juice-field-surface");
        expect(css).toContain("--juice-field-gap");
        expect(css).toContain("--juice-field-label-ink");
        expect(css).toContain("--juice-field-help-ink");
        expect(css).toContain("--juice-field-error-ink");
        expect(css).toContain("--juice-field-invalid-border");
        expect(css).toContain("--aqua-field-surface");
        expect(css).toContain("--kw-field-surface");
        expect(css).toContain("--cm-field-surface");
        expect(css).toContain("--tide-field-surface");
        expect(css).toContain("--jx-field-surface");
        expect(css).not.toMatch(/\[field\][^{]*\{[^}]*z-index:\s*10/);
        expect(css).not.toMatch(/\[field\][^{]*\{[^}]*--juice-overlay-frost/);

        const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
            selector: match[1] ?? "",
            body: match[2] ?? "",
        }));

        for (const rule of rules) {
            const fieldHost = /\[field\](?!-)/.test(rule.selector);
            const fieldPart = /\[field-(?:label|help|error)\]/.test(rule.selector);

            if (fieldHost || fieldPart) {
                expect(rule.body).not.toMatch(/z-index:\s*10/);
                expect(rule.body).not.toContain("--juice-overlay-frost");
                expect(rule.body).not.toContain("--juice-input-");
                expect(rule.body).not.toContain("--juice-textarea-");
                expect(rule.body).not.toContain("--juice-select-");
                expect(rule.body).not.toContain("--juice-combobox-");
            }

            if (/input\[input\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-field-");
            }

            if (/textarea\[textarea\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-field-");
            }

            if (/select\[select\]/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-field-");
            }

            if (/\[combobox/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-field-");
            }

            if (/\[field\]\[invalid\]/.test(rule.selector) && /\b(input|textarea|select)\b/.test(rule.selector)) {
                expect(rule.body).not.toContain("--juice-field-");
            }
        }

        const formScss = readFileSync(join(PACKAGE_ROOT, "src/components/form/form.scss"), "utf-8");
        expect(formScss).toContain("$red-500");
        expect(formScss).toContain("$red-700");
        expect(formScss).toContain('form[type="signin"]');
        expect(formScss).toContain("height: 6vh");
        expect(formScss).not.toContain("--juice-field-");

        for (const file of [
            "input/input.scss",
            "textarea/textarea.scss",
            "select/select.scss",
            "combobox/combobox.scss",
        ]) {
            const source = readFileSync(join(PACKAGE_ROOT, "src/components", file), "utf-8");
            expect(source, file).not.toContain("--juice-field-");
        }
    });

    it("includes wizard structural chrome in core CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");

        expect(css).toContain("[wizard-shell]");
        expect(css).toContain("[wizard-header]");
        expect(css).toContain("[wizard-body]");
        expect(css).toContain("[wizard-rail=");
        expect(css).toContain("[wizard-content]");
        expect(css).toContain("[step-tracker]");
        expect(css).toContain("[step-indicator]");
        expect(css).toContain("[order-summary]");
        expect(css).toContain("[step-page]");
        expect(css).toContain("[step-nav]");
        expect(css).toMatch(/\[theme\]\s+\[wizard-shell\]/);
        expect(css).toMatch(/\[theme\]\s+\[wizard-header\]/);
        expect(css).toMatch(/\[theme\]\s+\[wizard-rail=["']?left["']?\]/);
        expect(css).toMatch(/\[step=["']?pending["']?\]/);
        expect(css).toMatch(/\[step=["']?active["']?\]/);
        expect(css).toMatch(/\[step=["']?completed["']?\]/);
        expect(css).toMatch(/\[step-indicator\]:focus-visible/);
        expect(css).toContain("--juice-wizard-shell");
        expect(css).toContain("--juice-wizard-header");
        expect(css).toContain("--juice-wizard-header-border");
        expect(css).toContain("--juice-wizard-rail");
        expect(css).toContain("--juice-wizard-rail-border");
        expect(css).toContain("--juice-wizard-step");
        expect(css).toContain("--juice-wizard-step-border");
        expect(css).toContain("--juice-wizard-step-ink");
        expect(css).toContain("--juice-wizard-step-current");
        expect(css).toContain("--juice-wizard-step-complete");
        expect(css).toContain("--juice-wizard-step-on");
        expect(css).toContain("--juice-wizard-step-connector");
        expect(css).toContain("--juice-wizard-panel");
        expect(css).toContain("--juice-wizard-panel-border");
        expect(css).toContain("--juice-wizard-focus-ring");
        expect(css).not.toMatch(/\[wizard-shell\][^{]*\{[^}]*--aqua-page/);
        expect(css).not.toMatch(/\[wizard-shell\][^{]*\{[^}]*--kw-page/);
        expect(css).not.toMatch(/\[step-indicator\][^{]*\{[^}]*--aqua-button-background/);
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

    it("binds shadowTone roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--juice-shadow-tone-cool-color: var(--aqua-shadow)");
        expect(aquaCss).toContain("--juice-shadow-tone-warm-color: color-mix(in srgb, var(--aqua-accent-strong) 16%, transparent)");
        expect(kiwiCss).toContain("--juice-shadow-tone-cool-color: color-mix(in srgb, var(--kw-tier-content) 18%, transparent)");
        expect(kiwiCss).toContain("--juice-shadow-tone-warm-color: color-mix(in srgb, var(--kw-warm) 18%, transparent)");
        expect(mintCss).toContain("--juice-shadow-tone-cool-shadow:");
        expect(mintCss).toContain("--juice-shadow-tone-warm-shadow:");
        expect(tideCss).toContain("--juice-shadow-tone-cool-color: color-mix(in srgb, var(--tide-accent) 45%, var(--tide-shadow))");
        expect(tideCss).toContain("--juice-shadow-tone-cool-shadow: var(--tide-line-glow)");
        expect(tideCss).toContain("--juice-shadow-tone-warm-color: var(--tide-shadow)");
        expect(tideCss).not.toContain("--juice-shadow-tone-warm-color: rgba(");
    });

    it("binds overlay roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--juice-overlay-frost-wash: color-mix(in srgb, var(--aqua-page) 42%, transparent)");
        expect(aquaCss).toContain("--juice-overlay-tint-wash: color-mix(in srgb, var(--aqua-page-tint) 38%, transparent)");
        expect(kiwiCss).toContain("--juice-overlay-frost-wash: color-mix(in srgb, var(--kw-surface) 42%, transparent)");
        expect(kiwiCss).toContain("--juice-overlay-tint-wash: color-mix(in srgb, var(--kw-accent-tint) 40%, transparent)");
        expect(mintCss).toContain("--juice-overlay-frost-layer:");
        expect(mintCss).toContain("--juice-overlay-tint-layer:");
        expect(tideCss).toContain("--juice-overlay-frost-wash: color-mix(in srgb, var(--tide-page) 48%, transparent)");
        expect(tideCss).toContain("--juice-overlay-tint-wash: color-mix(in srgb, var(--tide-page-tint) 32%, transparent)");
        expect(tideCss).not.toContain("--juice-overlay-frost-wash: rgba(");
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

    it("binds modal chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-modal-overlay: color-mix(in srgb, var(--aqua-page-deep) 62%, transparent)");
        expect(aquaCss).toContain("--juice-modal-panel: var(--aqua-modal-panel)");
        expect(aquaCss).toContain("button[modal-close]");
        expect(aquaCss).not.toMatch(/button\[modal-close\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-modal-overlay: color-mix(in srgb, var(--kw-surface-deep) 75%, transparent)");
        expect(kiwiCss).toContain("--juice-modal-close: var(--kw-modal-close)");
        expect(kiwiCss).toContain("button[modal-close]");
        expect(kiwiCss).not.toMatch(/button\[modal-close\][^{]*\{[^}]*--kw-cta-background/);

        expect(mintCss).toContain("--cm-modal-panel: var(--cm-surface)");
        expect(mintCss).toContain("--juice-modal-overlay: var(--cm-modal-overlay)");
        expect(mintCss).toContain("button[modal-close]");

        expect(tideCss).toContain("--tide-modal-panel: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-modal-overlay: var(--tide-modal-overlay)");
        expect(tideCss).toContain("button[modal-close]");
        expect(tideCss).not.toMatch(/button\[modal-close\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-modal-panel: var(--tide-page)");
    });

    it("binds drawer chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-drawer-overlay: color-mix(in srgb, var(--aqua-page-deep) 62%, transparent)");
        expect(aquaCss).toContain("--juice-drawer-panel: var(--aqua-drawer-panel)");
        expect(aquaCss).toContain("button[drawer-close]");
        expect(aquaCss).not.toMatch(/button\[drawer-close\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-drawer-overlay: color-mix(in srgb, var(--kw-surface-deep) 75%, transparent)");
        expect(kiwiCss).toContain("--juice-drawer-close: var(--kw-drawer-close)");
        expect(kiwiCss).toContain("button[drawer-close]");
        expect(kiwiCss).not.toMatch(/button\[drawer-close\][^{]*\{[^}]*--kw-cta-background/);

        expect(mintCss).toContain("--cm-drawer-panel: var(--cm-surface)");
        expect(mintCss).toContain("--juice-drawer-overlay: var(--cm-drawer-overlay)");
        expect(mintCss).toContain("button[drawer-close]");

        expect(tideCss).toContain("--tide-drawer-panel: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-drawer-overlay: var(--tide-drawer-overlay)");
        expect(tideCss).toContain("button[drawer-close]");
        expect(tideCss).not.toMatch(/button\[drawer-close\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-drawer-panel: var(--tide-page)");
    });

    it("binds toast chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-toast-panel: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--aqua-toast-success: var(--aqua-accent)");
        expect(aquaCss).toContain("--juice-toast-ink: var(--aqua-toast-ink)");
        expect(aquaCss).toContain("button[toast-close]");
        expect(aquaCss).not.toMatch(/button\[toast-close\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-toast-success: var(--kw-accent)");
        expect(kiwiCss).toContain("--kw-toast-warning: var(--kw-warm)");
        expect(kiwiCss).toContain("--juice-toast-close: var(--kw-toast-close)");
        expect(kiwiCss).toContain("button[toast-close]");
        expect(kiwiCss).not.toMatch(/button\[toast-close\][^{]*\{[^}]*--kw-cta-background/);

        expect(mintCss).toContain("--cm-toast-panel: var(--cm-surface)");
        expect(mintCss).toContain("--juice-toast-ink: var(--cm-toast-ink)");
        expect(mintCss).toContain("button[toast-close]");

        expect(tideCss).toContain("--tide-toast-panel: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-toast-ink: var(--tide-toast-ink)");
        expect(tideCss).toContain("button[toast-close]");
        expect(tideCss).not.toMatch(/button\[toast-close\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-toast-panel: var(--tide-page)");
    });

    it("binds banner chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-banner-panel: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--aqua-banner-success: var(--aqua-accent)");
        expect(aquaCss).toContain("--juice-banner-ink: var(--aqua-banner-ink)");
        expect(aquaCss).toContain("button[banner-close]");
        expect(aquaCss).toContain("border-left: 4px solid var(--juice-banner-success)");
        expect(aquaCss).toContain("[banner]:not([surfaceTone]):not([banner-tone])");
        expect(aquaCss).not.toMatch(/button\[banner-close\][^{]*\{[^}]*--aqua-button-background/);
        expect(aquaCss).not.toContain("--aqua-banner-panel-shadow");

        expect(kiwiCss).toContain("--kw-banner-success: var(--kw-accent)");
        expect(kiwiCss).toContain("--kw-banner-warning: var(--kw-warm)");
        expect(kiwiCss).toContain("--juice-banner-close: var(--kw-banner-close)");
        expect(kiwiCss).toContain("button[banner-close]");
        expect(kiwiCss).toContain("border-left: 4px solid var(--juice-banner-warning)");
        expect(kiwiCss).not.toMatch(/button\[banner-close\][^{]*\{[^}]*--kw-cta-background/);

        expect(mintCss).toContain("--cm-banner-panel: var(--cm-surface)");
        expect(mintCss).toContain("--juice-banner-ink: var(--cm-banner-ink)");
        expect(mintCss).toContain("button[banner-close]");
        expect(mintCss).toContain("border-left: 4px solid var(--juice-banner-info)");

        expect(tideCss).toContain("--tide-banner-panel: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-banner-ink: var(--tide-banner-ink)");
        expect(tideCss).toContain("button[banner-close]");
        expect(tideCss).toContain("border-left: 4px solid var(--juice-banner-error)");
        expect(tideCss).toContain("[banner]:not([surfaceTone]):not([banner-tone])");
        expect(tideCss).not.toMatch(/button\[banner-close\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-banner-panel: var(--tide-page)");
    });

    it("binds popover chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-popover-panel: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--juice-popover-ink: var(--aqua-popover-ink)");
        expect(aquaCss).toContain("button[popover-close]");
        expect(aquaCss).not.toMatch(/button\[popover-close\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-popover-panel: var(--kw-surface)");
        expect(kiwiCss).toContain("--juice-popover-close: var(--kw-popover-close)");
        expect(kiwiCss).toContain("button[popover-close]");
        expect(kiwiCss).not.toMatch(/button\[popover-close\][^{]*\{[^}]*--kw-cta-background/);

        expect(mintCss).toContain("--cm-popover-panel: var(--cm-surface)");
        expect(mintCss).toContain("--juice-popover-ink: var(--cm-popover-ink)");
        expect(mintCss).toContain("button[popover-close]");

        expect(tideCss).toContain("--tide-popover-panel: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-popover-ink: var(--tide-popover-ink)");
        expect(tideCss).toContain("button[popover-close]");
        expect(tideCss).not.toMatch(/button\[popover-close\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-popover-panel: var(--tide-page)");
    });

    it("binds tooltip chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-tooltip-panel: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--juice-tooltip-ink: var(--aqua-tooltip-ink)");
        expect(aquaCss).toContain("[tooltip-panel]:not([surfaceTone])");

        expect(kiwiCss).toContain("--kw-tooltip-panel: var(--kw-surface)");
        expect(kiwiCss).toContain("--juice-tooltip-panel: var(--kw-tooltip-panel)");
        expect(kiwiCss).toContain("[tooltip-panel]:not([surfaceTone])");

        expect(mintCss).toContain("--cm-tooltip-panel: var(--cm-surface)");
        expect(mintCss).toContain("--juice-tooltip-ink: var(--cm-tooltip-ink)");
        expect(mintCss).toContain("[tooltip-panel]:not([surfaceTone])");

        expect(tideCss).toContain("--tide-tooltip-panel: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-tooltip-ink: var(--tide-tooltip-ink)");
        expect(tideCss).toContain("[tooltip-panel]:not([surfaceTone])");
        expect(tideCss).not.toContain("--tide-tooltip-panel: var(--tide-page)");
    });

    it("binds combobox chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-combobox-input: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--aqua-combobox-list: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--juice-combobox-input-ink: var(--aqua-combobox-input-ink)");
        expect(aquaCss).toContain("button[combobox-trigger]");
        expect(aquaCss).toContain("[combobox-list]:not([surfaceTone])");
        expect(aquaCss).not.toMatch(/button\[combobox-trigger\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-combobox-input: var(--kw-surface)");
        expect(kiwiCss).toContain("--juice-combobox-list: var(--kw-combobox-list)");
        expect(kiwiCss).toContain("button[combobox-trigger]");
        expect(kiwiCss).toContain("[combobox-list]:not([surfaceTone])");
        expect(kiwiCss).not.toMatch(/button\[combobox-trigger\][^{]*\{[^}]*--kw-cta-background/);

        expect(mintCss).toContain("--cm-combobox-input: var(--cm-surface)");
        expect(mintCss).toContain("--juice-combobox-input-ink: var(--cm-combobox-input-ink)");
        expect(mintCss).toContain("button[combobox-trigger]");
        expect(mintCss).toContain("[combobox-list]:not([surfaceTone])");

        expect(tideCss).toContain("--tide-combobox-input: var(--tide-surface-strong)");
        expect(tideCss).toContain("--tide-combobox-list: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-combobox-input-ink: var(--tide-combobox-input-ink)");
        expect(tideCss).toContain("button[combobox-trigger]");
        expect(tideCss).toContain("[combobox-list]:not([surfaceTone])");
        expect(tideCss).not.toMatch(/button\[combobox-trigger\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-combobox-list: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-combobox-input: var(--tide-page)");
    });

    it("binds menu chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-menu-panel: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--juice-menu-ink: var(--aqua-menu-ink)");
        expect(aquaCss).toContain("button[menu-button]");
        expect(aquaCss).toContain("[menu]:not([surfaceTone])");
        expect(aquaCss).not.toMatch(/button\[menu-button\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-menu-panel: var(--kw-surface)");
        expect(kiwiCss).toContain("--juice-menu-panel: var(--kw-menu-panel)");
        expect(kiwiCss).toContain("button[menu-button]");
        expect(kiwiCss).toContain("[menu]:not([surfaceTone])");
        expect(kiwiCss).not.toMatch(/button\[menu-button\][^{]*\{[^}]*--kw-cta-background/);

        expect(mintCss).toContain("--cm-menu-panel: var(--cm-surface)");
        expect(mintCss).toContain("--juice-menu-ink: var(--cm-menu-ink)");
        expect(mintCss).toContain("button[menu-button]");
        expect(mintCss).toContain("[menu]:not([surfaceTone])");

        expect(tideCss).toContain("--tide-menu-panel: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-menu-ink: var(--tide-menu-ink)");
        expect(tideCss).toContain("button[menu-button]");
        expect(tideCss).toContain("[menu]:not([surfaceTone])");
        expect(tideCss).not.toMatch(/button\[menu-button\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-menu-panel: var(--tide-page)");
    });

    it("binds switch chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-switch-track: var(--aqua-surface-muted)");
        expect(aquaCss).toContain("--aqua-switch-track-checked: var(--aqua-accent)");
        expect(aquaCss).toContain("--juice-switch-thumb: var(--aqua-switch-thumb)");
        expect(aquaCss).toContain("button[switch]");
        expect(aquaCss).not.toMatch(/button\[switch\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-switch-track: var(--kw-surface-muted)");
        expect(kiwiCss).toContain("--juice-switch-track: var(--kw-switch-track)");
        expect(kiwiCss).toContain("button[switch]");
        expect(kiwiCss).not.toMatch(/button\[switch\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/button\[switch\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-switch-track: var(--cm-surface-muted)");
        expect(mintCss).toContain("--cm-switch-track-checked: var(--cm-heading)");
        expect(mintCss).toContain("--juice-switch-focus-ring: var(--cm-switch-focus-ring)");
        expect(mintCss).toContain("button[switch]");

        expect(tideCss).toContain("--tide-switch-track: var(--tide-surface-muted)");
        expect(tideCss).toContain("--juice-switch-track-checked: var(--tide-switch-track-checked)");
        expect(tideCss).toContain("button[switch]");
        expect(tideCss).not.toMatch(/button\[switch\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-switch-track: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-switch-thumb: var(--tide-page)");
    });

    it("binds slider chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-slider-track: var(--aqua-surface-muted)");
        expect(aquaCss).toContain("--aqua-slider-fill: var(--aqua-accent)");
        expect(aquaCss).toContain("--juice-slider-thumb: var(--aqua-slider-thumb)");
        expect(aquaCss).toContain("button[slider-thumb]");
        expect(aquaCss).not.toMatch(/button\[slider-thumb\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-slider-track: var(--kw-surface-muted)");
        expect(kiwiCss).toContain("--juice-slider-fill: var(--kw-slider-fill)");
        expect(kiwiCss).toContain("button[slider-thumb]");
        expect(kiwiCss).not.toMatch(/button\[slider-thumb\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/button\[slider-thumb\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-slider-track: var(--cm-surface-muted)");
        expect(mintCss).toContain("--cm-slider-fill: var(--cm-heading)");
        expect(mintCss).toContain("--juice-slider-focus-ring: var(--cm-slider-focus-ring)");
        expect(mintCss).toContain("button[slider-thumb]");

        expect(tideCss).toContain("--tide-slider-track: var(--tide-surface-muted)");
        expect(tideCss).toContain("--juice-slider-fill: var(--tide-slider-fill)");
        expect(tideCss).toContain("button[slider-thumb]");
        expect(tideCss).not.toMatch(/button\[slider-thumb\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-slider-track: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-slider-thumb: var(--tide-page)");
    });

    it("binds checkbox chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-checkbox-control: var(--aqua-page)");
        expect(aquaCss).toContain("--aqua-checkbox-control-checked: var(--aqua-accent)");
        expect(aquaCss).toContain("--juice-checkbox-mark: var(--aqua-checkbox-mark)");
        expect(aquaCss).toContain("button[checkbox]");
        expect(aquaCss).not.toMatch(/button\[checkbox\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-checkbox-control: var(--kw-surface)");
        expect(kiwiCss).toContain("--juice-checkbox-control: var(--kw-checkbox-control)");
        expect(kiwiCss).toContain("button[checkbox]");
        expect(kiwiCss).not.toMatch(/button\[checkbox\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/button\[checkbox\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-checkbox-control: var(--cm-surface)");
        expect(mintCss).toContain("--cm-checkbox-control-checked: var(--cm-heading)");
        expect(mintCss).toContain("--juice-checkbox-focus-ring: var(--cm-checkbox-focus-ring)");
        expect(mintCss).toContain("button[checkbox]");

        expect(tideCss).toContain("--tide-checkbox-control: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-checkbox-control-checked: var(--tide-checkbox-control-checked)");
        expect(tideCss).toContain("button[checkbox]");
        expect(tideCss).not.toMatch(/button\[checkbox\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-checkbox-control: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-checkbox-mark: var(--tide-page)");
        expect(tideCss).not.toContain("--juice-radiogroup-");
    });

    it("binds radio chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-radio-control: var(--aqua-page)");
        expect(aquaCss).toContain("--aqua-radio-mark: var(--aqua-accent)");
        expect(aquaCss).toContain("--juice-radio-border-checked: var(--aqua-radio-border-checked)");
        expect(aquaCss).toContain("button[radio]");
        expect(aquaCss).not.toMatch(/button\[radio\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-radio-control: var(--kw-surface)");
        expect(kiwiCss).toContain("--juice-radio-mark: var(--kw-radio-mark)");
        expect(kiwiCss).toContain("button[radio]");
        expect(kiwiCss).not.toMatch(/button\[radio\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/button\[radio\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-radio-control: var(--cm-surface)");
        expect(mintCss).toContain("--cm-radio-mark: var(--cm-heading)");
        expect(mintCss).toContain("--juice-radio-focus-ring: var(--cm-radio-focus-ring)");
        expect(mintCss).toContain("button[radio]");

        expect(tideCss).toContain("--tide-radio-control: var(--tide-surface-strong)");
        expect(tideCss).toContain("--juice-radio-mark: var(--tide-radio-mark)");
        expect(tideCss).toContain("button[radio]");
        expect(tideCss).not.toMatch(/button\[radio\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-radio-control: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-radio-mark: var(--tide-page)");
    });

    it("binds breadcrumb chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-breadcrumb-ink: var(--aqua-text-muted)");
        expect(aquaCss).toContain("--aqua-breadcrumb-ink-current: var(--aqua-heading)");
        expect(aquaCss).toContain("--aqua-breadcrumb-ink-hover: var(--aqua-accent)");
        expect(aquaCss).toContain("--aqua-breadcrumb-surface: transparent");
        expect(aquaCss).toContain("--juice-breadcrumb-focus-ring: var(--aqua-breadcrumb-focus-ring)");
        expect(aquaCss).toContain("[breadcrumb]");
        expect(aquaCss).toMatch(/\[aria-current=["']?page["']?\]/);
        expect(aquaCss).not.toMatch(/(^|[,{])\s*\[aria-current=["']?page["']?\]/);
        expect(aquaCss).not.toContain("--aqua-breadcrumb-surface: var(--aqua-page)");
        expect(aquaCss).not.toContain("--aqua-breadcrumb-ink: var(--aqua-accent)");

        expect(kiwiCss).toContain("--kw-breadcrumb-ink: var(--kw-text-muted)");
        expect(kiwiCss).toContain("--juice-breadcrumb-ink-hover: var(--kw-breadcrumb-ink-hover)");
        expect(kiwiCss).toContain("--kw-breadcrumb-surface: transparent");
        expect(kiwiCss).toContain("[breadcrumb-link]");
        expect(kiwiCss).not.toMatch(/\[breadcrumb-link\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/\[breadcrumb-link\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-breadcrumb-ink: var(--cm-text-muted)");
        expect(mintCss).toContain("--cm-breadcrumb-ink-hover: var(--cm-heading)");
        expect(mintCss).toContain("--juice-breadcrumb-focus-ring: var(--cm-breadcrumb-focus-ring)");
        expect(mintCss).toContain("--cm-breadcrumb-surface: transparent");
        expect(mintCss).toContain("[breadcrumb]");

        expect(tideCss).toContain("--tide-breadcrumb-ink: var(--tide-text-muted)");
        expect(tideCss).toContain("--tide-breadcrumb-ink-current: var(--tide-heading)");
        expect(tideCss).toContain("--tide-breadcrumb-surface: transparent");
        expect(tideCss).toContain("--juice-breadcrumb-separator: var(--tide-breadcrumb-separator)");
        expect(tideCss).toContain("[breadcrumb]");
        expect(tideCss).not.toMatch(/\[breadcrumb-link\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-breadcrumb-surface: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-breadcrumb-ink-current: var(--tide-page)");
    });

    it("binds progress chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-progress-track: var(--aqua-surface-muted)");
        expect(aquaCss).toContain("--aqua-progress-fill: var(--aqua-accent)");
        expect(aquaCss).toContain("--aqua-progress-ink: var(--aqua-text)");
        expect(aquaCss).toContain("--juice-progress-focus-ring: var(--aqua-progress-focus-ring)");
        expect(aquaCss).toContain("[progress-fill]");
        expect(aquaCss).not.toContain("--aqua-progress-track: var(--aqua-page)");
        expect(aquaCss).not.toContain("--aqua-progress-ink: var(--aqua-accent)");
        expect(aquaCss).not.toMatch(/\[progress-fill\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-progress-track: var(--kw-surface-muted)");
        expect(kiwiCss).toContain("--juice-progress-fill: var(--kw-progress-fill)");
        expect(kiwiCss).toContain("--kw-progress-ink: var(--kw-text)");
        expect(kiwiCss).toContain("[progress-fill]");
        expect(kiwiCss).not.toMatch(/\[progress-fill\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/\[progress-fill\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-progress-track: var(--cm-surface-muted)");
        expect(mintCss).toContain("--cm-progress-fill: var(--cm-heading)");
        expect(mintCss).toContain("--juice-progress-focus-ring: var(--cm-progress-focus-ring)");
        expect(mintCss).toContain("[progress]");

        expect(tideCss).toContain("--tide-progress-track: var(--tide-surface-muted)");
        expect(tideCss).toContain("--tide-progress-fill: var(--tide-accent)");
        expect(tideCss).toContain("--juice-progress-ink: var(--tide-progress-ink)");
        expect(tideCss).toContain("[progress]");
        expect(tideCss).not.toMatch(/\[progress-fill\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-progress-track: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-progress-fill: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-progress-ink: var(--tide-page)");
    });

    it("binds pagination chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-pagination-surface: var(--aqua-surface)");
        expect(aquaCss).toContain("--aqua-pagination-surface-current: var(--aqua-accent)");
        expect(aquaCss).toContain("--aqua-pagination-ink: var(--aqua-text)");
        expect(aquaCss).toContain("--aqua-pagination-ink-current: var(--aqua-page)");
        expect(aquaCss).toContain("--aqua-pagination-ink-disabled: var(--aqua-text-muted)");
        expect(aquaCss).toContain("--juice-pagination-focus-ring: var(--aqua-pagination-focus-ring)");
        expect(aquaCss).toContain("[pagination]");
        expect(aquaCss).toContain("[pagination-link]");
        expect(aquaCss).toMatch(/\[aria-current=["']?page["']?\]/);
        expect(aquaCss).toMatch(/\[aria-disabled=["']?true["']?\]/);
        expect(aquaCss).not.toMatch(/(^|[,{])\s*\[aria-current=["']?page["']?\]/);
        expect(aquaCss).not.toContain("--aqua-pagination-surface: var(--aqua-accent)");
        expect(aquaCss).not.toContain("--aqua-pagination-ink: var(--aqua-accent)");
        expect(aquaCss).not.toMatch(/\[pagination-link\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-pagination-surface: var(--kw-surface)");
        expect(kiwiCss).toContain("--juice-pagination-surface-current: var(--kw-pagination-surface-current)");
        expect(kiwiCss).toContain("--kw-pagination-ink-current: var(--kw-page)");
        expect(kiwiCss).toContain("--kw-pagination-ellipsis: var(--kw-text-muted)");
        expect(kiwiCss).toContain("[pagination-prev]");
        expect(kiwiCss).toContain("[pagination-next]");
        expect(kiwiCss).not.toMatch(/\[pagination-link\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/\[pagination-link\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-pagination-surface: var(--cm-surface)");
        expect(mintCss).toContain("--cm-pagination-surface-current: var(--cm-heading)");
        expect(mintCss).toContain("--cm-pagination-ink-current: var(--cm-surface)");
        expect(mintCss).toContain("--cm-pagination-ink-hover: var(--cm-heading)");
        expect(mintCss).toContain("--juice-pagination-focus-ring: var(--cm-pagination-focus-ring)");
        expect(mintCss).toContain("[pagination]");

        expect(tideCss).toContain("--tide-pagination-surface: var(--tide-surface-strong)");
        expect(tideCss).toContain("--tide-pagination-surface-current: var(--tide-accent)");
        expect(tideCss).toContain("--tide-pagination-ink-current: var(--tide-heading)");
        expect(tideCss).toContain("--juice-pagination-ink-disabled: var(--tide-pagination-ink-disabled)");
        expect(tideCss).toContain("[pagination]");
        expect(tideCss).not.toMatch(/\[pagination-link\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-pagination-surface: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-pagination-surface-current: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-pagination-ink-current: var(--tide-page)");
    });

    it("binds disclosure chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-disclosure-surface: var(--aqua-surface)");
        expect(aquaCss).toContain("--aqua-disclosure-trigger: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--aqua-disclosure-trigger-open: var(--aqua-highlight)");
        expect(aquaCss).toContain("--aqua-disclosure-ink: var(--aqua-text)");
        expect(aquaCss).toContain("--aqua-disclosure-chevron: var(--aqua-accent)");
        expect(aquaCss).toContain("--juice-disclosure-focus-ring: var(--aqua-disclosure-focus-ring)");
        expect(aquaCss).toContain("[disclosure]");
        expect(aquaCss).toContain("[disclosure-trigger]");
        expect(aquaCss).toContain("[disclosure-panel]");
        expect(aquaCss).toMatch(/\[aria-expanded=["']?true["']?\]/);
        expect(aquaCss).not.toContain("--aqua-disclosure-trigger: var(--aqua-accent)");
        expect(aquaCss).not.toContain("--aqua-disclosure-surface: var(--aqua-page)");
        expect(aquaCss).not.toMatch(/\[disclosure-trigger\][^{]*\{[^}]*--aqua-button-background/);
        expect(aquaCss).not.toMatch(/\[accordion-item\][^{]*--juice-disclosure/);

        expect(kiwiCss).toContain("--kw-disclosure-surface: var(--kw-surface)");
        expect(kiwiCss).toContain("--kw-disclosure-trigger-open: var(--kw-accent-soft)");
        expect(kiwiCss).toContain("--juice-disclosure-ink: var(--kw-disclosure-ink)");
        expect(kiwiCss).toContain("--kw-disclosure-chevron: var(--kw-accent)");
        expect(kiwiCss).toContain("[disclosure-trigger]");
        expect(kiwiCss).toContain("[disclosure-panel]");
        expect(kiwiCss).not.toMatch(/\[disclosure-trigger\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/\[disclosure-trigger\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-disclosure-surface: var(--cm-surface)");
        expect(mintCss).toContain("--cm-disclosure-trigger: var(--cm-surface)");
        expect(mintCss).toContain("--cm-disclosure-chevron: var(--cm-heading)");
        expect(mintCss).toContain("--cm-disclosure-focus-ring: var(--cm-heading)");
        expect(mintCss).toContain("--juice-disclosure-focus-ring: var(--cm-disclosure-focus-ring)");
        expect(mintCss).toContain("[disclosure]");
        expect(mintCss).not.toContain("--cm-disclosure-chevron: var(--cm-accent)");

        expect(tideCss).toContain("--tide-disclosure-surface: var(--tide-surface)");
        expect(tideCss).toContain("--tide-disclosure-trigger: var(--tide-surface-strong)");
        expect(tideCss).toContain("--tide-disclosure-ink: var(--tide-text)");
        expect(tideCss).toContain("--juice-disclosure-chevron: var(--tide-disclosure-chevron)");
        expect(tideCss).toContain("[disclosure]");
        expect(tideCss).toContain("button[disclosure-trigger]");
        expect(tideCss).not.toMatch(/\[disclosure-trigger\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-disclosure-surface: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-disclosure-trigger: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-disclosure-ink: var(--tide-page)");
    });

    it("binds spinner chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-spinner-track: var(--aqua-border)");
        expect(aquaCss).toContain("--aqua-spinner-indicator: var(--aqua-accent)");
        expect(aquaCss).toContain("--aqua-spinner-ink: var(--aqua-text)");
        expect(aquaCss).toContain("--juice-spinner-focus-ring: var(--aqua-spinner-focus-ring)");
        expect(aquaCss).toContain("[spinner]");
        expect(aquaCss).toContain("[spinner-label]");
        expect(aquaCss).toContain("border-top-color: var(--juice-spinner-indicator)");
        expect(aquaCss).not.toContain("--aqua-spinner-track: var(--aqua-page)");
        expect(aquaCss).not.toContain("--aqua-spinner-ink: var(--aqua-accent)");
        expect(aquaCss).not.toContain("--aqua-spinner-indicator: var(--aqua-page)");
        expect(aquaCss).not.toMatch(/\[spinner\][^{]*\{[^}]*--aqua-button-background/);

        expect(kiwiCss).toContain("--kw-spinner-track: var(--kw-border)");
        expect(kiwiCss).toContain("--juice-spinner-indicator: var(--kw-spinner-indicator)");
        expect(kiwiCss).toContain("--kw-spinner-ink: var(--kw-text)");
        expect(kiwiCss).toContain("[spinner]");
        expect(kiwiCss).not.toMatch(/\[spinner\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/\[spinner\][^{]*\{[^}]*--kw-accent[^-]/);

        expect(mintCss).toContain("--cm-spinner-track: var(--cm-border)");
        expect(mintCss).toContain("--cm-spinner-indicator: var(--cm-heading)");
        expect(mintCss).toContain("--cm-spinner-focus-ring: var(--cm-heading)");
        expect(mintCss).toContain("--juice-spinner-focus-ring: var(--cm-spinner-focus-ring)");
        expect(mintCss).toContain("[spinner]");
        expect(mintCss).not.toContain("--cm-spinner-indicator: var(--cm-accent)");

        expect(tideCss).toContain("--tide-spinner-track: var(--tide-border)");
        expect(tideCss).toContain("--tide-spinner-indicator: var(--tide-accent)");
        expect(tideCss).toContain("--juice-spinner-ink: var(--tide-spinner-ink)");
        expect(tideCss).toContain("[spinner]");
        expect(tideCss).not.toMatch(/\[spinner\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-spinner-track: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-spinner-indicator: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-spinner-ink: var(--tide-page)");
    });

    it("binds select chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-select-surface: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--aqua-select-border: var(--aqua-border-strong)");
        expect(aquaCss).toContain("--aqua-select-ink: var(--aqua-text)");
        expect(aquaCss).toContain("--aqua-select-chevron: var(--aqua-accent)");
        expect(aquaCss).toContain("--juice-select-focus-ring: var(--aqua-select-focus-ring)");
        expect(aquaCss).toContain("select[select]");
        expect(aquaCss).toContain("[select-label]");
        expect(aquaCss).toContain("border-color: var(--juice-select-border)");
        expect(aquaCss).not.toContain("--aqua-select-surface: var(--aqua-page)");
        expect(aquaCss).not.toContain("--aqua-select-ink: var(--aqua-accent)");
        expect(aquaCss).not.toContain("--aqua-select-chevron: var(--aqua-page)");
        expect(aquaCss).not.toMatch(/select\[select\][^{]*\{[^}]*--aqua-button-background/);
        expect(aquaCss).toContain("--juice-combobox-input: var(--aqua-combobox-input)");

        expect(kiwiCss).toContain("--kw-select-surface: var(--kw-surface)");
        expect(kiwiCss).toContain("--kw-select-border: var(--kw-border)");
        expect(kiwiCss).toContain("--juice-select-chevron: var(--kw-select-chevron)");
        expect(kiwiCss).toContain("--kw-select-ink: var(--kw-text)");
        expect(kiwiCss).toContain("select[select]");
        expect(kiwiCss).not.toMatch(/select\[select\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/select\[select\][^{]*\{[^}]*background:\s*var\(--kw-accent\)/);

        expect(mintCss).toContain("--cm-select-surface: var(--cm-surface)");
        expect(mintCss).toContain("--cm-select-border: var(--cm-border)");
        expect(mintCss).toContain("--cm-select-chevron: var(--cm-heading)");
        expect(mintCss).toContain("--cm-select-focus-ring: var(--cm-heading)");
        expect(mintCss).toContain("--juice-select-focus-ring: var(--cm-select-focus-ring)");
        expect(mintCss).toContain("select[select]");
        expect(mintCss).not.toContain("--cm-select-chevron: var(--cm-accent)");

        expect(tideCss).toContain("--tide-select-surface: var(--tide-surface-strong)");
        expect(tideCss).toContain("--tide-select-border: var(--tide-border)");
        expect(tideCss).toContain("--tide-select-ink: var(--tide-text)");
        expect(tideCss).toContain("--juice-select-chevron: var(--tide-select-chevron)");
        expect(tideCss).toContain("select[select]");
        expect(tideCss).not.toMatch(/select\[select\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-select-surface: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-select-ink: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-select-chevron: var(--tide-page)");
    });

    it("binds input chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-input-surface: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--aqua-input-border: var(--aqua-border-strong)");
        expect(aquaCss).toContain("--aqua-input-ink: var(--aqua-text)");
        expect(aquaCss).toContain("--aqua-input-placeholder: var(--aqua-text-muted)");
        expect(aquaCss).toContain("--juice-input-focus-ring: var(--aqua-input-focus-ring)");
        expect(aquaCss).toContain("input[input]");
        expect(aquaCss).toContain("[input-label]");
        expect(aquaCss).toContain("border-color: var(--juice-input-border)");
        expect(aquaCss).toContain(":not([combobox-input])");
        expect(aquaCss).not.toContain("--aqua-input-surface: var(--aqua-page)");
        expect(aquaCss).not.toContain("--aqua-input-ink: var(--aqua-accent)");
        expect(aquaCss).not.toContain("--aqua-input-placeholder: var(--aqua-accent)");
        expect(aquaCss).not.toMatch(/input\[input\][^{]*\{[^}]*--aqua-button-background/);
        expect(aquaCss).toContain("--juice-combobox-input: var(--aqua-combobox-input)");
        expect(aquaCss).toContain("select[select]");

        expect(kiwiCss).toContain("--kw-input-surface: var(--kw-surface)");
        expect(kiwiCss).toContain("--kw-input-border: var(--kw-border)");
        expect(kiwiCss).toContain("--juice-input-placeholder: var(--kw-input-placeholder)");
        expect(kiwiCss).toContain("--kw-input-placeholder: var(--kw-text-soft)");
        expect(kiwiCss).toContain("--kw-input-ink: var(--kw-text)");
        expect(kiwiCss).toContain("input[input]");
        expect(kiwiCss).toContain("border: 2px solid");
        expect(kiwiCss).not.toMatch(/input\[input\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/input\[input\][^{]*\{[^}]*background:\s*var\(--kw-accent\)/);
        expect(kiwiCss).not.toMatch(/input\[input\][^{]*\{[^}]*\bborder:\s/);

        expect(mintCss).toContain("--cm-input-surface: var(--cm-surface)");
        expect(mintCss).toContain("--cm-input-border: var(--cm-border)");
        expect(mintCss).toContain("--cm-input-placeholder: var(--cm-text-muted)");
        expect(mintCss).toContain("--cm-input-focus-ring: var(--cm-heading)");
        expect(mintCss).toContain("--juice-input-focus-ring: var(--cm-input-focus-ring)");
        expect(mintCss).toContain("input[input]");
        expect(mintCss).not.toContain("--cm-input-focus-ring: var(--cm-accent)");
        expect(mintCss).toContain('"Lato"');
        expect(mintCss).toContain('"Archivo Black"');

        expect(tideCss).toContain("--tide-input-surface: var(--tide-surface-strong)");
        expect(tideCss).toContain("--tide-input-border: var(--tide-border)");
        expect(tideCss).toContain("--tide-input-ink: var(--tide-text)");
        expect(tideCss).toContain("--tide-input-placeholder: var(--tide-text-muted)");
        expect(tideCss).toContain("--juice-input-focus-ring: var(--tide-input-focus-ring)");
        expect(tideCss).toContain("input[input]");
        expect(tideCss).not.toMatch(/input\[input\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-input-surface: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-input-ink: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-input-placeholder: var(--tide-page)");
    });

    it("binds input chrome on every shipped theme without copying KiwiPress or Korolev into retro fields", () => {
        for (const { id, prefix } of SHIPPED_LIBRARY_THEMES) {
            const css = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");

            for (const role of ["surface", "border", "ink", "placeholder", "focus-ring"]) {
                expect(css, id).toContain(`--juice-input-${role}: var(--${prefix}-input-${role})`);
                expect(css, id).toContain(`--${prefix}-input-${role}:`);
            }

            expect(css, id).toContain("input[input]");
            expect(css, id).toContain("[input-label]");
            expect(css, id).toContain(":not([combobox-input])");
            expect(css, id).toMatch(/\[type=["']?email["']?\s+i\]/);
            expect(css, id).toMatch(/\[type=["']?number["']?\s+i\]/);
            expect(css, id).not.toContain("Korolev");

            if (id.startsWith("retro-") || id === "citrusmint") {
                expect(css, id).toContain("Lato");
                expect(css, id).toContain("Archivo Black");
            }

            if (id.startsWith("retro-")) {
                expect(css, id).not.toContain("--kw-input");
                expect(css, id).not.toContain("--kw-accent");
                expect(css, id).not.toContain("--kw-surface");
            }
        }
    });

    it("binds textarea chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-textarea-surface: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--aqua-textarea-border: var(--aqua-border-strong)");
        expect(aquaCss).toContain("--aqua-textarea-ink: var(--aqua-text)");
        expect(aquaCss).toContain("--aqua-textarea-placeholder: var(--aqua-text-muted)");
        expect(aquaCss).toContain("--juice-textarea-focus-ring: var(--aqua-textarea-focus-ring)");
        expect(aquaCss).toContain("textarea[textarea]");
        expect(aquaCss).toContain("[textarea-label]");
        expect(aquaCss).toContain("border-color: var(--juice-textarea-border)");
        expect(aquaCss).not.toContain("--aqua-textarea-surface: var(--aqua-page)");
        expect(aquaCss).not.toContain("--aqua-textarea-ink: var(--aqua-accent)");
        expect(aquaCss).not.toContain("--aqua-textarea-placeholder: var(--aqua-accent)");
        expect(aquaCss).not.toMatch(/textarea\[textarea\][^{]*\{[^}]*--aqua-button-background/);
        expect(aquaCss).toContain("input[input]");
        expect(aquaCss).toContain("select[select]");

        expect(kiwiCss).toContain("--kw-textarea-surface: var(--kw-surface)");
        expect(kiwiCss).toContain("--kw-textarea-border: var(--kw-border)");
        expect(kiwiCss).toContain("--juice-textarea-placeholder: var(--kw-textarea-placeholder)");
        expect(kiwiCss).toContain("--kw-textarea-placeholder: var(--kw-text-soft)");
        expect(kiwiCss).toContain("--kw-textarea-ink: var(--kw-text)");
        expect(kiwiCss).toContain("textarea[textarea]");
        expect(kiwiCss).toContain("border: 2px solid");
        expect(kiwiCss).not.toMatch(/textarea\[textarea\][^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/textarea\[textarea\][^{]*\{[^}]*background:\s*var\(--kw-accent\)/);
        expect(kiwiCss).not.toMatch(/textarea\[textarea\][^{]*\{[^}]*\bborder:\s/);

        expect(mintCss).toContain("--cm-textarea-surface: var(--cm-surface)");
        expect(mintCss).toContain("--cm-textarea-border: var(--cm-border)");
        expect(mintCss).toContain("--cm-textarea-placeholder: var(--cm-text-muted)");
        expect(mintCss).toContain("--cm-textarea-focus-ring: var(--cm-heading)");
        expect(mintCss).toContain("--juice-textarea-focus-ring: var(--cm-textarea-focus-ring)");
        expect(mintCss).toContain("textarea[textarea]");
        expect(mintCss).not.toContain("--cm-textarea-focus-ring: var(--cm-accent)");
        expect(mintCss).toContain('"Lato"');
        expect(mintCss).toContain('"Archivo Black"');

        expect(tideCss).toContain("--tide-textarea-surface: var(--tide-surface-strong)");
        expect(tideCss).toContain("--tide-textarea-border: var(--tide-border)");
        expect(tideCss).toContain("--tide-textarea-ink: var(--tide-text)");
        expect(tideCss).toContain("--tide-textarea-placeholder: var(--tide-text-muted)");
        expect(tideCss).toContain("--juice-textarea-focus-ring: var(--tide-textarea-focus-ring)");
        expect(tideCss).toContain("textarea[textarea]");
        expect(tideCss).not.toMatch(/textarea\[textarea\][^{]*\{[^}]*--tide-button-background/);
        expect(tideCss).not.toContain("--tide-textarea-surface: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-textarea-ink: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-textarea-placeholder: var(--tide-page)");
    });

    it("binds textarea chrome on every shipped theme without copying KiwiPress or Korolev into retro fields", () => {
        for (const { id, prefix } of SHIPPED_LIBRARY_THEMES) {
            const css = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");

            for (const role of ["surface", "border", "ink", "placeholder", "focus-ring"]) {
                expect(css, id).toContain(`--juice-textarea-${role}: var(--${prefix}-textarea-${role})`);
                expect(css, id).toContain(`--${prefix}-textarea-${role}:`);
            }

            expect(css, id).toContain("textarea[textarea]");
            expect(css, id).toContain("[textarea-label]");
            expect(css, id).toContain("input[input]");
            expect(css, id).not.toContain("Korolev");

            if (id.startsWith("retro-") || id === "citrusmint") {
                expect(css, id).toContain("Lato");
                expect(css, id).toContain("Archivo Black");
            }

            if (id.startsWith("retro-")) {
                expect(css, id).not.toContain("--kw-textarea");
                expect(css, id).not.toContain("--kw-accent");
                expect(css, id).not.toContain("--kw-surface");
            }
        }
    });

    it("binds field chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-field-surface: var(--aqua-surface-strong)");
        expect(aquaCss).toContain("--aqua-field-gap: 0.5rem");
        expect(aquaCss).toContain("--aqua-field-label-ink: var(--aqua-text)");
        expect(aquaCss).toContain("--aqua-field-help-ink: var(--aqua-text-muted)");
        expect(aquaCss).toContain("--aqua-field-error-ink: var(--aqua-banner-error)");
        expect(aquaCss).toContain("--aqua-field-invalid-border: var(--aqua-banner-error)");
        expect(aquaCss).toContain("--juice-field-gap: var(--aqua-field-gap)");
        expect(aquaCss).toContain("[field-label]");
        expect(aquaCss).toContain("[field-help]");
        expect(aquaCss).toContain("[field-error]");
        expect(aquaCss).toContain("gap: var(--juice-field-gap)");
        expect(aquaCss).toContain("border-color: var(--juice-field-invalid-border)");
        expect(aquaCss).not.toContain("--aqua-field-surface: var(--aqua-page)");
        expect(aquaCss).not.toContain("--aqua-field-label-ink: var(--aqua-accent)");
        expect(aquaCss).not.toContain("--aqua-field-error-ink: var(--aqua-accent)");
        expect(aquaCss).not.toContain("--aqua-field-invalid-border: var(--aqua-accent)");
        expect(aquaCss).not.toMatch(/\[field\](?!-)[^{]*\{[^}]*--aqua-button-background/);
        expect(aquaCss).toContain("input[input]");
        expect(aquaCss).toContain("textarea[textarea]");
        expect(aquaCss).toContain("select[select]");

        expect(kiwiCss).toContain("--kw-field-surface: var(--kw-surface)");
        expect(kiwiCss).toContain("--kw-field-gap: 0.35rem");
        expect(kiwiCss).toContain("--kw-field-help-ink: var(--kw-text-soft)");
        expect(kiwiCss).toContain("--kw-field-label-ink: var(--kw-text)");
        expect(kiwiCss).toContain("--kw-field-error-ink: var(--kw-banner-error)");
        expect(kiwiCss).toContain("--kw-field-invalid-border: var(--kw-banner-error)");
        expect(kiwiCss).toContain("--juice-field-gap: var(--kw-field-gap)");
        expect(kiwiCss).toMatch(/\[theme=["']?kiwipress["']?\]\s+\[field\]\s*\{[^}]*border-width:\s*2px/);
        expect(kiwiCss).not.toMatch(/\[theme=["']?kiwipress["']?\]\s+\[field\]\s*\{[^}]*\bborder:\s/);
        expect(kiwiCss).not.toContain("--kw-field-surface: var(--kw-accent)");
        expect(kiwiCss).not.toContain("--kw-field-error-ink: var(--kw-accent)");
        expect(kiwiCss).not.toMatch(/\[field\](?!-)[^{]*\{[^}]*--kw-cta-background/);
        expect(kiwiCss).not.toMatch(/\[field\](?!-)[^{]*\{[^}]*background:\s*var\(--kw-accent\)/);
        expect(kiwiCss).toContain("border: 2px solid");

        expect(mintCss).toContain("--cm-field-surface: var(--cm-surface)");
        expect(mintCss).toContain("--cm-field-gap: 0.5rem");
        expect(mintCss).toContain("--cm-field-help-ink: var(--cm-text-muted)");
        expect(mintCss).toContain("--cm-field-error-ink: var(--cm-banner-error)");
        expect(mintCss).toContain("--cm-field-invalid-border: var(--cm-banner-error)");
        expect(mintCss).toContain("--juice-field-invalid-border: var(--cm-field-invalid-border)");
        expect(mintCss).not.toContain("--cm-field-error-ink: var(--cm-heading)");
        expect(mintCss).not.toContain("--cm-field-error-ink: var(--cm-accent)");
        expect(mintCss).not.toContain("--cm-field-invalid-border: var(--cm-heading)");
        expect(mintCss).not.toContain("--cm-field-invalid-border: var(--cm-accent)");
        expect(mintCss).toContain('"Lato"');
        expect(mintCss).toContain('"Archivo Black"');

        expect(tideCss).toContain("--tide-field-surface: var(--tide-surface-strong)");
        expect(tideCss).toContain("--tide-field-gap: 0.5rem");
        expect(tideCss).toContain("--tide-field-label-ink: var(--tide-text)");
        expect(tideCss).toContain("--tide-field-help-ink: var(--tide-text-muted)");
        expect(tideCss).toContain("--tide-field-error-ink: var(--tide-banner-error)");
        expect(tideCss).toContain("--tide-field-invalid-border: var(--tide-banner-error)");
        expect(tideCss).toContain("--juice-field-surface: var(--tide-field-surface)");
        expect(tideCss).not.toContain("--tide-field-surface: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-field-label-ink: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-field-help-ink: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-field-error-ink: var(--tide-page)");
        expect(tideCss).not.toContain("--tide-field-invalid-border: var(--tide-page)");
        expect(tideCss).not.toMatch(/\[field\](?!-)[^{]*\{[^}]*--tide-button-background/);
    });

    it("binds field chrome on every shipped theme without copying KiwiPress or Korolev into retro fields", () => {
        for (const { id, prefix } of SHIPPED_LIBRARY_THEMES) {
            const css = readFileSync(join(DIST_DIR, "themes", `${id}.css`), "utf-8");

            for (const role of ["surface", "gap", "label-ink", "help-ink", "error-ink", "invalid-border"]) {
                expect(css, id).toContain(`--juice-field-${role}: var(--${prefix}-field-${role})`);
                expect(css, id).toContain(`--${prefix}-field-${role}:`);
            }

            expect(css, id).toContain("[field-label]");
            expect(css, id).toContain("[field-help]");
            expect(css, id).toContain("[field-error]");
            expect(css, id).toContain("gap: var(--juice-field-gap)");
            expect(css, id).toContain("border-color: var(--juice-field-invalid-border)");
            expect(css, id).toContain("input[input]");
            expect(css, id).toContain("textarea[textarea]");
            expect(css, id).toContain("select[select]");
            expect(css, id).not.toContain("Korolev");

            if (id.startsWith("retro-") || id === "citrusmint") {
                expect(css, id).toContain("Lato");
                expect(css, id).toContain("Archivo Black");
            }

            if (id.startsWith("retro-")) {
                expect(css, id).not.toContain("--kw-field");
                expect(css, id).not.toContain("--kw-accent");
                expect(css, id).not.toContain("--kw-surface");
                expect(css, id).toContain(`--${prefix}-field-gap: 0.5rem`);
            }
        }
    });

    it("binds wizard chrome roles in Aquaflux, KiwiPress, Citrusmint, and Tide", () => {
        const aquaCss = readFileSync(join(DIST_DIR, "themes", "aquaflux.css"), "utf-8");
        const kiwiCss = readFileSync(join(DIST_DIR, "themes", "kiwipress.css"), "utf-8");
        const mintCss = readFileSync(join(DIST_DIR, "themes", "citrusmint.css"), "utf-8");
        const tideCss = readFileSync(join(DIST_DIR, "themes", "tide.css"), "utf-8");

        expect(aquaCss).toContain("--aqua-wizard-shell: var(--aqua-page)");
        expect(aquaCss).toContain("--juice-wizard-header: var(--aqua-wizard-header)");
        expect(aquaCss).toContain("--juice-wizard-step-current: var(--aqua-wizard-step-current)");

        expect(kiwiCss).toContain("--kw-wizard-shell: var(--kw-page)");
        expect(kiwiCss).toContain("--juice-wizard-rail: var(--kw-wizard-rail)");
        expect(kiwiCss).toContain("--juice-wizard-step-complete: var(--kw-wizard-step-complete)");
        expect(kiwiCss).toMatch(/\[step=["']?active["']?\]/);
        expect(kiwiCss).toMatch(/\[pill=["']?accent["']?\]/);

        expect(mintCss).toContain("--cm-wizard-shell: var(--cm-page)");
        expect(mintCss).toContain("--juice-wizard-panel: var(--cm-wizard-panel)");
        expect(mintCss).toContain("--cm-wizard-step-current: var(--cm-heading)");

        expect(tideCss).toContain("--tide-wizard-shell: var(--tide-page)");
        expect(tideCss).toContain("--juice-wizard-panel: var(--tide-wizard-panel)");
        expect(tideCss).toContain("--tide-wizard-step-complete: var(--tide-highlight)");
        expect(tideCss).not.toContain("--tide-wizard-shell: var(--tide-surface)");
        expect(tideCss).not.toContain("--tide-wizard-panel: var(--tide-page)");
    });

    it("ships tide CSS as a stable theme export", () => {
        const bundledThemeIds = readBundledThemeIds();
        const themePath = join(DIST_DIR, "themes", "tide.css");
        const draftPath = join(DIST_DIR, "themes", "_draft", "tide.css");

        expect(bundledThemeIds).toEqual(expect.arrayContaining(SHIPPED_LIBRARY_THEMES.map(({ id }) => id)));
        expect(bundledThemeIds).not.toContain("_draft");
        expect(bundledThemeIds).not.toContain("retro");
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
        expect(themeCss).toContain("--juice-modal-overlay: var(--tide-modal-overlay)");
        expect(themeCss).toContain("--juice-modal-panel: var(--tide-modal-panel)");
        expect(themeCss).toContain("button[modal-close]");
        expect(themeCss).toContain("--juice-drawer-overlay: var(--tide-drawer-overlay)");
        expect(themeCss).toContain("--juice-drawer-panel: var(--tide-drawer-panel)");
        expect(themeCss).toContain("button[drawer-close]");
        expect(themeCss).toContain("--juice-toast-panel: var(--tide-toast-panel)");
        expect(themeCss).toContain("--juice-toast-ink: var(--tide-toast-ink)");
        expect(themeCss).toContain("button[toast-close]");
        expect(themeCss).toContain("--juice-banner-panel: var(--tide-banner-panel)");
        expect(themeCss).toContain("--juice-banner-ink: var(--tide-banner-ink)");
        expect(themeCss).toContain("button[banner-close]");
        expect(themeCss).toContain("--juice-popover-panel: var(--tide-popover-panel)");
        expect(themeCss).toContain("--juice-popover-ink: var(--tide-popover-ink)");
        expect(themeCss).toContain("button[popover-close]");
        expect(themeCss).toContain("--juice-wizard-shell: var(--tide-wizard-shell)");
        expect(themeCss).toContain("--juice-wizard-panel: var(--tide-wizard-panel)");
        expect(themeCss).toContain("--juice-tooltip-panel: var(--tide-tooltip-panel)");
        expect(themeCss).toContain("--juice-tooltip-ink: var(--tide-tooltip-ink)");
        expect(themeCss).toContain("--juice-combobox-input: var(--tide-combobox-input)");
        expect(themeCss).toContain("--juice-combobox-list: var(--tide-combobox-list)");
        expect(themeCss).toContain("button[combobox-trigger]");
        expect(themeCss).toContain("--juice-menu-panel: var(--tide-menu-panel)");
        expect(themeCss).toContain("--juice-menu-ink: var(--tide-menu-ink)");
        expect(themeCss).toContain("button[menu-button]");
        expect(themeCss).toContain("button[tab]");
        expect(themeCss).not.toMatch(/button\[tab\][^{]*\{[^}]*--tide-button-background/);
        expect(themeCss).toContain("input:focus-visible");
        expect(themeCss).toContain("nav[type=bar]");
        expect(themeCss).toContain("main > header");
    });

    it("ships each retro theme as its own stylesheet, not a retro.css bundle or a draft", () => {
        const retroIds = SHIPPED_LIBRARY_THEMES.map(({ id }) => id).filter((id) => id.startsWith("retro-"));

        expect(retroIds).toHaveLength(10);
        expect(existsSync(join(DIST_DIR, "themes", "retro.css"))).toBe(false);
        expect(existsSync(join(PACKAGE_ROOT, "src", "themes", "retro", "retro.scss"))).toBe(false);
        expect(existsSync(join(PACKAGE_ROOT, "src", "themes", "_draft", "retro.scss.barrel-unused"))).toBe(false);

        for (const id of retroIds) {
            const themePath = join(DIST_DIR, "themes", `${id}.css`);
            const draftPath = join(DIST_DIR, "themes", "_draft", `${id}.css`);
            const sourcePath = join(PACKAGE_ROOT, "src", "themes", id, `${id}.scss`);

            expect(existsSync(themePath), themePath).toBe(true);
            expect(existsSync(draftPath), draftPath).toBe(false);
            expect(existsSync(sourcePath), sourcePath).toBe(true);
            expect(existsSync(join(PACKAGE_ROOT, "src", "themes", "_draft", id))).toBe(false);
            expect(statSync(themePath).size).toBeLessThan(500_000);
            expect(readFileSync(sourcePath, "utf-8")).toContain(`@use '../../tokens/color/${id}/${id}.scss'`);
            expect(readFileSync(themePath, "utf-8")).toMatch(new RegExp(`\\[theme=["']?${id}["']?\\]`));
        }
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
        for (const { id } of SHIPPED_LIBRARY_THEMES) {
            expect(exportsMap[`./themes/${id}.css`]).toEqual({
                types: "./dist/themes/index.d.ts",
                default: `./dist/themes/${id}.css`
            });
            expect(exportsMap[`./styles/themes/${id}`]).toEqual({
                types: "./dist/themes/index.d.ts",
                default: `./dist/themes/${id}.css`
            });
        }
        expect(exportsMap["./themes/retro.css"]).toBeUndefined();
        expect(exportsMap["./styles/themes/retro"]).toBeUndefined();
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
            ...SHIPPED_LIBRARY_THEMES.map(({ id }) => `./dist/themes/${id}.css`)
        ]);
        expect(readFileSync(join(DIST_DIR, "index.js"), "utf-8")).toContain("DOMContentLoaded");
    });

    it("does not ship a Sig adapter subpath", () => {
        const pkg = readPackageJson();
        const main = readFileSync(join(DIST_DIR, "index.js"), "utf-8");

        expect(pkg.exports?.["./sig"]).toBeUndefined();
        expect(existsSync(join(DIST_DIR, "sig"))).toBe(false);
        expect(existsSync(join(PACKAGE_ROOT, "src", "sig"))).toBe(false);
        expect(main).not.toMatch(/\/sig\/index\.js/);
        expect(main).not.toMatch(/@citrusworx\/juiceui\/sig/);
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
        expect(module).toHaveProperty("createModal");
        expect(module).toHaveProperty("initModal");
        expect(module).toHaveProperty("startModalRuntime");
        expect(module).toHaveProperty("stopModalRuntime");
        expect(module).toHaveProperty("createDrawer");
        expect(module).toHaveProperty("initDrawer");
        expect(module).toHaveProperty("startDrawerRuntime");
        expect(module).toHaveProperty("stopDrawerRuntime");
        expect(module).toHaveProperty("createToast");
        expect(module).toHaveProperty("initToast");
        expect(module).toHaveProperty("startToastRuntime");
        expect(module).toHaveProperty("stopToastRuntime");
        expect(module).toHaveProperty("createPopover");
        expect(module).toHaveProperty("initPopover");
        expect(module).toHaveProperty("startPopoverRuntime");
        expect(module).toHaveProperty("stopPopoverRuntime");
        expect(module).toHaveProperty("createTooltip");
        expect(module).toHaveProperty("initTooltip");
        expect(module).toHaveProperty("startTooltipRuntime");
        expect(module).toHaveProperty("stopTooltipRuntime");
        expect(module).toHaveProperty("createWizard");
        expect(module).toHaveProperty("initWizard");
        expect(module).toHaveProperty("startWizardRuntime");
        expect(module).toHaveProperty("stopWizardRuntime");
        expect(module).toHaveProperty("createCombobox");
        expect(module).toHaveProperty("initCombobox");
        expect(module).toHaveProperty("startComboboxRuntime");
        expect(module).toHaveProperty("stopComboboxRuntime");
        expect(module).toHaveProperty("createBanner");
        expect(module).toHaveProperty("initBanner");
        expect(module).toHaveProperty("startBannerRuntime");
        expect(module).toHaveProperty("stopBannerRuntime");
        expect(module).toHaveProperty("createMenu");
        expect(module).toHaveProperty("initMenu");
        expect(module).toHaveProperty("startMenuRuntime");
        expect(module).toHaveProperty("stopMenuRuntime");
        expect(module).toHaveProperty("createSwitch");
        expect(module).toHaveProperty("initSwitch");
        expect(module).toHaveProperty("startSwitchRuntime");
        expect(module).toHaveProperty("stopSwitchRuntime");
        expect(module).toHaveProperty("createSlider");
        expect(module).toHaveProperty("initSlider");
        expect(module).toHaveProperty("startSliderRuntime");
        expect(module).toHaveProperty("stopSliderRuntime");
        expect(module).toHaveProperty("createCheckbox");
        expect(module).toHaveProperty("initCheckbox");
        expect(module).toHaveProperty("startCheckboxRuntime");
        expect(module).toHaveProperty("stopCheckboxRuntime");
        expect(module).toHaveProperty("createRadio");
        expect(module).toHaveProperty("initRadio");
        expect(module).toHaveProperty("startRadioRuntime");
        expect(module).toHaveProperty("stopRadioRuntime");
        expect(module).toHaveProperty("createBreadcrumb");
        expect(module).toHaveProperty("initBreadcrumb");
        expect(module).toHaveProperty("startBreadcrumbRuntime");
        expect(module).toHaveProperty("stopBreadcrumbRuntime");
        expect(module).toHaveProperty("createProgress");
        expect(module).toHaveProperty("initProgress");
        expect(module).toHaveProperty("startProgressRuntime");
        expect(module).toHaveProperty("stopProgressRuntime");
        expect(module).toHaveProperty("createPagination");
        expect(module).toHaveProperty("initPagination");
        expect(module).toHaveProperty("startPaginationRuntime");
        expect(module).toHaveProperty("stopPaginationRuntime");
        expect(module).toHaveProperty("createDisclosure");
        expect(module).toHaveProperty("initDisclosure");
        expect(module).toHaveProperty("startDisclosureRuntime");
        expect(module).toHaveProperty("stopDisclosureRuntime");
        expect(module).toHaveProperty("createSpinner");
        expect(module).toHaveProperty("initSpinner");
        expect(module).toHaveProperty("startSpinnerRuntime");
        expect(module).toHaveProperty("stopSpinnerRuntime");
        expect(module).toHaveProperty("createSelect");
        expect(module).toHaveProperty("initSelect");
        expect(module).toHaveProperty("startSelectRuntime");
        expect(module).toHaveProperty("stopSelectRuntime");
        expect(module).toHaveProperty("createInput");
        expect(module).toHaveProperty("initInput");
        expect(module).toHaveProperty("startInputRuntime");
        expect(module).toHaveProperty("stopInputRuntime");
        expect(module).toHaveProperty("createTextarea");
        expect(module).toHaveProperty("initTextarea");
        expect(module).toHaveProperty("startTextareaRuntime");
        expect(module).toHaveProperty("stopTextareaRuntime");
        expect(module).toHaveProperty("createField");
        expect(module).toHaveProperty("initField");
        expect(module).toHaveProperty("startFieldRuntime");
        expect(module).toHaveProperty("stopFieldRuntime");
        expect(module).toHaveProperty("createIconButton");
        expect(module).toHaveProperty("initIconButton");
        expect(module).toHaveProperty("startIconButtonRuntime");
        expect(module).toHaveProperty("stopIconButtonRuntime");
        expect(module).toHaveProperty("createAvatar");
        expect(module).toHaveProperty("initAvatar");
        expect(module).toHaveProperty("startAvatarRuntime");
        expect(module).toHaveProperty("stopAvatarRuntime");
        expect(module).toHaveProperty("createTable");
        expect(module).toHaveProperty("initTable");
        expect(module).toHaveProperty("startTableRuntime");
        expect(module).toHaveProperty("stopTableRuntime");
        expect(module).toHaveProperty("createPressable");
        expect(module).toHaveProperty("initPressable");
        expect(module).toHaveProperty("startPressableRuntime");
        expect(module).toHaveProperty("stopPressableRuntime");
        expect(module).toHaveProperty("createTouchableRow");
        expect(module).toHaveProperty("initTouchableRow");
        expect(module).toHaveProperty("startTouchableRowRuntime");
        expect(module).toHaveProperty("stopTouchableRowRuntime");
        expect(module).toHaveProperty("createKeyboardAvoider");
        expect(module).toHaveProperty("initKeyboardAvoider");
        expect(module).toHaveProperty("startKeyboardAvoiderRuntime");
        expect(module).toHaveProperty("stopKeyboardAvoiderRuntime");
        expect(
            Object.keys(module).filter((key) => key.startsWith("start") && key.endsWith("Runtime"))
        ).toHaveLength(31);
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

    it("publishes motion tokens and keeps transition and animation durations on those tokens", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const reduced = reducedMotionBlocks(css);

        expect(css).toContain("--juice-motion-duration-instant: 0.15s");
        expect(css).toContain("--juice-motion-duration-fast: 0.2s");
        expect(css).toContain("--juice-motion-duration-base: 0.3s");
        expect(css).toContain("--juice-motion-duration-slow: 1s");
        expect(css).toContain("--juice-motion-ease-standard: ease");
        expect(css).toContain("--juice-motion-ease-enter: ease-out");
        expect(css).toContain("--juice-motion-ease-exit: ease-in");
        expect(css).toContain("--juice-motion-ease-linear: linear");

        const durationCollapse = reduced.filter((block) => block.includes("--juice-motion-duration-instant"));
        expect(durationCollapse.length).toBeGreaterThan(0);
        for (const token of ["instant", "fast", "base", "slow"]) {
            expect(durationCollapse.some((block) => block.includes(`--juice-motion-duration-${token}: 0.01ms`))).toBe(true);
        }

        expect(reduced.some((block) => /\[card=["']?interactive["']?\]/.test(block))).toBe(true);
        expect(reduced.some((block) => /nav\[type=["']?mobile["']?\]\[data-nav-toggle-icon=["']?default["']?\]::before/.test(block))).toBe(true);
        expect(reduced.some((block) => /\[tooltip-panel\]/.test(block))).toBe(true);
        expect(reduced.some((block) => /\[animation=["']?flow["']?\]/.test(block) && /\[animation=["']?fall["']?\]/.test(block))).toBe(true);

        const literals = motionDeclarationsWithDurationLiterals(css).filter(
            (declaration) => !MOTION_DURATION_ALLOWLIST.has(declaration)
        );
        expect(literals).toEqual([]);
    });

    it("gates the P0 motion catalog in compiled CSS", () => {
        const css = readFileSync(join(DIST_DIR, "index.css"), "utf-8");
        const catalog: Array<{
            value: string;
            property: "animation" | "transition";
            keyframes?: string;
        }> = [
            { value: "fade.in", property: "animation", keyframes: "fadeIn" },
            { value: "fade.in::fast", property: "animation", keyframes: "fadeIn" },
            { value: "fade.out", property: "animation", keyframes: "fadeOut" },
            { value: "slideIn.left", property: "animation", keyframes: "slideInLeft" },
            { value: "slideIn.left::fast", property: "animation", keyframes: "slideInLeft" },
            { value: "slideIn.left::slow", property: "animation", keyframes: "slideInLeft" },
            { value: "spin", property: "animation", keyframes: "spin" },
            { value: "spin::fast", property: "animation", keyframes: "spin" },
            { value: "spin::slow", property: "animation", keyframes: "spin" },
            { value: "pulse", property: "animation", keyframes: "pulse" },
            { value: "grow", property: "animation", keyframes: "grow" },
            { value: "accordion", property: "transition" },
            { value: "blink", property: "animation", keyframes: "blink-default" },
            { value: "blink:slow", property: "animation", keyframes: "blink-soft" },
            { value: "blink:fast", property: "animation", keyframes: "blink-soft" },
            { value: "blink:signal", property: "animation", keyframes: "blink-signal" },
            { value: "blink:terminal", property: "animation", keyframes: "blink-terminal" },
        ];

        const ruleBody = (value: string) => {
            const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const match = new RegExp(`\\[motion=(?:"|')?${escaped}(?:"|')?\\]`).exec(css);
            expect(match, `[motion="${value}"]`).not.toBeNull();

            const open = css.indexOf("{", match!.index);
            expect(open).toBeGreaterThan(match!.index);
            let depth = 0;
            let end = open;
            for (let i = open; i < css.length; i += 1) {
                if (css[i] === "{") depth += 1;
                else if (css[i] === "}") {
                    depth -= 1;
                    if (depth === 0) {
                        end = i;
                        break;
                    }
                }
            }

            return css.slice(open + 1, end);
        };

        for (const entry of catalog) {
            const body = ruleBody(entry.value);
            const declaration = body.match(new RegExp(`${entry.property}\\s*:[^;]+`));
            expect(declaration, entry.value).not.toBeNull();
            const value = declaration![0];
            expect(value, entry.value).toMatch(/var\(--juice-motion-/);
            expect(value, entry.value).not.toMatch(/\d+(?:\.\d+)?(?:ms|s)\b/);

            if (entry.keyframes) {
                expect(value, entry.value).toContain(entry.keyframes);
                expect(css).toMatch(new RegExp(`@keyframes ${entry.keyframes}\\s*\\{`));
            }
        }

        const reduced = reducedMotionBlocks(css);
        const blanket = reduced.find((block) =>
            /\[motion\]\s*\{[^}]*animation:\s*none\s*!important/.test(block)
        );
        expect(blanket).toBeDefined();
        expect(blanket).toMatch(
            /transition-duration:\s*var\(--juice-motion-duration-instant\)\s*!important/
        );
        expect(blanket).toMatch(
            /transition-delay:\s*var\(--juice-motion-duration-instant\)\s*!important/
        );

        const durationCollapse = reduced.filter((block) =>
            block.includes("--juice-motion-duration-instant: 0.01ms !important")
        );
        expect(durationCollapse.length).toBeGreaterThan(0);
        for (const token of ["instant", "fast", "base", "slow"]) {
            expect(
                durationCollapse.some((block) =>
                    block.includes(`--juice-motion-duration-${token}: 0.01ms !important`)
                )
            ).toBe(true);
        }
    });
});
