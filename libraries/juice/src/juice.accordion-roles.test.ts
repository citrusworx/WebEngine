import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), ".");

const ACCORDION_ROLES = [
    "trigger",
    "trigger-hover",
    "trigger-open",
    "chevron",
    "panel-rule",
    "focus-ring",
] as const;

const THEMES = [
    { id: "aquaflux", prefix: "aqua" },
    { id: "kiwipress", prefix: "kw" },
    { id: "citrusmint", prefix: "cm" },
] as const;

function readThemeScss(id: string) {
    return readFileSync(join(SRC_ROOT, "themes", id, `${id}.scss`), "utf-8");
}

describe("Accordion theme role contract", () => {
    it("consumes shared --juice-accordion-* roles from component SCSS", () => {
        const scss = readFileSync(join(SRC_ROOT, "components/accordion/accordion.scss"), "utf-8");

        for (const role of ACCORDION_ROLES) {
            expect(scss).toContain(`-juice-accordion-role(${role}`);
        }

        expect(scss).toContain("--aqua-#{$name}");
        expect(scss).toContain("--kw-#{$name}");
        expect(scss).toContain("--cm-#{$name}");
        expect(scss).toContain("--jx-#{$name}");
        expect(scss).not.toContain("--aqua-button-background");
        expect(scss).not.toContain("--aqua-surface-strong");
        expect(scss).not.toContain("--kw-cta-background");
    });

    it("binds the same accordion roles in aquaflux, kiwipress, and citrusmint", () => {
        for (const { id, prefix } of THEMES) {
            const scss = readThemeScss(id);
            const rootBlock = scss.split(`[theme="${id}"]`)[1] ?? "";

            expect(rootBlock.length).toBeGreaterThan(0);

            for (const role of ACCORDION_ROLES) {
                expect(scss).toContain(`--${prefix}-${role}:`);
                expect(scss).toContain(`--juice-accordion-${role}: var(--${prefix}-${role})`);
            }

            expect(scss).toContain(`:where([accordion])`);
            expect(scss).toContain("button[accordion-item]");
        }
    });

    it("maps Aquaflux accordion roles onto existing surface tokens, not the CTA gradient", () => {
        const scss = readThemeScss("aquaflux");

        expect(scss).toContain("--aqua-trigger: var(--aqua-surface-strong)");
        expect(scss).toContain("--aqua-trigger-hover: var(--aqua-surface-muted)");
        expect(scss).toContain("--aqua-trigger-open: var(--aqua-highlight)");
        expect(scss).toContain("--aqua-chevron: var(--aqua-accent)");
        expect(scss).toContain("--aqua-panel-rule: var(--aqua-border)");
        expect(scss).toContain("--aqua-focus-ring: var(--aqua-accent)");

        const accordionItemBlocks = [...scss.matchAll(/button\[accordion-item\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(accordionItemBlocks.length).toBeGreaterThan(0);
        for (const block of accordionItemBlocks) {
            expect(block).not.toContain("--aqua-button-background");
        }
    });

    it("maps KiwiPress accordion roles onto --kw-* surfaces and accents", () => {
        const scss = readThemeScss("kiwipress");

        expect(scss).toContain("--kw-trigger: var(--kw-surface-strong)");
        expect(scss).toContain("--kw-trigger-hover: var(--kw-surface-muted)");
        expect(scss).toContain("--kw-trigger-open: var(--kw-accent-soft)");
        expect(scss).toContain("--kw-chevron: var(--kw-accent)");
        expect(scss).toContain("--kw-panel-rule: var(--kw-border)");
        expect(scss).toContain("--kw-focus-ring: var(--kw-accent)");

        const accordionItemBlocks = [...scss.matchAll(/button\[accordion-item\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(accordionItemBlocks.length).toBeGreaterThan(0);
        for (const block of accordionItemBlocks) {
            expect(block).not.toContain("--kw-cta-background");
        }
    });

    it("maps Citrusmint accordion roles onto the thinner --cm-* set", () => {
        const scss = readThemeScss("citrusmint");

        expect(scss).toContain("--cm-trigger: var(--cm-surface)");
        expect(scss).toContain("--cm-trigger-hover: var(--cm-surface-muted)");
        expect(scss).toContain("--cm-trigger-open: var(--cm-surface-muted)");
        expect(scss).toContain("--cm-chevron: var(--cm-heading)");
        expect(scss).toContain("--cm-panel-rule: var(--cm-border)");
        expect(scss).toContain("--cm-focus-ring: var(--cm-heading)");
    });
});
