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
    stopAvatarRuntime,
    stopCheckboxRuntime,
    stopDisclosureRuntime,
    stopIconButtonRuntime,
    stopInputRuntime,
    stopKeyboardAvoiderRuntime,
    stopModalRuntime,
    stopPressableRuntime,
    stopSelectRuntime,
    stopSwitchRuntime,
    stopTableRuntime,
    stopTextareaRuntime,
    stopTouchableRowRuntime,
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
    stopIconButtonRuntime();
    stopAvatarRuntime();
    stopTableRuntime();
    stopPressableRuntime();
    stopTouchableRowRuntime();
    stopKeyboardAvoiderRuntime();
    restoreKeyboardHarness();
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

const iconButtonState = {
    pressed: false,
    disabled: false,
    named: true,
};

const requireButton = (selector: string) => {
    const host = document.querySelector(selector);
    if (!(host instanceof HTMLButtonElement)) throw new Error(`missing ${selector}`);
    return host;
};

test("seeds an icon-button signal from getState", () => {
    document.body.innerHTML =
        '<button type="button" icon-button toggle aria-label="Bold"></button>';
    const host = requireButton("button");

    const binding = track(bind(host, "icon-button"));

    expect(binding.state.get()).toEqual(iconButtonState);
    expect(host.getAttribute("aria-pressed")).toBe("false");
});

test("updates an icon-button signal when the toggle is clicked", () => {
    document.body.innerHTML =
        '<button type="button" icon-button toggle aria-label="Bold"></button>';
    const host = requireButton("button");
    const binding = track(bind(host, "icon-button"));
    const seen = watch(binding.state);

    host.click();

    expect(binding.state.get()).toEqual({ ...iconButtonState, pressed: true });
    expect(host.getAttribute("aria-pressed")).toBe("true");
    expect(seen.count).toBe(2);
    seen.stop();
});

test("infers icon-button from the icon-button attribute", () => {
    document.body.innerHTML =
        '<button type="button" icon-button aria-label="Close"></button>';
    const host = requireButton("button");

    expect(track(bind(host)).state.get()).toEqual(iconButtonState);
});

test("removes icon-button listeners on dispose", () => {
    document.body.innerHTML =
        '<button type="button" icon-button toggle aria-label="Bold"></button>';
    const host = requireButton("button");
    const removed: string[] = [];
    const original = host.removeEventListener.bind(host);
    host.removeEventListener = ((type: string, listener: EventListener) => {
        removed.push(type);
        original(type, listener);
    }) as typeof host.removeEventListener;

    const binding = track(bind(host, "icon-button"));
    const seen = watch(binding.state);

    binding.dispose();
    binding.dispose();
    host.click();

    expect(binding.state.get()).toEqual(iconButtonState);
    expect(host.getAttribute("aria-pressed")).toBe("true");
    expect(seen.count).toBe(1);
    expect(removed).toContain("juice:change");
    seen.stop();
});

test("writes icon-button pressed back through toggle once", () => {
    document.body.innerHTML =
        '<button type="button" icon-button toggle aria-label="Bold"></button>';
    const host = requireButton("button");
    const binding = track(bind(host, "icon-button"));
    const seen = watch(binding.state);

    binding.state.set({ ...iconButtonState, pressed: true });

    expect(host.getAttribute("aria-pressed")).toBe("true");
    expect(host.hasAttribute("pressed")).toBe(true);
    expect(binding.state.get()).toEqual({ ...iconButtonState, pressed: true });
    expect(seen.count).toBe(2);
    seen.stop();
});

test("snaps an icon-button signal back when a disabled toggle refuses the write", () => {
    document.body.innerHTML =
        '<button type="button" icon-button toggle disabled aria-label="Bold"></button>';
    const host = requireButton("button");
    const binding = track(bind(host, "icon-button"));
    const seen = watch(binding.state);
    const refused = { pressed: true, disabled: true, named: true };

    binding.state.set(refused);

    expect(host.getAttribute("aria-pressed")).toBe("false");
    expect(host.hasAttribute("pressed")).toBe(false);
    expect(binding.state.get()).toEqual({ pressed: false, disabled: true, named: true });
    expect(seen.count).toBe(1);
    seen.stop();
});

