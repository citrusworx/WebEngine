import { describe, expect, it } from "vitest";
import { buildThemeStylesheet, type ThemeGeneratorConfig } from "./index.js";
import {
    BORDER_STRENGTH_ROLES,
    BORDER_STRENGTHS,
    OVERLAY_ROLES,
    OVERLAYS,
    REQUIRED_ACCORDION_ROLES,
    REQUIRED_DRAWER_ROLES,
    REQUIRED_MODAL_ROLES,
    REQUIRED_TOAST_ROLES,
    REQUIRED_BANNER_ROLES,
    REQUIRED_POPOVER_ROLES,
    REQUIRED_TABS_ROLES,
    REQUIRED_TOOLTIP_ROLES,
    REQUIRED_COMBOBOX_ROLES,
    REQUIRED_MENU_ROLES,
    REQUIRED_WIZARD_ROLES,
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

    it("binds --juice-modal-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-modal-overlay: color-mix(in srgb, var(--jx-page-deep) 70%, transparent)");
        expect(css).toContain("--jx-modal-panel: var(--jx-surface)");
        expect(css).toContain("--jx-modal-panel-border: var(--jx-border)");
        expect(css).toContain("--jx-modal-panel-shadow: var(--jx-shadow-strong)");
        expect(css).toContain("--jx-modal-close: var(--jx-surface)");
        expect(css).toContain("--jx-modal-close-color: var(--jx-heading)");
        expect(css).toContain("--jx-modal-close-hover: var(--jx-surface-muted)");
        expect(css).toContain("--jx-modal-focus-ring: var(--jx-accent)");

        for (const role of REQUIRED_MODAL_ROLES) {
            expect(css).toContain(`--juice-modal-${role}: var(--jx-modal-${role})`);
        }

        const closeBlocks = [...css.matchAll(/button\[modal-close\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(closeBlocks.length).toBeGreaterThan(0);
        for (const block of closeBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
        }
    });

    it("binds --juice-drawer-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-drawer-overlay: color-mix(in srgb, var(--jx-page-deep) 70%, transparent)");
        expect(css).toContain("--jx-drawer-panel: var(--jx-surface)");
        expect(css).toContain("--jx-drawer-panel-border: var(--jx-border)");
        expect(css).toContain("--jx-drawer-panel-shadow: var(--jx-shadow-strong)");
        expect(css).toContain("--jx-drawer-close: var(--jx-surface)");
        expect(css).toContain("--jx-drawer-close-color: var(--jx-heading)");
        expect(css).toContain("--jx-drawer-close-hover: var(--jx-surface-muted)");
        expect(css).toContain("--jx-drawer-focus-ring: var(--jx-accent)");

        for (const role of REQUIRED_DRAWER_ROLES) {
            expect(css).toContain(`--juice-drawer-${role}: var(--jx-drawer-${role})`);
        }

        const closeBlocks = [...css.matchAll(/button\[drawer-close\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(closeBlocks.length).toBeGreaterThan(0);
        for (const block of closeBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
        }
    });

    it("binds --juice-toast-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-toast-panel: var(--jx-surface)");
        expect(css).toContain("--jx-toast-panel-border: var(--jx-border)");
        expect(css).toContain("--jx-toast-panel-shadow: var(--jx-shadow-strong)");
        expect(css).toContain("--jx-toast-ink: var(--jx-text)");
        expect(css).toContain("--jx-toast-close: var(--jx-surface)");
        expect(css).toContain("--jx-toast-close-color: var(--jx-heading)");
        expect(css).toContain("--jx-toast-close-hover: var(--jx-surface-muted)");
        expect(css).toContain("--jx-toast-focus-ring: var(--jx-accent)");
        expect(css).toContain("--jx-toast-success: var(--jx-accent)");
        expect(css).toContain("--jx-toast-success-soft: var(--jx-accent-soft)");
        expect(css).toContain("--jx-toast-error: var(--jx-page-deep)");
        expect(css).toContain("--jx-toast-error-soft: color-mix(in srgb, var(--jx-page-deep) 12%, var(--jx-surface))");
        expect(css).toContain("--jx-toast-info: var(--jx-accent-secondary)");
        expect(css).toContain("--jx-toast-info-soft: var(--jx-accent-tint)");
        expect(css).toContain("--jx-toast-warning: var(--jx-warm)");
        expect(css).toContain("--jx-toast-warning-soft: var(--jx-warm-soft)");

        for (const role of REQUIRED_TOAST_ROLES) {
            expect(css).toContain(`--juice-toast-${role}: var(--jx-toast-${role})`);
        }

        const closeBlocks = [...css.matchAll(/button\[toast-close\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(closeBlocks.length).toBeGreaterThan(0);
        for (const block of closeBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
        }
    });

    it("binds --juice-banner-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-banner-panel: var(--jx-surface)");
        expect(css).toContain("--jx-banner-panel-border: var(--jx-border)");
        expect(css).toContain("--jx-banner-ink: var(--jx-text)");
        expect(css).toContain("--jx-banner-close: var(--jx-surface)");
        expect(css).toContain("--jx-banner-close-color: var(--jx-heading)");
        expect(css).toContain("--jx-banner-close-hover: var(--jx-surface-muted)");
        expect(css).toContain("--jx-banner-focus-ring: var(--jx-accent)");
        expect(css).toContain("--jx-banner-success: var(--jx-accent)");
        expect(css).toContain("--jx-banner-success-soft: var(--jx-accent-soft)");
        expect(css).toContain("--jx-banner-error: var(--jx-page-deep)");
        expect(css).toContain("--jx-banner-error-soft: color-mix(in srgb, var(--jx-page-deep) 12%, var(--jx-surface))");
        expect(css).toContain("--jx-banner-info: var(--jx-accent-secondary)");
        expect(css).toContain("--jx-banner-info-soft: var(--jx-accent-tint)");
        expect(css).toContain("--jx-banner-warning: var(--jx-warm)");
        expect(css).toContain("--jx-banner-warning-soft: var(--jx-warm-soft)");
        expect(css).not.toContain("--jx-banner-panel-shadow");
        expect(css).not.toContain("--juice-banner-panel-shadow");

        for (const role of REQUIRED_BANNER_ROLES) {
            expect(css).toContain(`--juice-banner-${role}: var(--jx-banner-${role})`);
        }

        expect(css).toContain("border-left: 4px solid var(--juice-banner-success)");
        expect(css).toContain("[banner]:not([surfaceTone]):not([banner-tone])");
        expect(css).not.toMatch(/\[banner\]\[banner-tone=["']?success["']?\][^{]*\{[^}]*border-left-color/);

        const closeBlocks = [...css.matchAll(/button\[banner-close\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(closeBlocks.length).toBeGreaterThan(0);
        for (const block of closeBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
        }
    });

    it("binds --juice-popover-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-popover-panel: var(--jx-surface)");
        expect(css).toContain("--jx-popover-panel-border: var(--jx-border)");
        expect(css).toContain("--jx-popover-panel-shadow: var(--jx-shadow-strong)");
        expect(css).toContain("--jx-popover-ink: var(--jx-text)");
        expect(css).toContain("--jx-popover-close: var(--jx-surface)");
        expect(css).toContain("--jx-popover-close-color: var(--jx-heading)");
        expect(css).toContain("--jx-popover-close-hover: var(--jx-surface-muted)");
        expect(css).toContain("--jx-popover-focus-ring: var(--jx-accent)");

        for (const role of REQUIRED_POPOVER_ROLES) {
            expect(css).toContain(`--juice-popover-${role}: var(--jx-popover-${role})`);
        }

        const closeBlocks = [...css.matchAll(/button\[popover-close\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(closeBlocks.length).toBeGreaterThan(0);
        for (const block of closeBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
        }
    });

    it("binds --juice-tooltip-* from existing --jx-* surfaces", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-tooltip-panel: var(--jx-surface)");
        expect(css).toContain("--jx-tooltip-panel-border: var(--jx-border)");
        expect(css).toContain("--jx-tooltip-panel-shadow: var(--jx-shadow-strong)");
        expect(css).toContain("--jx-tooltip-ink: var(--jx-text)");

        for (const role of REQUIRED_TOOLTIP_ROLES) {
            expect(css).toContain(`--juice-tooltip-${role}: var(--jx-tooltip-${role})`);
        }

        expect(css).toContain("[tooltip-panel]:not([surfaceTone])");
        expect(css).not.toMatch(/\[tooltip\](?![-a-z])/);
        expect(css).not.toContain("[tooltip-close]");
    });

    it("binds --juice-combobox-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-combobox-input: var(--jx-surface)");
        expect(css).toContain("--jx-combobox-input-border: var(--jx-border)");
        expect(css).toContain("--jx-combobox-input-ink: var(--jx-text)");
        expect(css).toContain("--jx-combobox-list: var(--jx-surface)");
        expect(css).toContain("--jx-combobox-list-border: var(--jx-border)");
        expect(css).toContain("--jx-combobox-list-shadow: var(--jx-shadow-strong)");
        expect(css).toContain("--jx-combobox-option: transparent");
        expect(css).toContain("--jx-combobox-option-hover: var(--jx-surface-muted)");
        expect(css).toContain("--jx-combobox-option-selected: var(--jx-accent-tint)");
        expect(css).toContain("--jx-combobox-option-ink: var(--jx-text)");
        expect(css).toContain("--jx-combobox-trigger: transparent");
        expect(css).toContain("--jx-combobox-trigger-ink: var(--jx-heading)");
        expect(css).toContain("--jx-combobox-focus-ring: var(--jx-accent)");

        for (const role of REQUIRED_COMBOBOX_ROLES) {
            expect(css).toContain(`--juice-combobox-${role}: var(--jx-combobox-${role})`);
        }

        expect(css).toContain("[combobox-list]:not([surfaceTone])");
        expect(css).toContain("button[combobox-trigger]");
        expect(css).not.toMatch(/select\[combobox/);

        const triggerBlocks = [...css.matchAll(/button\[combobox-trigger\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(triggerBlocks.length).toBeGreaterThan(0);
        for (const block of triggerBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
        }
    });

    it("binds --juice-menu-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-menu-panel: var(--jx-surface)");
        expect(css).toContain("--jx-menu-panel-border: var(--jx-border)");
        expect(css).toContain("--jx-menu-panel-shadow: var(--jx-shadow-strong)");
        expect(css).toContain("--jx-menu-ink: var(--jx-text)");
        expect(css).toContain("--jx-menu-item: transparent");
        expect(css).toContain("--jx-menu-item-hover: var(--jx-surface-muted)");
        expect(css).toContain("--jx-menu-item-active: var(--jx-accent-tint)");
        expect(css).toContain("--jx-menu-separator: var(--jx-border)");
        expect(css).toContain("--jx-menu-focus-ring: var(--jx-accent)");
        expect(css).toContain("--jx-menu-opener: var(--jx-surface)");
        expect(css).toContain("--jx-menu-opener-ink: var(--jx-heading)");

        for (const role of REQUIRED_MENU_ROLES) {
            expect(css).toContain(`--juice-menu-${role}: var(--jx-menu-${role})`);
        }

        expect(css).toContain("[menu]:not([surfaceTone])");
        expect(css).toContain("button[menu-button]");
        expect(css).toContain("[menuitem=\"active\"]");
        expect(css).not.toMatch(/select\[menu/);
        expect(css).not.toMatch(/\[role=["']?menu["']?\]/);

        const openerBlocks = [...css.matchAll(/button\[menu-button\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(openerBlocks.length).toBeGreaterThan(0);
        for (const block of openerBlocks) {
            expect(block).not.toContain("--jx-cta-background");
            expect(block).not.toMatch(/background:\s*var\(--jx-accent\)/);
        }
    });

    it("binds --juice-wizard-* from existing --jx-* surfaces and accents", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--jx-wizard-shell: var(--jx-page)");
        expect(css).toContain("--jx-wizard-header: var(--jx-surface-strong)");
        expect(css).toContain("--jx-wizard-header-border: var(--jx-border)");
        expect(css).toContain("--jx-wizard-rail: var(--jx-surface-muted)");
        expect(css).toContain("--jx-wizard-rail-border: var(--jx-border)");
        expect(css).toContain("--jx-wizard-step: var(--jx-surface)");
        expect(css).toContain("--jx-wizard-step-border: var(--jx-border)");
        expect(css).toContain("--jx-wizard-step-ink: var(--jx-text-muted)");
        expect(css).toContain("--jx-wizard-step-current: var(--jx-accent)");
        expect(css).toContain("--jx-wizard-step-complete: var(--jx-accent-strong)");
        expect(css).toContain("--jx-wizard-step-on: var(--jx-text-inverse)");
        expect(css).toContain("--jx-wizard-step-connector: var(--jx-border)");
        expect(css).toContain("--jx-wizard-panel: var(--jx-surface)");
        expect(css).toContain("--jx-wizard-panel-border: var(--jx-border)");
        expect(css).toContain("--jx-wizard-focus-ring: var(--jx-accent)");

        for (const role of REQUIRED_WIZARD_ROLES) {
            expect(css).toContain(`--juice-wizard-${role}: var(--jx-wizard-${role})`);
        }
    });

    it("binds --juice-overlay-* from existing --jx-* tokens", () => {
        const css = buildThemeStylesheet(fixture, "test.yaml");

        expect(css).toContain("--juice-overlay-frost-wash: color-mix(in srgb, var(--jx-surface) 42%, transparent)");
        expect(css).toContain("--juice-overlay-frost-layer: linear-gradient(var(--juice-overlay-frost-wash), var(--juice-overlay-frost-wash))");
        expect(css).toContain("--juice-overlay-tint-wash: color-mix(in srgb, var(--jx-accent-tint) 36%, transparent)");
        expect(css).toContain("--juice-overlay-tint-layer: linear-gradient(var(--juice-overlay-tint-wash), var(--juice-overlay-tint-wash))");

        for (const overlay of OVERLAYS) {
            for (const role of OVERLAY_ROLES) {
                expect(css).toContain(`--juice-overlay-${overlay}-${role}:`);
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
