import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), ".");

const TABS_ROLES = [
    "trigger",
    "trigger-hover",
    "trigger-active",
    "text",
    "text-hover",
    "text-active",
    "indicator",
    "list-rule",
    "focus-ring",
] as const;

const OPTIONAL_TABS_ROLES = ["panel", "panel-rule"] as const;

const THEMES = [
    { id: "aquaflux", prefix: "aqua" },
    { id: "kiwipress", prefix: "kw" },
    { id: "citrusmint", prefix: "cm" },
] as const;

function readThemeScss(id: string) {
    return readFileSync(join(SRC_ROOT, "themes", id, `${id}.scss`), "utf-8");
}

function readDraftThemeScss(id: string) {
    return readFileSync(join(SRC_ROOT, "themes", "_draft", id, `${id}.scss`), "utf-8");
}

describe("Tabs theme role contract", () => {
    it("consumes shared --juice-tabs-* roles from component SCSS", () => {
        const scss = readFileSync(join(SRC_ROOT, "components/tabs/tabs.scss"), "utf-8");

        for (const role of TABS_ROLES) {
            expect(scss).toContain(`-juice-tabs-role(${role}`);
        }

        expect(scss).toContain("--aqua-tabs-#{$name}");
        expect(scss).toContain("--kw-tabs-#{$name}");
        expect(scss).toContain("--cm-tabs-#{$name}");
        expect(scss).toContain("--jx-tabs-#{$name}");
        expect(scss).not.toContain("--aqua-button-background");
        expect(scss).not.toContain("--kw-cta-background");
        expect(scss).not.toMatch(/^\s*content:\s*["']active["']/m);
        expect(scss).not.toMatch(/^\s*content:\s*["']hidden["']/m);
        expect(scss).not.toMatch(/\[content=["'](?:active|hidden)["']\]/);
    });

    it("exposes optional panel hooks with no-op fallbacks", () => {
        const scss = readFileSync(join(SRC_ROOT, "components/tabs/tabs.scss"), "utf-8");

        for (const role of OPTIONAL_TABS_ROLES) {
            expect(scss).toContain(`-juice-tabs-role(${role}`);
        }

        expect(scss).toContain("panel, transparent");
        expect(scss).toContain("panel-rule, transparent");
        expect(scss).toContain("[tab-panel]");
    });

    it("treats [tabs] as a column widget and keeps strip chrome on the list", () => {
        const scss = readFileSync(join(SRC_ROOT, "components/tabs/tabs.scss"), "utf-8");

        expect(scss).toContain("[tabs]");
        expect(scss).toContain("flex-direction: column");
        expect(scss).toContain("[tabs-list]");
        expect(scss).toContain("[tabs]:not(:has([tabs-list], [tab-panel]))");
        expect(scss).toContain("[tabs] > button");
        expect(scss).toContain("[tab][active]");
        expect(scss).toContain('[tab][aria-selected="true"]');
        expect(scss).toContain('[aria-selected="true"]');
    });

    it("keeps KiwiPress tab paint in parity with [active] and aria-selected", () => {
        const scss = readThemeScss("kiwipress");

        expect(scss).toContain("[tabs-list]");
        expect(scss).toContain("[tab-panel]");
        expect(scss).toContain('[aria-selected="true"]');
        expect(scss).toContain("[tab][active]");
        expect(scss).toContain("border-bottom-color: var(--juice-tabs-indicator)");
        expect(scss).not.toContain('content: "active"');
        expect(scss).not.toContain('content: "hidden"');
    });

    it("binds the same tabs roles in aquaflux, kiwipress, and citrusmint", () => {
        for (const { id, prefix } of THEMES) {
            const scss = readThemeScss(id);
            const rootBlock = scss.split(`[theme="${id}"]`)[1] ?? "";

            expect(rootBlock.length).toBeGreaterThan(0);

            for (const role of TABS_ROLES) {
                expect(scss).toContain(`--${prefix}-tabs-${role}:`);
                expect(scss).toContain(`--juice-tabs-${role}: var(--${prefix}-tabs-${role})`);
            }

            expect(scss).toContain(`:where([tabs])`);
            expect(scss).toContain("button[tab]");
        }
    });

    it("maps Aquaflux tabs roles onto existing surface tokens, not the CTA gradient", () => {
        const scss = readThemeScss("aquaflux");

        expect(scss).toContain("--aqua-tabs-trigger: transparent");
        expect(scss).toContain("--aqua-tabs-text: var(--aqua-text-muted)");
        expect(scss).toContain("--aqua-tabs-text-active: var(--aqua-accent)");
        expect(scss).toContain("--aqua-tabs-indicator: var(--aqua-accent)");
        expect(scss).toContain("--aqua-tabs-list-rule: var(--aqua-border)");
        expect(scss).toContain("--aqua-tabs-focus-ring: var(--aqua-accent)");

        const tabButtonBlocks = [...scss.matchAll(/button\[tab\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(tabButtonBlocks.length).toBeGreaterThan(0);
        for (const block of tabButtonBlocks) {
            expect(block).not.toContain("--aqua-button-background");
        }
    });

    it("maps KiwiPress tabs roles onto --kw-* surfaces and accents", () => {
        const scss = readThemeScss("kiwipress");

        expect(scss).toContain("--kw-tabs-text: var(--kw-text-soft)");
        expect(scss).toContain("--kw-tabs-text-active: var(--kw-accent)");
        expect(scss).toContain("--kw-tabs-indicator: var(--kw-accent)");
        expect(scss).toContain("--kw-tabs-list-rule: var(--kw-border)");

        const tabButtonBlocks = [...scss.matchAll(/button\[tab\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(tabButtonBlocks.length).toBeGreaterThan(0);
        for (const block of tabButtonBlocks) {
            expect(block).not.toContain("--kw-cta-background");
        }
    });

    it("maps Citrusmint tabs roles onto the thinner --cm-* set", () => {
        const scss = readThemeScss("citrusmint");

        expect(scss).toContain("--cm-tabs-text: var(--cm-text-muted)");
        expect(scss).toContain("--cm-tabs-text-active: var(--cm-heading)");
        expect(scss).toContain("--cm-tabs-indicator: var(--cm-heading)");
        expect(scss).toContain("--cm-tabs-list-rule: var(--cm-border)");
        expect(scss).toContain("--cm-tabs-focus-ring: var(--cm-heading)");
    });

    it("binds draft tide tabs roles onto --tide-* surfaces, not the CTA gradient", () => {
        const scss = readDraftThemeScss("tide");
        const rootBlock = scss.split(`[theme="tide"]`)[1] ?? "";

        expect(rootBlock.length).toBeGreaterThan(0);

        for (const role of TABS_ROLES) {
            expect(scss).toContain(`--tide-tabs-${role}:`);
            expect(scss).toContain(`--juice-tabs-${role}: var(--tide-tabs-${role})`);
        }

        expect(scss).toContain("--tide-tabs-text-active: var(--tide-accent)");
        expect(scss).toContain("--juice-tabs-panel: var(--tide-tabs-panel)");
        expect(scss).toContain(`:where([tabs])`);
        expect(scss).toContain("button[tab]");
        expect(scss).not.toContain("--aqua-accent");

        const tabButtonBlocks = [...scss.matchAll(/button\[tab\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(tabButtonBlocks.length).toBeGreaterThan(0);
        for (const block of tabButtonBlocks) {
            expect(block).not.toContain("--tide-button-background");
        }
    });

    it("leaves optional tabs panel roles unbound in Aquaflux, KiwiPress, and Citrusmint", () => {
        for (const { id, prefix } of THEMES) {
            const scss = readThemeScss(id);

            expect(scss).not.toContain(`--${prefix}-tabs-panel:`);
            expect(scss).not.toContain("--juice-tabs-panel:");
        }
    });
});
