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
