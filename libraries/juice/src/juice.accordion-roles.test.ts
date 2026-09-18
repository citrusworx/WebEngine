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

const OPTIONAL_ACCORDION_ROLES = [
    "item-border",
    "item-border-open",
    "trigger-accent",
    "panel",
    "open-glow",
] as const;

const THEMES = [
    { id: "aquaflux", prefix: "aqua" },
    { id: "kiwipress", prefix: "kw" },
    { id: "citrusmint", prefix: "cm" },
    { id: "tide", prefix: "tide" },
] as const;

const THEMES_WITHOUT_OPTIONAL_CHROME = THEMES.filter((theme) => theme.id !== "tide");

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
        expect(scss).toContain("--tide-#{$name}");
        expect(scss).toContain("--jx-#{$name}");
        expect(scss).not.toContain("--aqua-button-background");
        expect(scss).not.toContain("--aqua-surface-strong");
        expect(scss).not.toContain("--kw-cta-background");
    });

    it("exposes optional FAQ chrome hooks with no-op fallbacks", () => {
        const scss = readFileSync(join(SRC_ROOT, "components/accordion/accordion.scss"), "utf-8");

        for (const role of OPTIONAL_ACCORDION_ROLES) {
            expect(scss).toContain(`-juice-accordion-role(${role}`);
        }

        expect(scss).toContain("item-border, transparent");
        expect(scss).toContain("trigger-accent, transparent");
        expect(scss).toContain("panel, transparent");
        expect(scss).toContain("[accordion-item][aria-expanded=\"true\"]::before");
        expect(scss).toContain("[accordion]:has(> [accordion-item][aria-expanded=\"true\"])");
        expect(scss).toContain("--juice-accordion-chevron-size");
        expect(scss).toContain("--juice-accordion-chevron-weight");
        expect(scss).toContain("rotate(-45deg)");
        expect(scss).toContain("rotate(45deg)");
    });

    it("binds the same accordion roles in aquaflux, kiwipress, citrusmint, and tide", () => {
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

    it("binds tide accordion roles onto --tide-* surfaces, not the CTA gradient", () => {
        const scss = readThemeScss("tide");
        const rootBlock = scss.split(`[theme="tide"]`)[1] ?? "";

        expect(rootBlock.length).toBeGreaterThan(0);

        for (const role of ACCORDION_ROLES) {
            expect(scss).toContain(`--tide-${role}:`);
            expect(scss).toContain(`--juice-accordion-${role}: var(--tide-${role})`);
        }

        expect(scss).toContain("--tide-measure: #{$_tide-measure}");
        expect(scss).toContain("$_tide-measure: 45rem");
        expect(scss).toContain("--tide-trigger-hover: var(--tide-surface-muted)");
        expect(scss).toContain("--tide-chevron: var(--tide-accent)");
        expect(scss).toContain("--tide-panel-rule: transparent");
        expect(scss).toContain("--tide-focus-ring: var(--tide-accent)");
        expect(scss).toContain("--tide-item-border: var(--tide-border)");
        expect(scss).toContain("--tide-item-border-open: var(--tide-border)");
        expect(scss).toContain("--tide-trigger-accent: var(--tide-accent)");
        expect(scss).toContain("$lagoon-400");
        expect(scss).toContain("$lagoon-500");
        expect(scss).not.toContain("--tide-accent: #{$teal-500}");
        expect(scss).not.toContain("--tide-border: #{color.change($teal-400");
        expect(scss).toContain("--juice-accordion-item-border: var(--tide-item-border)");
        expect(scss).toContain("--juice-accordion-trigger-accent: var(--tide-trigger-accent)");
        expect(scss).toContain("--juice-accordion-panel: var(--tide-panel-well)");
        expect(scss).toContain("--juice-accordion-open-glow: var(--tide-open-glow)");
        expect(scss).toContain("--juice-accordion-chevron-size:");
        expect(scss).toContain("--juice-accordion-chevron-weight:");
        expect(scss).toContain(`:where([accordion])`);
        expect(scss).toContain("button[accordion-item]");
        expect(scss).toContain("[accordion]:has(> [accordion-item][aria-expanded=\"true\"])");
        expect(scss).not.toContain("--tide-trigger-open: var(--tide-highlight)");
        expect(scss).toMatch(/--tide-trigger-open:\s*#\{\$_tide-open-wash\}/);
        expect(scss).toContain("--tide-page: #{$black-900}");
        expect(scss).not.toContain("--aqua-accent");
        expect(scss).not.toContain("$blue-500");
        expect(scss).toContain(':where(section, article, aside, nav, header, footer, form)');
        expect(scss).toContain(':where(main > header)');
        expect(scss).toContain(':where(button, input, textarea, select)');
        expect(scss).toContain(':where(button:hover, button:focus-visible)');
        expect(scss).toContain(':where(nav[type="bar"], nav[type="sidebar"])');
        expect(scss).toContain(':where(a:hover, a:focus-visible)');
        expect(scss).toContain(':where(code, pre)');

        const regionBlock = scss.match(/\[accordion\] \[role="region"\]\s*\{[^}]+\}/)?.[0] ?? "";
        expect(regionBlock).toContain("var(--juice-accordion-panel)");
        expect(regionBlock).not.toContain("var(--juice-accordion-panel-rule)");

        const accordionItemBlocks = [...scss.matchAll(/button\[accordion-item\][^{]*\{[^}]+\}/g)].map(
            (match) => match[0]
        );

        expect(accordionItemBlocks.length).toBeGreaterThan(0);
        for (const block of accordionItemBlocks) {
            expect(block).not.toContain("--tide-button-background");
        }
    });

    it("leaves optional FAQ chrome roles unbound in Aquaflux, KiwiPress, and Citrusmint", () => {
        for (const { id, prefix } of THEMES_WITHOUT_OPTIONAL_CHROME) {
            const scss = readThemeScss(id);

            expect(scss).not.toContain(`--${prefix}-item-border:`);
            expect(scss).not.toContain(`--${prefix}-trigger-accent:`);
            expect(scss).not.toContain(`--${prefix}-open-glow:`);
            expect(scss).not.toContain("--juice-accordion-item-border:");
            expect(scss).not.toContain("--juice-accordion-trigger-accent:");
            expect(scss).not.toContain("--juice-accordion-open-glow:");
        }
    });

    it("keeps the tide-faq sketch FAQ-focused without a primary billing CTA", () => {
        const html = readFileSync(join(SRC_ROOT, "templates/html/tide-faq/index.html"), "utf-8");

        expect(html).toContain('theme="tide"');
        expect(html).toContain("dist/themes/tide.css");
        expect(html).not.toContain("_draft");
        expect(html).toContain('stack centered');
        expect(html).toContain("Billing &amp; account FAQ");
        expect(html).toContain("hero-eyebrow");
        expect(html).toContain("tide-card");
        expect(html).toContain('accordion-item');
        expect(html).not.toContain("Update payment method");
        expect(html).not.toMatch(/<button(?![^>]*accordion-item)[^>]*>/);
    });
});
