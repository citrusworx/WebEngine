// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Accordion } from "./accordion.js";
import { stopAccordionRuntime } from "../../js/src/accordion/accordion-runtime.js";

beforeEach(() => {
    stopAccordionRuntime();
});

afterEach(() => {
    stopAccordionRuntime();
});

describe("Accordion", () => {
    it("wires button and panel state accessibly when collapsed by default", () => {
        const accordion = Accordion({
            name: "FAQ Item",
            attributes: {}
        });

        const button = accordion.querySelector("button");
        const panel = accordion.querySelector("div");

        expect(button?.getAttribute("aria-controls")).toBe("faq-item-panel");
        expect(button?.getAttribute("aria-expanded")).toBe("false");
        expect(button?.id).toBe("faq-item-trigger");
        expect(panel?.id).toBe("faq-item-panel");
        expect(panel?.getAttribute("role")).toBe("region");
        expect(panel?.getAttribute("aria-labelledby")).toBe("faq-item-trigger");
        expect(panel?.getAttribute("aria-hidden")).toBe("true");
        expect(panel?.hasAttribute("hidden")).toBe(true);
        expect(panel?.getAttribute("content")).toBeNull();
    });

    it("emits markup and initial state without a private click handler", () => {
        const accordion = Accordion({
            name: "FAQ Item",
            title: "Read more",
            attributes: {}
        });

        const button = accordion.querySelector("button");
        const panel = accordion.querySelector("div");

        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(button?.getAttribute("aria-expanded")).toBe("false");
        expect(panel?.getAttribute("aria-hidden")).toBe("true");
        expect(panel?.hasAttribute("hidden")).toBe(true);
        expect(panel?.getAttribute("content")).toBeNull();
    });

    it("honors defaultExpanded for the initial open state", () => {
        const accordion = Accordion({
            name: "FAQ Item",
            defaultExpanded: true,
            attributes: {}
        });

        const button = accordion.querySelector("button");
        const panel = accordion.querySelector("div");

        expect(button?.getAttribute("aria-expanded")).toBe("true");
        expect(panel?.hasAttribute("hidden")).toBe(false);
        expect(panel?.getAttribute("aria-hidden")).toBe("false");
        expect(panel?.getAttribute("content")).toBeNull();
    });
});
