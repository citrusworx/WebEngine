import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), ".");
const ICON_SCSS = join(SRC_ROOT, "styles/icons/icon.scss");
const STYLES_SCSS = join(SRC_ROOT, "styles/styles.scss");
const DIST_CSS = join(process.cwd(), "dist", "index.css");

const ICON_SIZE_STEPS = [
    { name: "xxs", px: "10px" },
    { name: "xs", px: "12px" },
    { name: "sm", px: "24px" },
    { name: "md", px: "36px" },
    { name: "lg", px: "48px" },
    { name: "xl", px: "60px" },
    { name: "xxl", px: "72px" },
] as const;

function stripComments(source: string) {
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("Icon authoring contract", () => {
    it("defaults [icon] to 1rem and ships every iconSize step", () => {
        const scss = readFileSync(ICON_SCSS, "utf-8");
        const code = stripComments(scss);

        expect(code).toMatch(/\[icon\]\s*\{[^}]*width:\s*1rem/);
        expect(code).toMatch(/\[icon\]\s*\{[^}]*height:\s*1rem/);
        expect(code).toMatch(/\[icon\]\s*\{[^}]*vertical-align:\s*middle/);
        expect(code).toContain("background-color: currentColor");

        for (const { name, px } of ICON_SIZE_STEPS) {
            expect(scss).toContain(`[iconSize="${name}"]`);
            expect(code).toMatch(new RegExp(`\\[iconSize="${name}"\\]\\s*\\{[^}]*width:\\s*${px}`));
            expect(code).toMatch(new RegExp(`\\[iconSize="${name}"\\]\\s*\\{[^}]*height:\\s*${px}`));
        }
    });

    it("does not remap [icon] size inside mobile media queries", () => {
        const scss = stripComments(readFileSync(ICON_SCSS, "utf-8"));

        expect(scss).not.toMatch(/@media[^{]+\{[^}]*\[icon\]/);
        expect(scss).not.toContain("MOBILE CONFIG");
        expect(scss).not.toContain("max-width: 600px");
        expect(scss).not.toContain("max-width: 768px");
    });

    it("loads icon rules before width and height so the escape hatch wins", () => {
        const styles = readFileSync(STYLES_SCSS, "utf-8");
        const iconAt = styles.indexOf("@use './icons/icon.scss'");
        const heightAt = styles.indexOf("@use './height/height.scss'");
        const widthAt = styles.indexOf("@use './width/width.scss'");

        expect(iconAt).toBeGreaterThan(-1);
        expect(heightAt).toBeGreaterThan(iconAt);
        expect(widthAt).toBeGreaterThan(iconAt);
    });
});

describe("Icon authoring contract artifacts", () => {
    it("keeps iconSize steps and the 1rem default in compiled CSS", () => {
        const css = readFileSync(DIST_CSS, "utf-8");

        expect(css).toMatch(/\[icon\]\s*\{[^}]*width:\s*1rem/);
        expect(css).toMatch(/\[icon\]\s*\{[^}]*height:\s*1rem/);

        for (const { name, px } of ICON_SIZE_STEPS) {
            expect(css).toMatch(new RegExp(`\\[iconSize=["']?${name}["']?\\]`));
            expect(css).toContain(`width: ${px}`);
        }
    });

    it("does not unconditionally clobber icon size in mobile media queries", () => {
        const css = readFileSync(DIST_CSS, "utf-8");

        expect(css).not.toMatch(/@media[^{]*max-width:\s*600px[^{]*\{[^@]*\[icon\][^{]*\{[^}]*(?:width|height)\s*:/);
        expect(css).not.toMatch(/@media[^{]*max-width:\s*768px[^{]*\{[^@]*\[icon\][^{]*\{[^}]*(?:width|height)\s*:/);
    });
});
