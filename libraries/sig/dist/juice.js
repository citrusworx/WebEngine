/**
 * Optional Juice adapter. Import from `@citrusworx/sigjs/juice`.
 *
 * The main Sig entry does not import Juice. This module is the only one
 * that does. Juice is an optional peer: Sig installs without it, and Juice
 * depends on Sig's main entry, not this subpath, so the packages do not cycle.
 *
 * Updates follow Juice's DOM contract: a bubbling `juice:change` event whose
 * detail is `{ runtime, state }`. Select, input, and textarea do not emit
 * that event; they use native `input` and `change`. State types for the
 * original runtimes are imported as types. Icon button, avatar, and table
 * use local shapes, so the published declarations do not name Juice types
 * that older builds do not export. Those three start functions are read from
 * the Juice module namespace and may be missing. Binding one of them then
 * throws. The other twenty-five keep named imports, so an older Juice still
 * loads this module and still binds them.
 *
 * `state.set` writes back for switch, checkbox, disclosure, modal, and
 * icon-button. Icon-button calls `toggle` only when the host has `[toggle]`
 * and `pressed` changes, then republishes `getState()`. A disabled host or a
 * host without `[toggle]` refuses the write and the signal matches the host.
 * Avatar and table are read-only. Table has no Juice API to set sort.
 *
 * `bind` returns `{ state, dispose }`. `dispose` removes the host listeners.
 * A call during Sig render also disposes on unmount: `effect` registers that
 * disposer on the internal cleanup scope (`captureCleanupScope`).
 */