test("snaps an icon-button signal back when the host is not a toggle", () => {
    document.body.innerHTML =
        '<button type="button" icon-button aria-label="Bold"></button>';
    const host = requireButton("button");
    const binding = track(bind(host, "icon-button"));
    const seen = watch(binding.state);

    binding.state.set({ ...iconButtonState, pressed: true });

    expect(host.hasAttribute("aria-pressed")).toBe(false);
    expect(host.hasAttribute("pressed")).toBe(false);
    expect(binding.state.get()).toEqual(iconButtonState);
    expect(seen.count).toBe(1);
    seen.stop();
});

test("keeps an existing switch matcher ahead of icon-button", () => {
    document.body.innerHTML =
        '<button type="button" switch icon-button aria-label="Notifications" aria-checked="true"></button>';
    const host = requireButton("button");

    expect(track(bind(host)).state.get()).toEqual({ checked: true });
});

const holdImage = (img: HTMLImageElement, complete: boolean, naturalWidth: number) => {
    Object.defineProperty(img, "complete", {
        configurable: true,
        get: () => complete,
    });
    Object.defineProperty(img, "naturalWidth", {
        configurable: true,
        get: () => naturalWidth,
    });
};

test("seeds an avatar signal from getState", () => {
    document.body.innerHTML = '<span avatar aria-label="Ada Lovelace">AL</span>';
    const host = document.querySelector("span");
    if (!(host instanceof HTMLElement)) throw new Error("missing avatar");

    expect(track(bind(host, "avatar")).state.get()).toEqual({
        loaded: false,
        fallback: false,
        hasImage: false,
    });
});

test("updates an avatar signal when its image errors", () => {
    document.body.innerHTML =
        '<span avatar aria-label="Ada Lovelace" id="face">AL<img id="photo" alt="Ada Lovelace" src="ada.png"></span>';
    const host = document.getElementById("face");
    const photo = document.getElementById("photo");
    if (!(host instanceof HTMLElement) || !(photo instanceof HTMLImageElement)) {
        throw new Error("missing avatar");
    }
    holdImage(photo, false, 0);

    const binding = track(bind(host, "avatar"));
    const seen = watch(binding.state);

    expect(binding.state.get()).toEqual({
        loaded: false,
        fallback: false,
        hasImage: true,
    });

    photo.dispatchEvent(new Event("error"));

    expect(binding.state.get()).toEqual({
        loaded: false,
        fallback: true,
        hasImage: true,
    });
    expect(host.hasAttribute("fallback")).toBe(true);
    expect(photo.hasAttribute("hidden")).toBe(true);
    expect(seen.count).toBe(2);
    seen.stop();
});

test("infers avatar from the avatar attribute", () => {
    document.body.innerHTML = '<span avatar>AL</span>';
    const host = document.querySelector("span");
    if (!(host instanceof HTMLElement)) throw new Error("missing avatar");

    expect(track(bind(host)).state.get()).toEqual({
        loaded: false,
        fallback: false,
        hasImage: false,
    });
});

test("removes avatar listeners on dispose", () => {
    document.body.innerHTML =
        '<span avatar id="face">AL<img id="photo" alt="Ada" src="ada.png"></span>';
    const host = document.getElementById("face");
    const photo = document.getElementById("photo");
    if (!(host instanceof HTMLElement) || !(photo instanceof HTMLImageElement)) {
        throw new Error("missing avatar");
    }
    holdImage(photo, false, 0);
    const removed: string[] = [];
    const original = host.removeEventListener.bind(host);
    host.removeEventListener = ((type: string, listener: EventListener) => {
        removed.push(type);
        original(type, listener);
    }) as typeof host.removeEventListener;

    const binding = track(bind(host, "avatar"));
    const seen = watch(binding.state);

    binding.dispose();
    binding.dispose();
    photo.dispatchEvent(new Event("error"));

    expect(binding.state.get()).toEqual({
        loaded: false,
        fallback: false,
        hasImage: true,
    });
    expect(host.hasAttribute("fallback")).toBe(true);
    expect(seen.count).toBe(1);
    expect(removed).toContain("juice:change");
    seen.stop();
});

