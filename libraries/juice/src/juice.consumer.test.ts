// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DIST_DIR = join(process.cwd(), "dist");

describe("Juice consumer smoke", () => {
    it("exposes usable built tokens to consumers", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);

        expect(module.tokens.colors.families).toContain("black");
        expect(module.tokens.colors.black["900"]).toBe("hsl(0, 0%, 10%)");
        expect(module.tokens.colors.blue["500"]).toBe("hsl(210, 80%, 55%)");
        expect(module.tokens.typography.providers).toEqual(["adobe", "google"]);
    });

    it("lets a consumer mount and interact with the built Accordion export", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        const accordion = module.Accordion({
            name: "Billing FAQ",
            attributes: {}
        }) as HTMLElement;

        const button = accordion.querySelector("button");
        const panel = accordion.querySelector("div");

        expect(button?.getAttribute("aria-expanded")).toBe("false");
        expect(panel?.hasAttribute("hidden")).toBe(true);

        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(button?.getAttribute("aria-expanded")).toBe("true");
        expect(panel?.getAttribute("aria-hidden")).toBe("false");
        expect(panel?.hasAttribute("hidden")).toBe(false);
    });
});
