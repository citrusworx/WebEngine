import "../jsdom-register.js";
import { test, expect } from "@playwright/test";
import { effect } from "./signal.js";
import { disposeTree, jsx } from "./jsx-runtime.js";
import { bind, type JuiceBinding, type JuiceRuntimeState } from "./juice.js";
import {
    startCheckboxRuntime,
    startDisclosureRuntime,
    startModalRuntime,
    startSwitchRuntime,
    stopCheckboxRuntime,
    stopDisclosureRuntime,
    stopInputRuntime,
    stopModalRuntime,
    stopSelectRuntime,
    stopSwitchRuntime,
    stopTextareaRuntime,
} from "@citrusworx/juiceui";

const bindings: Array<{ dispose: () => void }> = [];

const track = <T>(binding: JuiceBinding<T>) => {
    bindings.push(binding);
    return binding;
};

const watch = (signal: { get: () => unknown }) => {
    let count = 0;
    const stop = effect(() => {
        signal.get();
        count += 1;
    });
    return {
        get count() {
            return count;
        },
        stop,
    };
};

const stopRuntimes = () => {
    stopSwitchRuntime();
    stopCheckboxRuntime();
    stopDisclosureRuntime();
    stopModalRuntime();
    stopInputRuntime();
    stopSelectRuntime();
    stopTextareaRuntime();
};

test.afterEach(() => {
    for (const binding of bindings) binding.dispose();
    bindings.length = 0;
    document.body.innerHTML = "";
    stopRuntimes();
});

test("seeds the signal from getState", () => {
    document.body.innerHTML =
        '<button switch aria-label="Notifications" aria-checked="true"></button>';
    const host = document.querySelector("button");
    if (!(host instanceof HTMLButtonElement)) throw new Error("missing host");

    const binding = track(bind(host));

    expect(binding.state.get()).toEqual({ checked: true });
});

test("updates when the runtime dispatches a real change", () => {
    document.body.innerHTML = '<button switch aria-label="Notifications"></button>';
    const host = document.querySelector("button");
    if (!(host instanceof HTMLButtonElement)) throw new Error("missing host");

    const binding = track(bind(host, "switch"));
    const seen = watch(binding.state);

    host.click();

    expect(binding.state.get()).toEqual({ checked: true });
    expect(seen.count).toBe(2);
    seen.stop();
});

test("does not update when the runtime write is a no-op", () => {
    document.body.innerHTML =
        '<button switch aria-label="Notifications" aria-checked="false"></button>';
    const host = document.querySelector("button");
    if (!(host instanceof HTMLButtonElement)) throw new Error("missing host");

    const binding = track(bind(host, "switch"));
    const seen = watch(binding.state);

    startSwitchRuntime()?.setChecked(false, host);

    expect(binding.state.get()).toEqual({ checked: false });
    expect(seen.count).toBe(1);
    seen.stop();
});

test("does not notify when the signal is set to the same state", () => {
    document.body.innerHTML =
        '<button switch aria-label="Notifications" aria-checked="true"></button>';
    const host = document.querySelector("button");
    if (!(host instanceof HTMLButtonElement)) throw new Error("missing host");

    const binding = track(bind(host, "switch"));
    const seen = watch(binding.state);

    binding.state.set({ checked: true });

    expect(seen.count).toBe(1);
    expect(host.getAttribute("aria-checked")).toBe("true");
    seen.stop();
});

test("ignores a juice:change that repeats the current state", () => {
    document.body.innerHTML =
        '<button switch aria-label="Notifications" aria-checked="true"></button>';
    const host = document.querySelector("button");
    if (!(host instanceof HTMLButtonElement)) throw new Error("missing host");

    const binding = track(bind(host, "switch"));
    const seen = watch(binding.state);

    host.dispatchEvent(
        new CustomEvent("juice:change", {
            bubbles: true,
            detail: { runtime: "switch", state: { checked: true } },
        })
    );

    expect(seen.count).toBe(1);
    seen.stop();
});