test("does not write avatar state back to the host", () => {
    document.body.innerHTML = '<span avatar id="face">AL</span>';
    const host = document.getElementById("face");
    if (!(host instanceof HTMLElement)) throw new Error("missing avatar");
    const binding = track(bind(host, "avatar"));
    const before = host.outerHTML;

    binding.state.set({ loaded: true, fallback: true, hasImage: true });

    expect(binding.state.get()).toEqual({
        loaded: true,
        fallback: true,
        hasImage: true,
    });
    expect(host.outerHTML).toBe(before);
});

const peopleTable = `
  <table table id="people">
    <thead>
      <tr>
        <th sortable id="name">Name</th>
        <th sortable id="age">Age</th>
      </tr>
    </thead>
    <tbody>
      <tr id="grace"><td>Grace</td><td>85</td></tr>
      <tr id="ada"><td>Ada</td><td>36</td></tr>
    </tbody>
  </table>
`;

const requireTable = () => {
    const host = document.querySelector("table");
    if (!(host instanceof HTMLTableElement)) throw new Error("missing table");
    return host;
};

test("seeds a table signal from getState", () => {
    document.body.innerHTML = peopleTable;
    const host = requireTable();

    expect(track(bind(host, "table")).state.get()).toEqual({
        column: null,
        direction: "none",
    });
});

test("updates a table signal when a sortable header is activated", () => {
    document.body.innerHTML = peopleTable;
    const host = requireTable();
    const binding = track(bind(host, "table"));
    const seen = watch(binding.state);
    const button = document.querySelector("#name button");
    if (!(button instanceof HTMLButtonElement)) throw new Error("missing sort button");

    button.click();

    expect(binding.state.get()).toEqual({ column: 0, direction: "ascending" });
    expect(document.getElementById("name")?.getAttribute("aria-sort")).toBe("ascending");
    expect(seen.count).toBe(2);
    seen.stop();
});

test("infers table only from a table element that has the attribute", () => {
    document.body.innerHTML = `
      ${peopleTable}
      <div table id="fake">Not a host</div>
      <table id="plain"><tr><th>Name</th></tr></table>
    `;
    const host = document.getElementById("people");
    const fake = document.getElementById("fake");
    const plain = document.getElementById("plain");
    if (
        !(host instanceof HTMLTableElement) ||
        !(fake instanceof HTMLElement) ||
        !(plain instanceof HTMLTableElement)
    ) {
        throw new Error("missing tables");
    }

    expect(track(bind(host)).state.get()).toEqual({
        column: null,
        direction: "none",
    });
    expect(() => bind(fake)).toThrow(/could not infer a runtime/);
    expect(() => bind(plain)).toThrow(/could not infer a runtime/);
});

test("removes table listeners on dispose", () => {
    document.body.innerHTML = peopleTable;
    const host = requireTable();
    const removed: string[] = [];
    const original = host.removeEventListener.bind(host);
    host.removeEventListener = ((type: string, listener: EventListener) => {
        removed.push(type);
        original(type, listener);
    }) as typeof host.removeEventListener;

    const binding = track(bind(host, "table"));
    const seen = watch(binding.state);
    binding.dispose();
    binding.dispose();
    const button = document.querySelector("#name button");
    if (!(button instanceof HTMLButtonElement)) throw new Error("missing sort button");
    button.click();

    expect(binding.state.get()).toEqual({ column: null, direction: "none" });
    expect(document.getElementById("name")?.getAttribute("aria-sort")).toBe("ascending");
    expect(seen.count).toBe(1);
    expect(removed).toContain("juice:change");
    seen.stop();
});

