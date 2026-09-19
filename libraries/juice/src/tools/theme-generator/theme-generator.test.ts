import { describe, expect, it } from "vitest";
import { buildThemeStylesheet, type ThemeGeneratorConfig } from "./index.js";
import {
    BORDER_STRENGTH_ROLES,
    BORDER_STRENGTHS,
    REQUIRED_ACCORDION_ROLES,
    REQUIRED_TABS_ROLES,
    SHADOW_TONE_ROLES,
    SHADOW_TONES,
    SURFACE_TONE_ROLES,
    SURFACE_TONES,
    missingRequiredJuiceBinds,
    requiredGeneratedJxJuiceBinds,
} from "../../juice.theme-contract.js";

const ACCORDION_ROLES = REQUIRED_ACCORDION_ROLES;

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

const TABS_ROLES = REQUIRED_TABS_ROLES;

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

describe("Juice theme generator surface tone roles", () => {
    it("binds --juice-surface-* from existing --jx-* surfaces", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--juice-surface-soft-bg: var(--jx-surface)");
        expect(css).toContain("--juice-surface-soft-border: var(--jx-border)");
        expect(css).toContain("--juice-surface-soft-shadow: var(--jx-shadow)");
        expect(css).toContain("--juice-surface-strong-bg: var(--jx-surface-strong)");
        expect(css).toContain("--juice-surface-strong-border: var(--jx-border-strong)");
        expect(css).toContain("--juice-surface-muted-bg: var(--jx-surface-muted)");

        for (const tone of SURFACE_TONES) {
            for (const role of SURFACE_TONE_ROLES) {
                expect(css).toContain(`--juice-surface-${tone}-${role}:`);
            }
        }
    });

    it("binds --juice-border-strength-* from existing --jx-border tokens", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--juice-border-strength-soft-width: 1px");
        expect(css).toContain("--juice-border-strength-soft-color: var(--jx-border)");
        expect(css).toContain("--juice-border-strength-bold-width: 2px");
        expect(css).toContain("--juice-border-strength-bold-color: var(--jx-border-strong)");

        for (const strength of BORDER_STRENGTHS) {
            for (const role of BORDER_STRENGTH_ROLES) {
                expect(css).toContain(`--juice-border-strength-${strength}-${role}:`);
            }
        }
    });

    it("binds --juice-shadow-tone-* from existing --jx-* tokens", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--juice-shadow-tone-cool-color: color-mix(in srgb, var(--jx-page-deep) 20%, transparent)");
        expect(css).toContain("--juice-shadow-tone-cool-shadow: var(--jx-shadow)");
        expect(css).toContain("--juice-shadow-tone-warm-color: color-mix(in srgb, var(--jx-warm) 22%, transparent)");
        expect(css).toContain("--juice-shadow-tone-warm-shadow: 0 18px 40px -28px color-mix(in srgb, var(--jx-warm) 22%, transparent)");

        for (const tone of SHADOW_TONES) {
            for (const role of SHADOW_TONE_ROLES) {
                expect(css).toContain(`--juice-shadow-tone-${tone}-${role}:`);
            }
        }
    });
});

describe("Juice theme generator contract lock", () => {
    it("emits every required --juice-* bind, including --jx-* aliases the generator already writes", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(missingRequiredJuiceBinds(css)).toEqual([]);

        for (const { juice, jx } of requiredGeneratedJxJuiceBinds()) {
            expect(css).toContain(`${juice}: var(${jx})`);
        }
    });
});
