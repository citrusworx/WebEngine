import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
    BORDER_STRENGTH_ROLES,
    BORDER_STRENGTHS,
    OVERLAY_ROLES,
    OVERLAYS,
    SHADOW_TONE_ROLES,
    SHADOW_TONES,
    SHIPPED_LIBRARY_THEMES,
    SURFACE_TONE_ROLES,
    SURFACE_TONES,
} from "./juice.theme-contract.js";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), ".");
const TONES = SURFACE_TONES;
const SURFACE_ROLES = SURFACE_TONE_ROLES;
const THEMES = SHIPPED_LIBRARY_THEMES;

function readThemeScss(id: string) {
    return readFileSync(join(SRC_ROOT, "themes", id, `${id}.scss`), "utf-8");
}

describe("Surface tone role contract", () => {
    it("consumes shared --juice-surface-* roles from core surface SCSS", () => {
        const scss = readFileSync(join(SRC_ROOT, "styles/surface/surface.scss"), "utf-8");

        for (const tone of TONES) {
            expect(scss).toContain(`[surfaceTone="${tone}"]`);
            for (const role of SURFACE_ROLES) {
                expect(scss).toContain(`--juice-surface-${tone}-${role}`);
            }
        }

        expect(scss).toContain("var(--juice-surface-soft-bg,");
        expect(scss).toContain("rgba($white-100, 0.88)");
        expect(scss).toContain("[theme] [surfaceTone=\"soft\"]");
        expect(scss).toContain("[theme] [surfaceTone=\"strong\"]");
        expect(scss).toContain("[theme] [surfaceTone=\"muted\"]");
    });

    it("consumes shared --juice-border-strength-* roles without wiping surfaceTone paint", () => {
        const scss = readFileSync(join(SRC_ROOT, "styles/surface/surface.scss"), "utf-8");

        for (const strength of BORDER_STRENGTHS) {
            expect(scss).toContain(`[borderStrength="${strength}"]`);
            expect(scss).toContain(`[theme] [borderStrength="${strength}"]`);
            expect(scss).toContain(`[surfaceTone][borderStrength="${strength}"]`);
            expect(scss).toContain(`[theme] [surfaceTone][borderStrength="${strength}"]`);
            for (const role of BORDER_STRENGTH_ROLES) {
                expect(scss).toContain(`--juice-border-strength-${strength}-${role}`);
            }
        }

        expect(scss).toContain("var(--juice-border-strength-soft-width, 1px)");
        expect(scss).toContain("var(--juice-border-strength-bold-width, 2px)");
        expect(scss).toContain(":not([surfaceTone]):not([borderColor])");
        expect(scss).not.toMatch(/\[surfaceTone\]\[borderStrength="(?:soft|bold)"\][^{]*\{[^}]*background-color/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[borderStrength="(?:soft|bold)"\][^{]*\{[^}]*box-shadow/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[borderStrength="(?:soft|bold)"\][^{]*\{[^}]*backdrop-filter/);
    });

    it("consumes standalone blur sm/md without wiping surfaceTone paint", () => {
        const scss = readFileSync(join(SRC_ROOT, "styles/surface/surface.scss"), "utf-8");

        for (const length of ["sm", "md"] as const) {
            expect(scss).toContain(`[blur="${length}"]`);
            expect(scss).toContain(`[theme] [blur="${length}"]`);
            expect(scss).toContain(`[surfaceTone][blur="${length}"]`);
            expect(scss).toContain(`[theme] [surfaceTone][blur="${length}"]`);
        }

        expect(scss).toContain("var(--juice-blur-sm, 6px)");
        expect(scss).toContain("var(--juice-blur-md, 16px)");
        expect(scss).not.toMatch(/\[surfaceTone\]\[blur="(?:sm|md)"\][^{]*\{[^}]*background-color/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[blur="(?:sm|md)"\][^{]*\{[^}]*box-shadow/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[blur="(?:sm|md)"\][^{]*\{[^}]*border:/);
        expect(scss).toMatch(/\[surfaceTone\]\[blur="sm"\][^{]*\{[^}]*backdrop-filter/);
        expect(scss).toMatch(/\[surfaceTone\]\[blur="md"\][^{]*\{[^}]*backdrop-filter/);
    });

    it("consumes shared --juice-shadow-tone-* roles without wiping surfaceTone paint", () => {
        const scss = readFileSync(join(SRC_ROOT, "styles/surface/surface.scss"), "utf-8");

        for (const tone of SHADOW_TONES) {
            expect(scss).toContain(`[shadowTone="${tone}"]`);
            expect(scss).toContain(`[theme] [shadowTone="${tone}"]`);
            expect(scss).toContain(`[surfaceTone][shadowTone="${tone}"]`);
            expect(scss).toContain(`[theme] [surfaceTone][shadowTone="${tone}"]`);
            for (const role of SHADOW_TONE_ROLES) {
                expect(scss).toContain(`--juice-shadow-tone-${tone}-${role}`);
            }
        }

        expect(scss).toContain("var(--juice-shadow-tone-cool-color,");
        expect(scss).toContain("var(--juice-shadow-tone-warm-color,");
        expect(scss).toContain("var(--juice-shadow-tone-cool-shadow,");
        expect(scss).toContain("var(--juice-shadow-tone-warm-shadow,");
        expect(scss).toContain(":not([depth])");
        expect(scss).not.toMatch(/\[surfaceTone\]\[shadowTone="(?:cool|warm)"\][^{]*\{[^}]*background-color/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[shadowTone="(?:cool|warm)"\][^{]*\{[^}]*backdrop-filter/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[shadowTone="(?:cool|warm)"\][^{]*\{[^}]*border:/);
        expect(scss).toMatch(/\[surfaceTone\]\[shadowTone="cool"\][^{]*\{[^}]*box-shadow/);
        expect(scss).toMatch(/\[surfaceTone\]\[shadowTone="warm"\][^{]*\{[^}]*box-shadow/);
    });

    it("consumes shared --juice-overlay-* roles without wiping surfaceTone paint", () => {
        const scss = readFileSync(join(SRC_ROOT, "styles/surface/surface.scss"), "utf-8");

        for (const overlay of OVERLAYS) {
            expect(scss).toContain(`[overlay="${overlay}"]`);
            expect(scss).toContain(`[theme] [overlay="${overlay}"]`);
            expect(scss).toContain(`[surfaceTone][overlay="${overlay}"]`);
            expect(scss).toContain(`[theme] [surfaceTone][overlay="${overlay}"]`);
            for (const role of OVERLAY_ROLES) {
                expect(scss).toContain(`--juice-overlay-${overlay}-${role}`);
            }
        }

        expect(scss).toContain("var(--juice-overlay-frost-layer,");
        expect(scss).toContain("var(--juice-overlay-tint-layer,");
        expect(scss).toContain("background-image:");
        expect(scss).not.toMatch(/\[overlay="(?:frost|tint)"\][^{]*\{[^}]*background-color/);
        expect(scss).not.toMatch(/\[overlay="(?:frost|tint)"\][^{]*\{[^}]*\bbackground:/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[overlay="(?:frost|tint)"\][^{]*\{[^}]*background-color/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[overlay="(?:frost|tint)"\][^{]*\{[^}]*box-shadow/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[overlay="(?:frost|tint)"\][^{]*\{[^}]*backdrop-filter/);
        expect(scss).not.toMatch(/\[surfaceTone\]\[overlay="(?:frost|tint)"\][^{]*\{[^}]*border:/);
        expect(scss).toMatch(/\[surfaceTone\]\[overlay="frost"\][^{]*\{[^}]*background-image/);
        expect(scss).toMatch(/\[surfaceTone\]\[overlay="tint"\][^{]*\{[^}]*background-image/);
    });

    it("binds the same surface tone roles in aquaflux, kiwipress, citrusmint, and tide", () => {
        for (const { id } of THEMES) {
            const scss = readThemeScss(id);
            const rootBlock = scss.split(`[theme="${id}"]`)[1] ?? "";

            expect(rootBlock.length).toBeGreaterThan(0);

            for (const tone of TONES) {
                for (const role of SURFACE_ROLES) {
                    expect(scss).toContain(`--juice-surface-${tone}-${role}:`);
                }
            }

            for (const strength of BORDER_STRENGTHS) {
                for (const role of BORDER_STRENGTH_ROLES) {
                    expect(scss).toContain(`--juice-border-strength-${strength}-${role}:`);
                }
            }

            for (const tone of SHADOW_TONES) {
                for (const role of SHADOW_TONE_ROLES) {
                    expect(scss).toContain(`--juice-shadow-tone-${tone}-${role}:`);
                }
            }

            for (const overlay of OVERLAYS) {
                for (const role of OVERLAY_ROLES) {
                    expect(scss).toContain(`--juice-overlay-${overlay}-${role}:`);
                }
            }
        }
    });

    it("maps Aquaflux surface tones onto existing --aqua-surface tokens", () => {
        const scss = readThemeScss("aquaflux");

        expect(scss).toContain("--juice-surface-soft-bg: var(--aqua-surface)");
        expect(scss).toContain("--juice-surface-soft-border: var(--aqua-border)");
        expect(scss).toContain("--juice-surface-strong-bg: var(--aqua-surface-strong)");
        expect(scss).toContain("--juice-surface-strong-border: var(--aqua-border-strong)");
        expect(scss).toContain("--juice-surface-muted-bg: var(--aqua-surface-muted)");
        expect(scss).not.toContain("--juice-surface-soft-bg: #{rgba($white-100");
    });

    it("maps KiwiPress soft to the frosted --kw-surface-strong fill", () => {
        const scss = readThemeScss("kiwipress");

        expect(scss).toContain("--juice-surface-soft-bg: var(--kw-surface-strong)");
        expect(scss).toContain("--juice-surface-strong-bg: var(--kw-surface)");
        expect(scss).toContain("--juice-surface-strong-border: var(--kw-border-strong)");
        expect(scss).toContain("--juice-surface-muted-bg: var(--kw-surface-muted)");
    });

    it("maps Citrusmint tones onto the thinner --cm-* surface set", () => {
        const scss = readThemeScss("citrusmint");

        expect(scss).toContain("--juice-surface-soft-bg: color-mix(in srgb, var(--cm-surface) 88%, transparent)");
        expect(scss).toContain("--juice-surface-strong-bg: var(--cm-surface)");
        expect(scss).toContain("--juice-surface-muted-bg: var(--cm-surface-muted)");
        expect(scss).toContain("--juice-surface-soft-border: var(--cm-border)");
    });

    it("maps Tide tones onto dark --tide-surface tokens, not white frost", () => {
        const scss = readThemeScss("tide");

        expect(scss).toContain("--juice-surface-soft-bg: var(--tide-surface)");
        expect(scss).toContain("--juice-surface-strong-bg: var(--tide-surface-strong)");
        expect(scss).toContain("--juice-surface-muted-bg: var(--tide-surface-muted)");
        expect(scss).toContain("--juice-surface-soft-shadow: var(--tide-line-glow)");
        expect(scss).not.toContain("--juice-surface-soft-bg: #{rgba($white-100");
        expect(scss).not.toContain("--aqua-surface)");
    });

    it("maps borderStrength onto existing theme border tokens", () => {
        const aqua = readThemeScss("aquaflux");
        const kiwi = readThemeScss("kiwipress");
        const mint = readThemeScss("citrusmint");
        const tide = readThemeScss("tide");

        expect(aqua).toContain("--juice-border-strength-soft-color: var(--aqua-border)");
        expect(aqua).toContain("--juice-border-strength-bold-color: var(--aqua-border-strong)");
        expect(kiwi).toContain("--juice-border-strength-soft-color: var(--kw-border)");
        expect(kiwi).toContain("--juice-border-strength-bold-color: var(--kw-border-strong)");
        expect(mint).toContain("--juice-border-strength-soft-color: var(--cm-border)");
        expect(mint).toContain("--juice-border-strength-bold-color: color-mix(in srgb, var(--cm-heading) 22%, transparent)");
        expect(tide).toContain("--juice-border-strength-soft-color: var(--tide-border)");
        expect(tide).toContain("--juice-border-strength-bold-color: var(--tide-border-strong)");
        expect(tide).not.toContain("--juice-border-strength-bold-color: #{rgba($gray-400");
    });

    it("maps shadowTone onto existing theme tokens, not a light gray Tide drop", () => {
        const aqua = readThemeScss("aquaflux");
        const kiwi = readThemeScss("kiwipress");
        const mint = readThemeScss("citrusmint");
        const tide = readThemeScss("tide");

        expect(aqua).toContain("--juice-shadow-tone-cool-color: var(--aqua-shadow)");
        expect(aqua).toContain("--juice-shadow-tone-warm-color: color-mix(in srgb, var(--aqua-accent-strong) 16%, transparent)");
        expect(kiwi).toContain("--juice-shadow-tone-cool-color: color-mix(in srgb, var(--kw-tier-content) 18%, transparent)");
        expect(kiwi).toContain("--juice-shadow-tone-warm-color: color-mix(in srgb, var(--kw-warm) 18%, transparent)");
        expect(mint).toContain("--juice-shadow-tone-cool-color: #{rgba($wintergreen-900, 0.2)}");
        expect(mint).toContain("--juice-shadow-tone-warm-color: #{rgba($lime-800, 0.2)}");
        expect(tide).toContain("--juice-shadow-tone-cool-color: color-mix(in srgb, var(--tide-accent) 45%, var(--tide-shadow))");
        expect(tide).toContain("--juice-shadow-tone-cool-shadow: var(--tide-line-glow)");
        expect(tide).toContain("--juice-shadow-tone-warm-color: var(--tide-shadow)");
        expect(tide).not.toContain("--juice-shadow-tone-cool-color: #{rgba($blue-900");
        expect(tide).not.toContain("--juice-shadow-tone-warm-color: #{rgba($orange-800");
    });

    it("maps overlay onto existing theme tokens, not a white Tide wash", () => {
        const aqua = readThemeScss("aquaflux");
        const kiwi = readThemeScss("kiwipress");
        const mint = readThemeScss("citrusmint");
        const tide = readThemeScss("tide");

        expect(aqua).toContain("--juice-overlay-frost-wash: color-mix(in srgb, var(--aqua-page) 42%, transparent)");
        expect(aqua).toContain("--juice-overlay-tint-wash: color-mix(in srgb, var(--aqua-page-tint) 38%, transparent)");
        expect(kiwi).toContain("--juice-overlay-frost-wash: color-mix(in srgb, var(--kw-surface) 42%, transparent)");
        expect(kiwi).toContain("--juice-overlay-tint-wash: color-mix(in srgb, var(--kw-accent-tint) 40%, transparent)");
        expect(mint).toContain("--juice-overlay-frost-wash: color-mix(in srgb, var(--cm-surface) 42%, transparent)");
        expect(mint).toContain("--juice-overlay-tint-wash: color-mix(in srgb, var(--cm-surface-muted) 40%, transparent)");
        expect(tide).toContain("--juice-overlay-frost-wash: color-mix(in srgb, var(--tide-page) 48%, transparent)");
        expect(tide).toContain("--juice-overlay-tint-wash: color-mix(in srgb, var(--tide-page-tint) 32%, transparent)");
        expect(tide).not.toContain("--juice-overlay-frost-wash: #{rgba($white-100");
        expect(tide).not.toContain("--juice-overlay-tint-wash: #{rgba($blue-400");
    });
});