test("does not write table sort back to the host", () => {
    document.body.innerHTML = peopleTable;
    const host = requireTable();
    const binding = track(bind(host, "table"));

    binding.state.set({ column: 1, direction: "descending" });

    expect(binding.state.get()).toEqual({ column: 1, direction: "descending" });
    expect(document.getElementById("name")?.getAttribute("aria-sort")).toBe("none");
    expect(document.getElementById("age")?.getAttribute("aria-sort")).toBe("none");
    expect(host.querySelectorAll("tbody tr")[0]?.id).toBe("grace");
});

const pressableRest = { pressed: false, longPressed: false };

// Sig's jsdom register copies MouseEvent and not PointerEvent. Juice's
// pressable runtime checks `instanceof PointerEvent` against the global.
const DomPointerEvent = window.PointerEvent;
if (typeof globalThis.PointerEvent === "undefined") {
    (globalThis as { PointerEvent?: typeof PointerEvent }).PointerEvent = DomPointerEvent;
}

const pointer = (type: string, init: PointerEventInit = {}) =>
    new DomPointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        clientX: 0,
        clientY: 0,
        ...init,
    });

const requireElement = (selector: string) => {
    const host = document.querySelector(selector);
    if (!(host instanceof HTMLElement)) throw new Error(`missing ${selector}`);
    return host;
};

test("seeds a pressable signal from getState", () => {
    document.body.innerHTML = '<button type="button" pressable id="go">Go</button>';
    const host = requireElement("#go");

    expect(track(bind(host, "pressable")).state.get()).toEqual(pressableRest);
    expect(host.hasAttribute("pressed")).toBe(false);
});

test("updates a pressable signal when the pointer goes down and up", () => {
    document.body.innerHTML = '<button type="button" pressable id="go">Go</button>';
    const host = requireElement("#go");
    const binding = track(bind(host, "pressable"));
    const seen = watch(binding.state);

    host.dispatchEvent(pointer("pointerdown"));

    expect(binding.state.get()).toEqual({ pressed: true, longPressed: false });
    expect(host.hasAttribute("pressed")).toBe(true);
    expect(seen.count).toBe(2);

    host.dispatchEvent(pointer("pointerup"));

    expect(binding.state.get()).toEqual(pressableRest);
    expect(host.hasAttribute("pressed")).toBe(false);
    expect(seen.count).toBe(3);
    seen.stop();
});

test("follows a pressable long-press through juice:change", async () => {
    document.body.innerHTML =
        '<button type="button" pressable pressable-longpress="0" id="hold">Hold</button>';
    const host = requireElement("#hold");
    const binding = track(bind(host, "pressable"));
    const longPresses: Event[] = [];
    host.addEventListener("juice:longpress", (event) => longPresses.push(event));

    host.dispatchEvent(pointer("pointerdown"));
    expect(binding.state.get()).toEqual({ pressed: true, longPressed: false });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(longPresses).toHaveLength(1);
    expect((longPresses[0] as CustomEvent).detail).toEqual({
        pressed: true,
        longPressed: true,
    });
    expect(binding.state.get()).toEqual({ pressed: true, longPressed: true });
});

test("does not treat juice:longpress as the pressable state channel", () => {
    document.body.innerHTML = '<button type="button" pressable id="go">Go</button>';
    const host = requireElement("#go");
    const binding = track(bind(host, "pressable"));
    const seen = watch(binding.state);

    host.dispatchEvent(
        new CustomEvent("juice:longpress", {
            bubbles: true,
            cancelable: true,
            detail: { pressed: true, longPressed: true },
        })
    );

    expect(binding.state.get()).toEqual(pressableRest);
    expect(seen.count).toBe(1);
    seen.stop();
});

test("infers pressable from the pressable attribute", () => {
    document.body.innerHTML = '<div pressable id="pad">Pad</div>';
    const host = requireElement("#pad");

    expect(track(bind(host)).state.get()).toEqual(pressableRest);
});

test("keeps icon-button ahead of pressable", () => {
    document.body.innerHTML =
        '<button type="button" icon-button pressable aria-label="Bold"></button>';
    const host = requireButton("button");

    expect(track(bind(host)).state.get()).toEqual(iconButtonState);
});