import { effect, Signal } from "./signal.js";
import * as juice from "@citrusworx/juiceui";
import { startAccordionRuntime, startBannerRuntime, startBreadcrumbRuntime, startCheckboxRuntime, startComboboxRuntime, startDisclosureRuntime, startDrawerRuntime, startFieldRuntime, startInputRuntime, startMenuRuntime, startModalRuntime, startNavigationRuntime, startPaginationRuntime, startPopoverRuntime, startProgressRuntime, startRadioRuntime, startSelectRuntime, startSliderRuntime, startSpinnerRuntime, startSwitchRuntime, startTabsRuntime, startTextareaRuntime, startToastRuntime, startTooltipRuntime, startWizardRuntime, } from "@citrusworx/juiceui";
const JUICE_CHANGE_EVENT = "juice:change";
const NATIVE_VALUE_RUNTIMES = new Set([
    "select",
    "input",
    "textarea",
]);
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const statesEqual = (left, right) => {
    if (Object.is(left, right))
        return true;
    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right))
            return false;
        if (left.length !== right.length)
            return false;
        return left.every((item, index) => statesEqual(item, right[index]));
    }
    if (isRecord(left) || isRecord(right)) {
        if (!isRecord(left) || !isRecord(right))
            return false;
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length)
            return false;
        return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) &&
            statesEqual(left[key], right[key]));
    }
    return false;
};
const NEWER_RUNTIME_EXPORT = {
    "icon-button": "startIconButtonRuntime",
    avatar: "startAvatarRuntime",
    table: "startTableRuntime",
};
const juiceExports = juice;
const optionalStart = (runtime) => {
    const exportName = NEWER_RUNTIME_EXPORT[runtime];
    const value = juiceExports[exportName];
    if (typeof value !== "function")
        return undefined;
    return value;
};
const readOptional = (runtime, host) => optionalStart(runtime)?.()?.getState(host) ?? null;
const newerRuntimeExport = (runtime) => {
    if (!Object.prototype.hasOwnProperty.call(NEWER_RUNTIME_EXPORT, runtime)) {
        return null;
    }
    return NEWER_RUNTIME_EXPORT[runtime];
};
const assertRuntimeAvailable = (runtime) => {
    const exportName = newerRuntimeExport(runtime);
    if (!exportName)
        return;
    if (optionalStart(runtime))
        return;
    throw new Error(`Sig juice bind: "${runtime}" needs a newer @citrusworx/juiceui that exports ${exportName}.`);
};
const writeIconButton = (host, next) => {
    const controller = optionalStart("icon-button")?.();
    if (!controller?.toggle)
        return;
    const current = controller.getState(host);
    if (!current || !host.hasAttribute("toggle"))
        return;
    if (current.pressed === next.pressed)
        return;
    controller.toggle(host);
};
const readers = {
    switch: (host) => startSwitchRuntime()?.getState(host) ?? null,
    checkbox: (host) => startCheckboxRuntime()?.getState(host) ?? null,
    disclosure: (host) => startDisclosureRuntime()?.getState(host) ?? null,
    accordion: (host) => startAccordionRuntime()?.getState(host) ?? null,
    modal: (host) => startModalRuntime()?.getState(host) ?? null,
    drawer: (host) => startDrawerRuntime()?.getState(host) ?? null,
    popover: (host) => startPopoverRuntime()?.getState(host) ?? null,
    menu: (host) => startMenuRuntime()?.getState(host) ?? null,
    combobox: (host) => startComboboxRuntime()?.getState(host) ?? null,
    slider: (host) => startSliderRuntime()?.getState(host) ?? null,
    progress: (host) => startProgressRuntime()?.getState(host) ?? null,
    radio: (host) => startRadioRuntime()?.getState(host) ?? null,
    tabs: (host) => startTabsRuntime()?.getState(host) ?? null,
    pagination: (host) => startPaginationRuntime()?.getState(host) ?? null,
    breadcrumb: (host) => startBreadcrumbRuntime()?.getState(host) ?? null,
    wizard: (host) => startWizardRuntime()?.getState(host) ?? null,
    toast: (host) => startToastRuntime()?.getState(host) ?? null,
    banner: (host) => startBannerRuntime()?.getState(host) ?? null,
    tooltip: (host) => startTooltipRuntime()?.getState(host) ?? null,
    spinner: (host) => startSpinnerRuntime()?.getState(host) ?? null,
    nav: (host) => startNavigationRuntime()?.getState(host) ?? null,
    field: (host) => startFieldRuntime()?.getState(host) ?? null,
    select: (host) => startSelectRuntime()?.getState(host) ?? null,
    input: (host) => startInputRuntime()?.getState(host) ?? null,
    textarea: (host) => startTextareaRuntime()?.getState(host) ?? null,
    "icon-button": (host) => readOptional("icon-button", host),
    avatar: (host) => readOptional("avatar", host),
    table: (host) => readOptional("table", host),
};
const hostMatchers = [
    {
        runtime: "select",
        match: (host) => host instanceof HTMLSelectElement && host.hasAttribute("select"),
    },
    {
        runtime: "textarea",
        match: (host) => host instanceof HTMLTextAreaElement && host.hasAttribute("textarea"),
    },
    {
        runtime: "switch",
        match: (host) => host.hasAttribute("switch"),
    },
    {
        runtime: "checkbox",
        match: (host) => host.hasAttribute("checkbox"),
    },
    {
        runtime: "input",
        match: (host) => host instanceof HTMLInputElement && host.hasAttribute("input"),
    },
    {
        runtime: "disclosure",
        match: (host) => host.hasAttribute("disclosure"),
    },
    {
        runtime: "accordion",
        match: (host) => host.hasAttribute("accordion"),
    },
    {
        runtime: "modal",
        match: (host) => host.hasAttribute("modal-overlay"),
    },
    {
        runtime: "drawer",
        match: (host) => host.hasAttribute("drawer-overlay"),
    },
    {
        runtime: "popover",
        match: (host) => host.hasAttribute("popover-root"),
    },
    {
        runtime: "menu",
        match: (host) => host.hasAttribute("menu-root"),
    },
    {
        runtime: "combobox",
        match: (host) => host.hasAttribute("combobox"),
    },
    {
        runtime: "slider",
        match: (host) => host.hasAttribute("slider"),
    },
    {
        runtime: "progress",
        match: (host) => host.hasAttribute("progress"),
    },
    {
        runtime: "radio",
        match: (host) => host.hasAttribute("radiogroup"),
    },
    {
        runtime: "tabs",
        match: (host) => host.hasAttribute("tabs"),
    },
    {
        runtime: "pagination",
        match: (host) => host.hasAttribute("pagination"),
    },
    {
        runtime: "breadcrumb",
        match: (host) => host.hasAttribute("breadcrumb"),
    },
    {
        runtime: "wizard",
        match: (host) => host.hasAttribute("wizard-shell"),
    },
    {
        runtime: "toast",
        match: (host) => host.hasAttribute("toast"),
    },
    {
        runtime: "banner",
        match: (host) => host.hasAttribute("banner"),
    },
    {
        runtime: "tooltip",
        match: (host) => host.hasAttribute("tooltip-root"),
    },
    {
        runtime: "spinner",
        match: (host) => host.hasAttribute("spinner"),
    },
    {
        runtime: "nav",
        match: (host) => host.tagName === "NAV" && host.getAttribute("type") === "sidebar",
    },
    {
        runtime: "field",
        match: (host) => host.hasAttribute("field"),
    },
    {
        runtime: "icon-button",
        match: (host) => host.hasAttribute("icon-button"),
    },
    {
        runtime: "avatar",
        match: (host) => host.hasAttribute("avatar"),
    },
    {
        runtime: "table",
        match: (host) => host instanceof HTMLTableElement && host.hasAttribute("table"),
    },
];
const inferRuntime = (host) => hostMatchers.find((candidate) => candidate.match(host))?.runtime ?? null;
const readState = (runtime, host) => readers[runtime](host);
const writeBack = (runtime, host, state) => {
    switch (runtime) {
        case "switch":
            startSwitchRuntime()?.setChecked(state.checked, host);
            return;
        case "checkbox":
            startCheckboxRuntime()?.setChecked(state.checked, host);
            return;
        case "disclosure": {
            const expanded = state.expanded;
            const trigger = host.matches("[disclosure-trigger]")
                ? host
                : host.querySelector("[disclosure-trigger]");
            if (!trigger)
                return;
            const controller = startDisclosureRuntime();
            if (!controller)
                return;
            if (expanded)
                controller.expand(trigger);
            else
                controller.collapse(trigger);
            return;
        }
        case "modal": {
            const controller = startModalRuntime();
            if (!controller)
                return;
            if (state.open)
                controller.open(host);
            else
                controller.close(host);
            return;
        }
        default:
            // Avatar and table are read-only. Table has no Juice API to set sort.
            return;
    }
};
const isRuntimeName = (value) => Object.prototype.hasOwnProperty.call(readers, value);
export function bind(host, runtime) {
    const resolved = runtime ?? inferRuntime(host);
    if (!resolved || !isRuntimeName(resolved)) {
        throw new Error("Sig juice bind: could not infer a runtime from this host. Pass a runtime name.");
    }
    assertRuntimeAvailable(resolved);
    const seeded = readState(resolved, host);
    if (seeded == null) {
        throw new Error(`Sig juice bind: ${resolved} getState() returned null for this host.`);
    }
    const inner = Signal(structuredClone(seeded));
    let disposed = false;
    const publish = (next, fromHost) => {
        if (disposed)
            return;
        if (!fromHost && resolved === "icon-button") {
            // `toggle` dispatches `juice:change`, which publishes the host
            // state on the way back in. Re-read afterwards so a refused
            // write (disabled, or no `[toggle]`) cannot leave the signal ahead
            // of the host, and a successful write cannot notify twice.
            writeIconButton(host, next);
            const actual = readState("icon-button", host);
            if (actual == null || statesEqual(inner.get(), actual))
                return;
            inner.set(structuredClone(actual));
            return;
        }
        if (statesEqual(inner.get(), next))
            return;
        inner.set(structuredClone(next));
        if (!fromHost)
            writeBack(resolved, host, next);
    };
    const onJuiceChange = (event) => {
        if (disposed || event.target !== host)
            return;
        if (!(event instanceof CustomEvent))
            return;
        const detail = event.detail;
        if (!detail || detail.runtime !== resolved || detail.state == null)
            return;
        publish(detail.state, true);
    };
    const pullNative = () => {
        if (disposed)
            return;
        const next = readState(resolved, host);
        if (next == null)
            return;
        publish(next, true);
    };
    const native = NATIVE_VALUE_RUNTIMES.has(resolved);
    const stopListening = effect(() => {
        host.addEventListener(JUICE_CHANGE_EVENT, onJuiceChange);
        if (native) {
            host.addEventListener("input", pullNative);
            host.addEventListener("change", pullNative);
        }
        return () => {
            disposed = true;
            host.removeEventListener(JUICE_CHANGE_EVENT, onJuiceChange);
            if (native) {
                host.removeEventListener("input", pullNative);
                host.removeEventListener("change", pullNative);
            }
        };
    });
    return {
        state: {
            get: () => inner.get(),
            set: (value) => publish(value, false),
        },
        dispose: () => {
            if (disposed)
                return;
            disposed = true;
            stopListening();
        },
    };
}
//# sourceMappingURL=juice.js.map