test("ignores juice:change events that bubble from a descendant", () => {
    document.body.innerHTML = `
      <div disclosure>
        <button type="button" disclosure-trigger aria-expanded="false">More</button>
        <div disclosure-panel hidden>Body</div>
        <button switch aria-label="Nested"></button>
      </div>
    `;
    const host = document.querySelector("[disclosure]");
    const nested = document.querySelector("[switch]");
    if (!(host instanceof HTMLElement) || !(nested instanceof HTMLButtonElement)) {
        throw new Error("missing host");
    }

    const binding = track(bind(host, "disclosure"));
    const seen = watch(binding.state);

    nested.click();

    expect(binding.state.get()).toEqual({ expanded: false });
    expect(seen.count).toBe(1);
    seen.stop();
});

test("follows native input, select, and textarea events", () => {
    document.body.innerHTML = `
      <input input value="alpha" aria-label="Name" />
      <textarea textarea aria-label="Notes">alpha</textarea>
      <select select aria-label="Fruit">
        <option value="apple">Apple</option>
        <option value="pear">Pear</option>
      </select>
    `;
    const input = document.querySelector("input");
    const textarea = document.querySelector("textarea");
    const select = document.querySelector("select");
    if (
        !(input instanceof HTMLInputElement) ||
        !(textarea instanceof HTMLTextAreaElement) ||
        !(select instanceof HTMLSelectElement)
    ) {
        throw new Error("missing controls");
    }

    const inputBinding = track(bind(input));
    const textareaBinding = track(bind(textarea, "textarea"));
    const selectBinding = track(bind(select, "select"));
    const inputSeen = watch(inputBinding.state);

    expect(inputBinding.state.get()).toEqual({ value: "alpha" });
    expect(textareaBinding.state.get()).toEqual({ value: "alpha" });
    expect(selectBinding.state.get()).toEqual({ value: "apple" });

    input.value = "beta";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(inputBinding.state.get()).toEqual({ value: "beta" });
    expect(inputSeen.count).toBe(2);

    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(inputSeen.count).toBe(2);

    textarea.value = "beta";
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    expect(textareaBinding.state.get()).toEqual({ value: "beta" });

    select.value = "pear";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(selectBinding.state.get()).toEqual({ value: "pear" });

    inputSeen.stop();
});

test("does not write native values back to the control", () => {
    document.body.innerHTML = '<input input value="alpha" aria-label="Name" />';
    const input = document.querySelector("input");
    if (!(input instanceof HTMLInputElement)) throw new Error("missing input");

    const binding = track(bind(input, "input"));
    binding.state.set({ value: "zeta" });

    expect(binding.state.get()).toEqual({ value: "zeta" });
    expect(input.value).toBe("alpha");
});

test("removes listeners on dispose", () => {
    document.body.innerHTML = '<button switch aria-label="Notifications"></button>';
    const host = document.querySelector("button");
    if (!(host instanceof HTMLButtonElement)) throw new Error("missing host");

    const removed: string[] = [];
    const original = host.removeEventListener.bind(host);
    host.removeEventListener = ((type: string, listener: EventListener) => {
        removed.push(type);
        original(type, listener);
    }) as typeof host.removeEventListener;

    const binding = track(bind(host, "switch"));
    const seen = watch(binding.state);

    binding.dispose();
    binding.dispose();
    host.click();

    expect(binding.state.get()).toEqual({ checked: false });
    expect(host.getAttribute("aria-checked")).toBe("true");
    expect(seen.count).toBe(1);
    expect(removed).toContain("juice:change");
    seen.stop();
});

test("removes native listeners on dispose", () => {
    document.body.innerHTML = '<input input value="alpha" aria-label="Name" />';
    const input = document.querySelector("input");
    if (!(input instanceof HTMLInputElement)) throw new Error("missing input");

    const removed: string[] = [];
    const original = input.removeEventListener.bind(input);
    input.removeEventListener = ((type: string, listener: EventListener) => {
        removed.push(type);
        original(type, listener);
    }) as typeof input.removeEventListener;

    const binding = track(bind(input, "input"));

    binding.dispose();
    input.value = "beta";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(binding.state.get()).toEqual({ value: "alpha" });
    expect(removed).toContain("input");
    expect(removed).toContain("change");
});