test("infers pressable ahead of touchable-row when both attributes are set", () => {
    document.body.innerHTML = '<div pressable touchable-row="select" id="row">Row</div>';
    const host = requireElement("#row");

    expect(track(bind(host)).state.get()).toEqual(pressableRest);
    expect(track(bind(host, "touchable-row")).state.get()).toEqual({
        selected: false,
        disabled: false,
    });
});

test("removes pressable listeners on dispose", () => {
    document.body.innerHTML = '<button type="button" pressable id="go">Go</button>';
    const host = requireElement("#go");
    const removed: string[] = [];
    const original = host.removeEventListener.bind(host);
    host.removeEventListener = ((type: string, listener: EventListener) => {
        removed.push(type);
        original(type, listener);
    }) as typeof host.removeEventListener;

    const binding = track(bind(host, "pressable"));
    const seen = watch(binding.state);

    binding.dispose();
    binding.dispose();
    host.dispatchEvent(pointer("pointerdown"));

    expect(binding.state.get()).toEqual(pressableRest);
    expect(host.hasAttribute("pressed")).toBe(true);
    expect(seen.count).toBe(1);
    expect(removed).toContain("juice:change");
    expect(removed).not.toContain("juice:longpress");
    seen.stop();
});

test("does not write pressable state back to the host", () => {
    document.body.innerHTML = '<button type="button" pressable id="go">Go</button>';
    const host = requireElement("#go");
    const binding = track(bind(host, "pressable"));

    binding.state.set({ pressed: true, longPressed: true });

    expect(binding.state.get()).toEqual({ pressed: true, longPressed: true });
    expect(host.hasAttribute("pressed")).toBe(false);
});

const rowRest = { selected: false, disabled: false };

test("seeds a touchable-row signal from getState", () => {
    document.body.innerHTML = '<div touchable-row="select" id="row">Row</div>';
    const host = requireElement("#row");

    expect(track(bind(host, "touchable-row")).state.get()).toEqual(rowRest);
});

test("updates a touchable-row signal when a selectable row is clicked", () => {
    document.body.innerHTML = '<div touchable-row="select" id="row">Row</div>';
    const host = requireElement("#row");
    const binding = track(bind(host, "touchable-row"));
    const seen = watch(binding.state);

    host.click();

    expect(binding.state.get()).toEqual({ selected: true, disabled: false });
    expect(host.hasAttribute("selected")).toBe(true);
    expect(host.getAttribute("aria-selected")).toBe("true");
    expect(seen.count).toBe(2);

    host.click();

    expect(binding.state.get()).toEqual(rowRest);
    expect(host.hasAttribute("selected")).toBe(false);
    expect(seen.count).toBe(3);
    seen.stop();
});

test("infers touchable-row from the touchable-row attribute", () => {
    document.body.innerHTML = '<div touchable-row id="row">Row</div>';
    const host = requireElement("#row");

    expect(track(bind(host)).state.get()).toEqual(rowRest);
});

test("removes touchable-row listeners on dispose", () => {
    document.body.innerHTML = '<div touchable-row="select" id="row">Row</div>';
    const host = requireElement("#row");
    const removed: string[] = [];
    const original = host.removeEventListener.bind(host);
    host.removeEventListener = ((type: string, listener: EventListener) => {
        removed.push(type);
        original(type, listener);
    }) as typeof host.removeEventListener;

    const binding = track(bind(host, "touchable-row"));
    const seen = watch(binding.state);

    binding.dispose();
    binding.dispose();
    host.click();

    expect(binding.state.get()).toEqual(rowRest);
    expect(host.hasAttribute("selected")).toBe(true);
    expect(seen.count).toBe(1);
    expect(removed).toContain("juice:change");
    seen.stop();
});

test("does not write touchable-row state back to the host", () => {
    document.body.innerHTML = '<div touchable-row="select" id="row">Row</div>';
    const host = requireElement("#row");
    const binding = track(bind(host, "touchable-row"));

    binding.state.set({ selected: true, disabled: false });

    expect(binding.state.get()).toEqual({ selected: true, disabled: false });
    expect(host.hasAttribute("selected")).toBe(false);
    expect(host.hasAttribute("aria-selected")).toBe(false);
});

