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
        expect(css).toContain("--jx-trigger-open: var(--jx-accent-soft)");
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
        }
    });
});