test("disposes with the Sig mount lifecycle", () => {
    const host = jsx(function SwitchView() {
        const button = document.createElement("button");
        button.setAttribute("switch", "");
        button.setAttribute("aria-label", "Mounted");
        const binding = bind(button, "switch");
        (
            button as HTMLButtonElement & {
                binding?: JuiceBinding<JuiceRuntimeState["switch"]>;
            }
        ).binding = binding;
        return button;
    }, {}) as HTMLButtonElement & {
        binding: JuiceBinding<JuiceRuntimeState["switch"]>;
    };

    document.body.append(host);
    host.click();
    expect(host.binding.state.get()).toEqual({ checked: true });

    disposeTree(host);
    host.click();

    expect(host.binding.state.get()).toEqual({ checked: true });
    expect(host.getAttribute("aria-checked")).toBe("false");
});

test("writes switch, checkbox, disclosure, and modal state back through the controller", () => {
    document.body.innerHTML = `
      <button switch aria-label="Notifications" aria-checked="false"></button>
      <button checkbox aria-label="Agree" aria-checked="false"></button>
      <div disclosure>
        <button type="button" disclosure-trigger aria-expanded="false">More</button>
        <div disclosure-panel hidden>Body</div>
      </div>
      <div modal-overlay hidden>
        <div modal><h2>Title</h2></div>
      </div>
    `;

    const switchHost = document.querySelector("[switch]");
    const checkboxHost = document.querySelector("[checkbox]");
    const disclosureHost = document.querySelector("[disclosure]");
    const trigger = document.querySelector("[disclosure-trigger]");
    const panel = document.querySelector("[disclosure-panel]");
    const modalHost = document.querySelector("[modal-overlay]");
    if (
        !(switchHost instanceof HTMLButtonElement) ||
        !(checkboxHost instanceof HTMLButtonElement) ||
        !(disclosureHost instanceof HTMLElement) ||
        !(trigger instanceof HTMLButtonElement) ||
        !(panel instanceof HTMLElement) ||
        !(modalHost instanceof HTMLElement)
    ) {
        throw new Error("missing hosts");
    }

    const switchBinding = track(bind(switchHost, "switch"));
    const checkboxBinding = track(bind(checkboxHost, "checkbox"));
    const disclosureBinding = track(bind(disclosureHost));
    const modalBinding = track(bind(modalHost, "modal"));
    const switchSeen = watch(switchBinding.state);

    switchBinding.state.set({ checked: true });
    checkboxBinding.state.set({ checked: true });
    disclosureBinding.state.set({ expanded: true });
    modalBinding.state.set({ open: true });

    expect(startSwitchRuntime()?.isChecked(switchHost)).toBe(true);
    expect(switchHost.getAttribute("aria-checked")).toBe("true");
    expect(switchSeen.count).toBe(2);
    expect(startCheckboxRuntime()?.isChecked(checkboxHost)).toBe(true);
    expect(startDisclosureRuntime()?.isExpanded(trigger)).toBe(true);
    expect(panel.hasAttribute("hidden")).toBe(false);
    expect(disclosureBinding.state.get()).toEqual({ expanded: true });
    expect(startModalRuntime()?.isOpen(modalHost)).toBe(true);
    expect(modalHost.hasAttribute("hidden")).toBe(false);
    expect(modalBinding.state.get()).toEqual({ open: true });

    modalBinding.state.set({ open: false });
    expect(startModalRuntime()?.isOpen(modalHost)).toBe(false);
    expect(modalBinding.state.get()).toEqual({ open: false });

    switchSeen.stop();
});

test("throws when the host is not a runtime host", () => {
    const host = document.createElement("div");
    expect(() => bind(host)).toThrow(/could not infer a runtime/);
});
