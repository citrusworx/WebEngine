import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), ".");

const TABS_ROLES = [
    "trigger",
    "trigger-hover",
    "trigger-active",
    "text",
    "text-hover",
    "text-active",
    "indicator",
    "list-rule",
    "focus-ring",
] as const;

const OPTIONAL_TABS_ROLES = ["panel", "panel-rule"] as const;

function readThemeScss(id: string) {
    return readFileSync(join(SRC_ROOT, "themes", id, `${id}.scss`), "utf-8");
}

describe("Tabs theme role contract", () => {
    it("consumes shared --juice-tabs-* roles from component SCSS", () => {
        const scss = readFileSync(join(SRC_ROOT, "components/tabs/tabs.scss"), "utf-8");

        for (const role of TABS_ROLES) {
            expect(scss).toContain(`-juice-tabs-role(${role}`);
        }

        expect(scss).toContain("--aqua-tabs-#{$name}");
        expect(scss).toContain("--kw-tabs-#{$name}");
        expect(scss).toContain("--cm-tabs-#{$name}");
        expect(scss).toContain("--jx-tabs-#{$name}");
        expect(scss).not.toContain("--aqua-button-background");
        expect(scss).not.toContain("--kw-cta-background");
        expect(scss).not.toMatch(/^\s*content:\s*["']active["']/m);
        expect(scss).not.toMatch(/^\s*content:\s*["']hidden["']/m);
        expect(scss).not.toMatch(/\[content=["'](?:active|hidden)["']\]/);
    });

    it("exposes optional panel hooks with no-op fallbacks", () => {
        const scss = readFileSync(join(SRC_ROOT, "components/tabs/tabs.scss"), "utf-8");

        for (const role of OPTIONAL_TABS_ROLES) {
            expect(scss).toContain(`-juice-tabs-role(${role}`);
        }

        expect(scss).toContain("panel, transparent");
        expect(scss).toContain("panel-rule, transparent");
        expect(scss).toContain("[tab-panel]");
    });

    it("treats [tabs] as a column widget and keeps strip chrome on the list", () => {
        const scss = readFileSync(join(SRC_ROOT, "components/tabs/tabs.scss"), "utf-8");

        expect(scss).toContain("[tabs]");
        expect(scss).toContain("flex-direction: column");
        expect(scss).toContain("[tabs-list]");
        expect(scss).toContain("[tabs]:not(:has([tabs-list], [tab-panel]))");
        expect(scss).toContain("[tabs] > button");
        expect(scss).toContain("[tab][active]");
        expect(scss).toContain('[tab][aria-selected="true"]');
        expect(scss).toContain('[aria-selected="true"]');
    });

    it("keeps KiwiPress tab paint in parity with [active] and aria-selected", () => {
        const scss = readThemeScss("kiwipress");

        expect(scss).toContain("[tabs-list]");
        expect(scss).toContain("[tab-panel]");
        expect(scss).toContain('[aria-selected="true"]');
        expect(scss).toContain("[tab][active]");
        expect(scss).toContain("border-bottom-color: var(--kw-accent)");
        expect(scss).not.toContain('content: "active"');
        expect(scss).not.toContain('content: "hidden"');
    });
});
