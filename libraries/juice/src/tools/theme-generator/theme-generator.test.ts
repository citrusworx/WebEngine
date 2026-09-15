import { describe, expect, it } from "vitest";
import { buildThemeStylesheet, type ThemeGeneratorConfig } from "./index.js";

const ACCORDION_ROLES = [
    "trigger",
    "trigger-hover",
    "trigger-open",
    "chevron",
    "panel-rule",
    "focus-ring",
] as const;

const fixture: ThemeGeneratorConfig = {
    id: "apptheme",
    name: "App Theme",
    typography: {
        body: { family: "Lato", fallback: "sans-serif" },
        heading: { family: "Archivo Black", fallback: "sans-serif" },
    },
    palette: {
        page: { background: "#f4f0e8" },
        text: { default: "#211c1b", muted: "#6f6660", heading: "#211c1b" },
        accents: { primary: "#ff7716" },
        surfaces: { default: "#fffdf8", border: "rgba(33, 28, 27, 0.12)" },
    },
};

describe("Juice theme generator accordion roles", () => {
    it("binds --juice-accordion-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-trigger: var(--jx-surface-strong)");
        expect(css).toContain("--jx-trigger-hover: var(--jx-surface-muted)");
        expect(css).toContain("--jx-trigger-open: var(--jx-surface-muted)");
        expect(css).toContain("--jx-chevron: var(--jx-accent)");
        expect(css).toContain("--jx-panel-rule: var(--jx-border)");
        expect(css).toContain("--jx-focus-ring: var(--jx-accent)");

        for (const role of ACCORDION_ROLES) {
            expect(css).toContain(`--juice-accordion-${role}: var(--jx-${role})`);
        }

        const accordionItemBlocks = [...css.matchAll(/button\[accordion-item\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(css).toContain(":where([accordion])");
        expect(accordionItemBlocks.length).toBeGreaterThan(0);
        for (const block of accordionItemBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
            expect(block).not.toContain("--jx-accent-soft");
        }
    });

    it("uses --jx-accent-soft for the open trigger only when a soft accent is configured", () => {
        const css = buildThemeStylesheet(
            {
                ...fixture,
                palette: {
                    ...fixture.palette,
                    accents: { primary: "#ff7716", soft: "#ffe8d6" },
                },
            },
            "test.yaml"
        );

        expect(css).toContain("--jx-trigger-open: var(--jx-accent-soft)");
        expect(css).toContain("--juice-accordion-trigger-open: var(--jx-trigger-open)");
    });
});

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

describe("Juice theme generator tabs roles", () => {
    it("binds --juice-tabs-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-tabs-trigger: transparent");
        expect(css).toContain("--jx-tabs-text: var(--jx-text-soft)");
        expect(css).toContain("--jx-tabs-text-active: var(--jx-accent)");
        expect(css).toContain("--jx-tabs-indicator: var(--jx-accent)");
        expect(css).toContain("--jx-tabs-list-rule: var(--jx-border)");
        expect(css).toContain("--jx-tabs-focus-ring: var(--jx-accent)");

        for (const role of TABS_ROLES) {
            expect(css).toContain(`--juice-tabs-${role}: var(--jx-tabs-${role})`);
        }

        const tabButtonBlocks = [...css.matchAll(/button\[tab\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(css).toContain(":where([tabs])");
        expect(tabButtonBlocks.length).toBeGreaterThan(0);
        for (const block of tabButtonBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
        }
    });
});