// Node's EventTarget rejects jsdom's Event. The viewport has to be the
// window's EventTarget so resize events reach the runtime listener.
const DomEventTarget = window.EventTarget;

class KeyboardViewport extends DomEventTarget {
    height = 800;
    width = 400;
    offsetTop = 0;
    offsetLeft = 0;
    pageTop = 0;
    pageLeft = 0;
    scale = 1;
}

type KeyboardFrame = { id: number; cb: FrameRequestCallback };

const originalViewport = Object.getOwnPropertyDescriptor(window, "visualViewport");
const originalInnerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");
const originalRequest = globalThis.requestAnimationFrame;
const originalCancel = globalThis.cancelAnimationFrame;
const originalWindowRequest = window.requestAnimationFrame;
const originalWindowCancel = window.cancelAnimationFrame;

let keyboardViewport: KeyboardViewport | null = null;
let keyboardFrames: KeyboardFrame[] = [];
let keyboardFrameId = 0;
let keyboardHarness = false;

const installKeyboardHarness = () => {
    keyboardViewport = new KeyboardViewport();
    keyboardFrameId = 0;
    keyboardFrames = [];
    keyboardHarness = true;
    Object.defineProperty(window, "visualViewport", {
        configurable: true,
        writable: true,
        value: keyboardViewport,
    });
    Object.defineProperty(window, "innerHeight", {
        configurable: true,
        writable: true,
        value: 800,
    });
    const request = (cb: FrameRequestCallback) => {
        const id = ++keyboardFrameId;
        keyboardFrames.push({ id, cb });
        return id;
    };
    const cancel = (id: number) => {
        keyboardFrames = keyboardFrames.filter((frame) => frame.id !== id);
    };
    // The runtime calls the free `requestAnimationFrame`, which is the global,
    // not `window.requestAnimationFrame`.
    globalThis.requestAnimationFrame = request;
    globalThis.cancelAnimationFrame = cancel;
    window.requestAnimationFrame = request;
    window.cancelAnimationFrame = cancel;
};

const flushKeyboardFrames = (times = 1) => {
    for (let i = 0; i < times; i += 1) {
        const batch = keyboardFrames;
        keyboardFrames = [];
        for (const frame of batch) frame.cb(0);
    }
};

const restoreKeyboardHarness = () => {
    if (!keyboardHarness) return;
    keyboardHarness = false;
    keyboardFrames = [];
    globalThis.requestAnimationFrame = originalRequest;
    globalThis.cancelAnimationFrame = originalCancel;
    window.requestAnimationFrame = originalWindowRequest;
    window.cancelAnimationFrame = originalWindowCancel;
    if (originalViewport) {
        Object.defineProperty(window, "visualViewport", originalViewport);
    } else {
        delete (window as { visualViewport?: VisualViewport }).visualViewport;
    }
    if (originalInnerHeight) {
        Object.defineProperty(window, "innerHeight", originalInnerHeight);
    }
    document.documentElement.removeAttribute("keyboard-open");
    document.documentElement.style.removeProperty("--juice-keyboard-inset");
};

const keyboardRest = { open: false, inset: 0 };

const bindKeyboard = (selector = "#host") => {
    installKeyboardHarness();
    stopKeyboardAvoiderRuntime();
    return track(bind(requireElement(selector), "keyboard-avoider"));
};

test("seeds a keyboard-avoider signal from getState", () => {
    document.body.innerHTML =
        '<div keyboard-avoider id="host"><input id="field" aria-label="Note"></div>';

    const binding = bindKeyboard();

    expect(binding.state.get()).toEqual(keyboardRest);
    expect(document.documentElement.hasAttribute("keyboard-open")).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--juice-keyboard-inset")).toBe(
        ""
    );
    expect(requireElement("#host").hasAttribute("keyboard-open")).toBe(false);
});

