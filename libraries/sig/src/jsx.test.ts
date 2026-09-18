import "../jsdom-register.js";
import { test, expect } from "@playwright/test";
import { jsx, mount, disposeTree } from "./jsx-runtime.js";
import { Signal, effect } from "./signal.js";

test("function children update as reactive text", () => {
    const count = Signal(0);
    const el = jsx("div", {
        children: () => String(count.get()),
    }) as HTMLDivElement;

    document.body.replaceChildren(el);
    expect(el.textContent).toBe("0");

    count.set(7);
    expect(el.textContent).toBe("7");
});

test("disposeTree stops function-child text effects", () => {
    const count = Signal(0);
    const el = jsx("div", {
        children: () => String(count.get()),
    }) as HTMLDivElement;

    expect(el.textContent).toBe("0");

    disposeTree(el);
    count.set(7);
    expect(el.textContent).toBe("0");
});

test("function children stringify element values instead of mounting them", () => {
    const el = jsx("div", {
        children: () => document.createElement("span"),
    }) as HTMLDivElement;

    expect(el.childNodes).toHaveLength(1);
    expect(el.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(el.textContent).toBe("[object HTMLSpanElement]");
});

test("function-valued className updates when the signal changes", () => {
    const on = Signal(false);
    const el = jsx("div", {
        className: () => (on.get() ? "on" : "off"),
    }) as HTMLDivElement;

    expect(el.className).toBe("off");

    on.set(true);
    expect(el.className).toBe("on");
});

test("function-valued class updates the class attribute", () => {
    const tone = Signal("muted");
    const el = jsx("section", {
        class: () => tone.get(),
    }) as HTMLElement;

    expect(el.getAttribute("class")).toBe("muted");
    expect(el.className).toBe("muted");

    tone.set("loud");
    expect(el.className).toBe("loud");
});

test("function-valued value updates an input", () => {
    const name = Signal("Ada");
    const el = jsx("input", {
        value: () => name.get(),
    }) as HTMLInputElement;

    expect(el.value).toBe("Ada");

    name.set("Lovelace");
    expect(el.value).toBe("Lovelace");
});

test("function-valued checked updates a boolean property", () => {
    const on = Signal(false);
    const el = jsx("input", {
        type: "checkbox",
        checked: () => on.get(),
    }) as HTMLInputElement;

    expect(el.checked).toBe(false);

    on.set(true);
    expect(el.checked).toBe(true);
});

test("function-valued hidden updates a boolean property", () => {
    const open = Signal(true);
    const el = jsx("div", {
        hidden: () => !open.get(),
    }) as HTMLDivElement;

    expect(el.hidden).toBe(false);

    open.set(false);
    expect(el.hidden).toBe(true);
});

test("static props stay assign-once", () => {
    const el = jsx("div", { className: "card" }) as HTMLDivElement;
    expect(el.className).toBe("card");
});

test("unknown Juice-style attributes survive setProp via setAttribute", () => {
    const el = jsx("section", {
        stack: true,
        gap: "2rem",
        card: true,
        padding: "1.25rem",
    }) as HTMLElement;

    expect(el.getAttribute("stack")).toBe("");
    expect(el.getAttribute("card")).toBe("");
    expect(el.getAttribute("gap")).toBe("2rem");
    expect(el.getAttribute("padding")).toBe("1.25rem");
    expect((el as any).stack).toBeUndefined();
    expect((el as any).gap).toBeUndefined();
});

test("function-valued Juice-style attributes update via setAttribute", () => {
    const gap = Signal("1rem");
    const dense = Signal(false);
    const el = jsx("section", {
        stack: true,
        gap: () => gap.get(),
        padding: () => (dense.get() ? "0.5rem" : "1.25rem"),
    }) as HTMLElement;

    expect(el.getAttribute("stack")).toBe("");
    expect(el.getAttribute("gap")).toBe("1rem");
    expect(el.getAttribute("padding")).toBe("1.25rem");

    gap.set("2rem");
    dense.set(true);
    expect(el.getAttribute("gap")).toBe("2rem");
    expect(el.getAttribute("padding")).toBe("0.5rem");
});

test("on* functions are listeners, not reactive getters", () => {
    let clicks = 0;
    const el = jsx("button", {
        onClick: () => {
            clicks++;
        },
    }) as HTMLButtonElement;

    expect(clicks).toBe(0);
    el.click();
    expect(clicks).toBe(1);
});

test("ref plus effect remains a supported live-attribute pattern", () => {
    const ready = Signal(false);
    const el = jsx("button", {
        ref: (button: HTMLButtonElement) => {
            effect(() => {
                button.disabled = !ready.get();
            });
        },
    }) as HTMLButtonElement;

    expect(el.disabled).toBe(true);
    ready.set(true);
    expect(el.disabled).toBe(false);
});

test("disposeTree stops reactive prop effects", () => {
    const on = Signal(false);
    const el = jsx("div", {
        className: () => (on.get() ? "on" : "off"),
    }) as HTMLDivElement;

    expect(el.className).toBe("off");

    disposeTree(el);
    on.set(true);
    expect(el.className).toBe("off");
});

test("mount replaces the target and disposeTree stops component effects", () => {
    const target = document.createElement("div");
    document.body.replaceChildren(target);

    const count = Signal(0);
    let runCount = 0;

    function Counter() {
        effect(() => {
            count.get();
            runCount++;
        });

        return jsx("p", { children: "counter" });
    }

    const node = jsx(Counter, {});
    mount(node, target);

    expect(target.textContent).toBe("counter");
    expect(runCount).toBe(1);

    count.set(1);
    expect(runCount).toBe(2);

    disposeTree(node);
    count.set(2);
    expect(runCount).toBe(2);
});
