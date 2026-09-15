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

test("function children stringify element values instead of mounting them", () => {
    const el = jsx("div", {
        children: () => document.createElement("span"),
    }) as HTMLDivElement;

    expect(el.childNodes).toHaveLength(1);
    expect(el.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(el.textContent).toBe("[object HTMLSpanElement]");
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
