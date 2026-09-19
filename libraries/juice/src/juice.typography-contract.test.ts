import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildThemeStylesheet, type ThemeGeneratorConfig } from "./tools/theme-generator/index.js";
import { SHIPPED_LIBRARY_THEMES } from "./juice.theme-contract.js";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), ".");
const DIST_DIR = join(process.cwd(), "dist");
const DIST_CSS = join(DIST_DIR, "index.css");
const DIST_THEMES = join(DIST_DIR, "themes");

const GOOGLE_SCSS = join(SRC_ROOT, "styles/fonts/google.scss");
const ADOBE_SCSS = join(SRC_ROOT, "styles/fonts/adobe.scss");
const TYPOGRAPHY_SCSS = join(SRC_ROOT, "core/typography.scss");
const GRAY_TEXT_SCSS = join(SRC_ROOT, "styles/color/gray/gray/text.scss");

const AUTHOR_FACES = ["lato", "oswald", "source-code-pro", "korolev-rounded"] as const;
const AUTHOR_COLORS = ["gray-700", "obsidian-900", "white-100"] as const;

const generatorFixture: ThemeGeneratorConfig = {
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

function stripComments(source: string) {
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/** Attribute/class/id counts only. `:where()` arguments add nothing. */
function simpleSpecificity(selector: string): [number, number, number] {
    const withoutWhere = selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, "");
    const ids = withoutWhere.match(/#[\w-]+/g)?.length ?? 0;
    const attrs = withoutWhere.match(/\[[^\]]+\]/g)?.length ?? 0;
    const rest = withoutWhere
        .replace(/\[[^\]]+\]/g, " ")
        .replace(/[.#:][\w-]+/g, " ");
    const types = rest.split(/[\s>+~]+/).filter((part) => part && part !== "*").length;
    return [ids, attrs, types];
}

function compareSpecificity(left: [number, number, number], right: [number, number, number]) {
    for (let i = 0; i < 3; i += 1) {
        if (left[i] !== right[i]) {
            return left[i] - right[i];
        }
    }
    return 0;
}

function readThemeCss(id: string) {
    return readFileSync(join(DIST_THEMES, `${id}.css`), "utf-8");
}

function headingRule(css: string, id: string) {
    const match = css.match(new RegExp(`\\[theme=["']?${id}["']?\\]\\s*:where\\(h1[^)]*\\)\\s*\\{[^}]+\\}`));
    return match?.[0] ?? "";
}

function bodyRule(css: string, id: string) {
    const match = css.match(new RegExp(`\\[theme=["']?${id}["']?\\]\\s*:where\\(p[^)]*\\)\\s*\\{[^}]+\\}`));
    return match?.[0] ?? "";
}

describe("Typography authoring contract", () => {
    it("pairs font / fontColor / fontWeight / lineHeight with [theme] so author attrs beat theme defaults", () => {
        const typography = stripComments(readFileSync(TYPOGRAPHY_SCSS, "utf-8"));
        const google = stripComments(readFileSync(GOOGLE_SCSS, "utf-8"));
        const adobe = stripComments(readFileSync(ADOBE_SCSS, "utf-8"));
        const gray = stripComments(readFileSync(GRAY_TEXT_SCSS, "utf-8"));

        expect(google).toContain('[font="lato"]');
        expect(google).toContain('[theme] [font="lato"]');
        expect(google).toContain('[theme] [font="oswald"]');
        expect(adobe).toContain('[theme] [font="korolev-rounded"]');
        expect(gray).toContain('[theme] [fontColor="gray-700"]');
        expect(typography).toContain('[theme] [fontWeight="#{$i}00"]');
        expect(typography).toContain('[theme] [lineHeight="#{$i}rem"]');
    });

    it("does not add an xs / 1rem fontSize step", () => {
        const typography = readFileSync(TYPOGRAPHY_SCSS, "utf-8");

        expect(typography).toContain('[fontSize="sm"]');
        expect(typography).toContain("$text--sm: 0.75rem");
        expect(typography).toContain("$text--md: 1.25rem");
        expect(typography).not.toContain('[fontSize="xs"]');
        expect(typography).not.toContain('[fontSize="xxs"]');
        expect(typography).not.toContain('[fontSize="1rem"]');
        expect(typography).not.toContain("$text--xs");
    });

    it("keeps theme semantic heading and body rules so omitted attrs still use the theme pair", () => {
        for (const { id } of SHIPPED_LIBRARY_THEMES) {
            const scss = readFileSync(join(SRC_ROOT, "themes", id, `${id}.scss`), "utf-8");

            expect(scss).toContain(`[theme="${id}"] :where(h1, h2, h3, h4, h5, h6)`);
            expect(scss).toMatch(new RegExp(`\\[theme="${id}"\\] :where\\(p,`));
            expect(scss).toContain("heading-font");
            expect(scss).toContain("body-font");
            expect(scss).not.toContain(":not([font])");
            expect(scss).not.toContain(":not([fontColor])");
        }
    });
});

describe("Typography authoring contract cascade", () => {
    it("makes [theme] [font=] more specific than shipped [theme] :where(h1) / :where(p) rules", () => {
        const authorFace = simpleSpecificity('[theme] [font="lato"]');
        const authorColor = simpleSpecificity('[theme] [fontColor="gray-700"]');
        const authorWeight = simpleSpecificity('[theme] [fontWeight="400"]');
        const authorLeading = simpleSpecificity('[theme] [lineHeight="2rem"]');

        expect(authorFace).toEqual([0, 2, 0]);
        expect(authorColor).toEqual([0, 2, 0]);
        expect(authorWeight).toEqual([0, 2, 0]);
        expect(authorLeading).toEqual([0, 2, 0]);

        for (const { id } of SHIPPED_LIBRARY_THEMES) {
            const heading = simpleSpecificity(`[theme="${id}"] :where(h1, h2, h3, h4, h5, h6)`);
            const body = simpleSpecificity(`[theme="${id}"] :where(p, span, li, label)`);

            expect(heading).toEqual([0, 1, 0]);
            expect(body).toEqual([0, 1, 0]);
            expect(compareSpecificity(authorFace, heading)).toBeGreaterThan(0);
            expect(compareSpecificity(authorColor, heading)).toBeGreaterThan(0);
            expect(compareSpecificity(authorWeight, heading)).toBeGreaterThan(0);
            expect(compareSpecificity(authorLeading, heading)).toBeGreaterThan(0);
            expect(compareSpecificity(authorFace, body)).toBeGreaterThan(0);
        }
    });

    it("covers generated app themes the same way — core [theme] [attr] beats :where(h1)", () => {
        const css = buildThemeStylesheet(generatorFixture, "test.yaml");
        const heading = headingRule(css, "apptheme");
        const body = bodyRule(css, "apptheme");

        expect(heading).toContain("font-family: var(--jx-heading-font)");
        expect(body).toContain("font-family: var(--jx-body-font)");
        expect(heading).not.toContain(":not([font])");

        const generatedHeading = simpleSpecificity(`[theme="${generatorFixture.id}"] :where(h1, h2, h3, h4, h5, h6)`);
        expect(compareSpecificity(simpleSpecificity('[theme] [font="lato"]'), generatedHeading)).toBeGreaterThan(0);
    });
});

describe("Typography authoring contract artifacts", () => {
    it("emits [theme] companions for author type attrs in compiled core CSS", () => {
        const css = readFileSync(DIST_CSS, "utf-8");

        for (const face of AUTHOR_FACES) {
            expect(css).toMatch(new RegExp(`\\[font=["']?${face}["']?\\]`));
            expect(css).toMatch(new RegExp(`\\[theme\\]\\s+\\[font=["']?${face}["']?\\]`));
        }

        for (const color of AUTHOR_COLORS) {
            expect(css).toMatch(new RegExp(`\\[fontColor=["']?${color}["']?\\]`));
            expect(css).toMatch(new RegExp(`\\[theme\\]\\s+\\[fontColor=["']?${color}["']?\\]`));
        }

        expect(css).toMatch(/\[theme\]\s+\[fontWeight=["']?400["']?\]/);
        expect(css).toMatch(/\[theme\]\s+\[lineHeight=["']?2rem["']?\]/);
        expect(css).not.toMatch(/\[fontSize=["']?xs["']?\]/);
        expect(css).not.toMatch(/\[fontSize=["']?1rem["']?\]/);
    });

    it("keeps themed h1 / p defaults in every shipped theme stylesheet", () => {
        for (const { id, prefix } of SHIPPED_LIBRARY_THEMES) {
            const css = readThemeCss(id);
            const heading = headingRule(css, id);
            const body = bodyRule(css, id);

            expect(heading.length, `${id} heading rule`).toBeGreaterThan(0);
            expect(body.length, `${id} body rule`).toBeGreaterThan(0);
            expect(heading).toContain(`font-family: var(--${prefix}-heading-font)`);
            expect(body).toContain(`font-family: var(--${prefix}-body-font)`);
            expect(heading).toMatch(/color:\s*var\(--\w+-heading\)/);
            expect(heading).not.toContain("[font]");
            expect(body).not.toContain("[font]");
        }
    });
});