test("updates a keyboard-avoider signal when the keyboard opens", () => {
    document.body.innerHTML =
        '<div keyboard-avoider id="host"><input id="field" aria-label="Note"></div>';
    const host = requireElement("#host");
    const field = document.getElementById("field");
    if (!(field instanceof HTMLInputElement)) throw new Error("missing field");
    const binding = bindKeyboard();
    const seen = watch(binding.state);

    field.focus();
    if (!keyboardViewport) throw new Error("missing viewport");
    keyboardViewport.height = 500;
    keyboardViewport.dispatchEvent(new Event("resize"));
    flushKeyboardFrames();

    expect(binding.state.get()).toEqual({ open: true, inset: 300 });
    expect(document.documentElement.style.getPropertyValue("--juice-keyboard-inset")).toBe(
        "300px"
    );
    expect(document.documentElement.hasAttribute("keyboard-open")).toBe(true);
    expect(host.hasAttribute("keyboard-open")).toBe(true);
    expect(seen.count).toBe(2);
    seen.stop();
});

test("keeps a keyboard-avoider signal on the last juice:change across a small inset step", () => {
    document.body.innerHTML =
        '<div keyboard-avoider id="host"><input id="field" aria-label="Note"></div>';
    const field = document.getElementById("field");
    if (!(field instanceof HTMLInputElement)) throw new Error("missing field");
    const binding = bindKeyboard();
    const seen = watch(binding.state);

    field.focus();
    if (!keyboardViewport) throw new Error("missing viewport");
    keyboardViewport.height = 500;
    keyboardViewport.dispatchEvent(new Event("resize"));
    flushKeyboardFrames();
    expect(binding.state.get()).toEqual({ open: true, inset: 300 });

    keyboardViewport.height = 510;
    keyboardViewport.dispatchEvent(new Event("resize"));
    flushKeyboardFrames();

    expect(binding.state.get()).toEqual({ open: true, inset: 300 });
    expect(document.documentElement.style.getPropertyValue("--juice-keyboard-inset")).toBe(
        "290px"
    );
    expect(seen.count).toBe(2);
    seen.stop();
});

test("infers keyboard-avoider from the keyboard-avoider attribute", () => {
    document.body.innerHTML = '<div keyboard-avoider id="host"></div>';

    expect(bindKeyboard().state.get()).toEqual(keyboardRest);
});

test("removes keyboard-avoider listeners on dispose", () => {
    document.body.innerHTML =
        '<div keyboard-avoider id="host"><input id="field" aria-label="Note"></div>';
    const host = requireElement("#host");
    const field = document.getElementById("field");
    if (!(field instanceof HTMLInputElement)) throw new Error("missing field");
    const removed: string[] = [];
    const original = host.removeEventListener.bind(host);
    host.removeEventListener = ((type: string, listener: EventListener) => {
        removed.push(type);
        original(type, listener);
    }) as typeof host.removeEventListener;

    const binding = bindKeyboard();
    const seen = watch(binding.state);

    binding.dispose();
    binding.dispose();
    field.focus();
    if (!keyboardViewport) throw new Error("missing viewport");
    keyboardViewport.height = 500;
    keyboardViewport.dispatchEvent(new Event("resize"));
    flushKeyboardFrames();

    expect(binding.state.get()).toEqual(keyboardRest);
    expect(host.hasAttribute("keyboard-open")).toBe(true);
    expect(seen.count).toBe(1);
    expect(removed).toContain("juice:change");
    seen.stop();
});

test("does not write keyboard-avoider state back to the host", () => {
    document.body.innerHTML = '<div keyboard-avoider id="host"></div>';
    const host = requireElement("#host");
    const binding = bindKeyboard();

    binding.state.set({ open: true, inset: 120 });

    expect(binding.state.get()).toEqual({ open: true, inset: 120 });
    expect(host.hasAttribute("keyboard-open")).toBe(false);
    expect(document.documentElement.hasAttribute("keyboard-open")).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--juice-keyboard-inset")).toBe(
        ""
    );
});
