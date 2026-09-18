import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), ".");

const TONES = ["soft", "strong", "muted"] as const;
const SURFACE_ROLES = ["bg", "border", "shadow", "blur"] as const;

const THEMES = [
    { id: "aquaflux", prefix: "aqua" },
    { id: "kiwipress", prefix: "kw" },
    { id: "citrusmint", prefix: "cm" },
    { id: "tide", prefix: "tide" },
] as const;

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
        expect(scss).not.toContain('[blur="sm"]');
        expect(scss).not.toContain('[blur="md"]');
        expect(scss).not.toContain("[borderStrength");
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
});
