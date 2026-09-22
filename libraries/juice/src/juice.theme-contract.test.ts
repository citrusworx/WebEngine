import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildThemeStylesheet, type ThemeGeneratorConfig } from "./tools/theme-generator/index.js";
import {
    declaredCustomProperties,
    missingRequiredJuiceBinds,
    optionalAccordionBinds,
    optionalTabsBinds,
    requiredGeneratedJxJuiceBinds,
    requiredJuiceBinds,
    LIBRARY_THEMES_OMITTING_OPTIONAL_CHROME,
    SHIPPED_LIBRARY_THEMES,
    STANDALONE_BLUR_ROLES,
    SURFACE_VARIANTS,
    TIDE_OPTIONAL_TABS_ROLES,
} from "./juice.theme-contract.js";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), ".");
const DIST_THEMES = join(process.cwd(), "dist", "themes");

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

function readThemeScss(id: string) {
    return readFileSync(join(SRC_ROOT, "themes", id, `${id}.scss`), "utf-8");
}

function readThemeCss(id: string) {
    return readFileSync(join(DIST_THEMES, `${id}.css`), "utf-8");
}

function themeRootBlock(source: string, id: string) {
    return source.split(new RegExp(`\\[theme=["']?${id}["']?\\]`))[1] ?? "";
}

describe("Juice theme contract", () => {
    it("keeps optional hooks and standalone blur out of the required bind list", () => {
        const required = requiredJuiceBinds();

        expect(required.length).toBeGreaterThan(0);

        for (const name of [...optionalAccordionBinds(), ...optionalTabsBinds(), ...STANDALONE_BLUR_ROLES]) {
            expect(required).not.toContain(name);
        }
    });

    it.each(SHIPPED_LIBRARY_THEMES)(
        "$id source SCSS binds every required --juice-* role on [theme]",
        ({ id }) => {
            const scss = readThemeScss(id);
            const rootBlock = themeRootBlock(scss, id);

            expect(rootBlock.length).toBeGreaterThan(0);
            expect(missingRequiredJuiceBinds(rootBlock), `${id}.scss is missing required binds`).toEqual([]);
        }
    );

    it.each(SHIPPED_LIBRARY_THEMES)(
        "$id shipped CSS binds every required --juice-* role on [theme]",
        ({ id }) => {
            const css = readThemeCss(id);
            const rootBlock = themeRootBlock(css, id);

            expect(rootBlock.length).toBeGreaterThan(0);
            expect(missingRequiredJuiceBinds(css), `dist/themes/${id}.css is missing required binds`).toEqual([]);
            expect(missingRequiredJuiceBinds(rootBlock), `dist/themes/${id}.css [theme] is missing required binds`).toEqual(
                []
            );
        }
    );

    it("does not require optional accordion or tabs hooks on aquaflux, kiwipress, or citrusmint", () => {
        const optional = [...optionalAccordionBinds(), ...optionalTabsBinds()];

        for (const id of LIBRARY_THEMES_OMITTING_OPTIONAL_CHROME) {
            const declared = declaredCustomProperties(readThemeCss(id));
            const unexpected = optional.filter((name) => declared.has(name));

            expect(unexpected, `${id} unexpectedly bound optional hooks`).toEqual([]);
        }
    });

    it("does not require a per-theme standalone blur scale", () => {
        for (const { id } of SHIPPED_LIBRARY_THEMES) {
            const declared = declaredCustomProperties(readThemeCss(id));

            for (const name of STANDALONE_BLUR_ROLES) {
                expect(declared.has(name), `${id} must not bind standalone ${name}`).toBe(false);
            }
        }
    });

    it("does not require a --juice-variant-* bind family", () => {
        const required = requiredJuiceBinds();

        expect(SURFACE_VARIANTS).toEqual(["monochromatic", "glass", "tinted"]);

        for (const name of required) {
            expect(name.startsWith("--juice-variant-")).toBe(false);
        }

        for (const { id } of SHIPPED_LIBRARY_THEMES) {
            const declared = declaredCustomProperties(readThemeCss(id));
            const unexpected = [...declared].filter((name) => name.startsWith("--juice-variant-"));

            expect(unexpected, `${id} unexpectedly bound --juice-variant-*`).toEqual([]);
        }
    });

    it("lets Tide bind documented optional hooks without requiring tabs-panel-rule", () => {
        const declared = declaredCustomProperties(readThemeCss("tide"));

        for (const name of optionalAccordionBinds()) {
            expect(declared.has(name), `tide should bind optional ${name}`).toBe(true);
        }

        for (const role of TIDE_OPTIONAL_TABS_ROLES) {
            expect(declared.has(`--juice-tabs-${role}`)).toBe(true);
        }

        expect(declared.has("--juice-tabs-panel-rule")).toBe(false);
    });

    it("emits required --jx-* → --juice-* binds from the theme generator", () => {
        const css = buildThemeStylesheet(generatorFixture, "test.yaml");

        expect(missingRequiredJuiceBinds(css)).toEqual([]);

        for (const { juice, jx } of requiredGeneratedJxJuiceBinds()) {
            expect(css).toContain(`${juice}: var(${jx})`);
        }

        for (const name of [...optionalAccordionBinds(), ...optionalTabsBinds(), ...STANDALONE_BLUR_ROLES]) {
            expect(css).not.toContain(`${name}:`);
        }
    });
});
