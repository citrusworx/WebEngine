/**
 * Frozen 1.0 public-surface guards for `@citrusworx/juiceui`.
 *
 * docs/juice/juice-public-contract.md is the classification. These tests
 * read the built package entry, `package.json` `exports`, `requiredJuiceBinds()`,
 * core role helpers, runtime DEFAULTS, and the `[motion]` catalog. An added,
 * removed, or renamed Frozen name fails with "public-contract change".
 *
 * Emerging names are exact lists in their own tests. Updating one of those
 * lists is not a Frozen contract break. Not pinned here, because a change is
 * Emerging or not contract: CSS-only modifiers, wizard checkout attributes,
 * the six core CSS folders without a component page, motion helper signatures,
 * the `tokens` object shape, button `theme="citrusmint-300"`, portal, and RTL.
 * Runtime-read part attributes are Frozen in the contract; this file guards
 * the host hooks.
 *
 * `yarn workspace @citrusworx/juiceui verify` builds `dist/` before vitest.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
    optionalAccordionBinds,
    optionalTabsBinds,
    requiredJuiceBinds,
    SHIPPED_LIBRARY_THEMES,
} from "./juice.theme-contract.js";

const PACKAGE_ROOT = process.cwd();
const SRC_DIR = join(PACKAGE_ROOT, "src");
const DIST_DIR = join(PACKAGE_ROOT, "dist");

type PackageExportTarget = { default?: string; types?: string } | string | null;
type NormalizedExport = { default: string | null; types: string | null };

function contractBreak(surface: string): string {
    return `public-contract change: ${surface}. Frozen names are the 1.0 contract in docs/juice/juice-public-contract.md.`;
}

function emergingDrift(surface: string): string {
    return `Emerging surface changed (${surface}). This is not a Frozen public-contract break. Update the Emerging list in this file if the change is intentional.`;
}

function sorted(values: Iterable<string>): string[] {
    return [...values].sort();
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
    const out: Record<string, T> = {};
    for (const key of Object.keys(record).sort()) {
        const value = record[key];
        if (value !== undefined) out[key] = value;
    }
    return out;
}

function readText(path: string): string {
    return readFileSync(path, "utf8");
}

function walkScss(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walkScss(path));
        else if (entry.name.endsWith(".scss")) files.push(path);
    }
    return files;
}

function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

/** Value names written in `src/index.ts`. Type-only `export type` blocks are skipped. */
function valueExportsFromEntrySource(source: string): string[] {
    const names = new Set<string>();
    const stripped = stripComments(source);
    for (const match of stripped.matchAll(/export\s+\{([^}]+)\}\s+from\s+["'][^"']+["']/g)) {
        for (const part of (match[1] ?? "").split(",")) {
            const trimmed = part.trim();
            if (!trimmed || trimmed.startsWith("type ")) continue;
            const alias = trimmed.split(/\s+as\s+/);
            const exported = (alias[1] ?? alias[0] ?? "").trim();
            if (exported) names.add(exported);
        }
    }
    return sorted(names);
}

async function builtValueKeys(): Promise<{ keys: string[]; juiceChange: unknown }> {
    const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
    const loaded = (await import(entryUrl)) as Record<string, unknown>;
    return { keys: sorted(Object.keys(loaded)), juiceChange: loaded.JUICE_CHANGE_EVENT };
}

function normalizeExports(raw: Record<string, PackageExportTarget>): Record<string, NormalizedExport> {
    const out: Record<string, NormalizedExport> = {};
    for (const key of Object.keys(raw)) {
        const value = raw[key];
        if (value == null) out[key] = { default: null, types: null };
        else if (typeof value === "string") out[key] = { default: value, types: null };
        else out[key] = { default: value.default ?? null, types: value.types ?? null };
    }
    return sortRecord(out);
}

const FROZEN_THEME_IDS = [
    "aquaflux",
    "kiwipress",
    "citrusmint",
    "tide",
    "retro-afterburn",
    "retro-arcade-glow",
    "retro-boardwalk",
    "retro-denim-dial",
    "retro-forest-radio",
    "retro-orchard-club",
    "retro-poolside-pop",
    "retro-signal-garden",
    "retro-sunset-motel",
    "retro-violet-parlor",
] as const;

const FROZEN_EXPORT_NULL_KEYS = [
    "./styles/themes/_draft",
    "./styles/themes/_draft/*",
    "./themes/_draft",
    "./themes/_draft/*.css",
    "./themes/_draft/*",
] as const;

const THEME_TYPES = "./dist/themes/index.d.ts";

function frozenExportMap(): Record<string, NormalizedExport> {
    const map: Record<string, NormalizedExport> = {
        ".": { default: "./dist/index.js", types: "./dist/index.d.ts" },
        "./styles": { default: "./dist/index.css", types: THEME_TYPES },
        "./styles/themes/*": { default: "./dist/themes/*.css", types: THEME_TYPES },
        "./themes/*.css": { default: "./dist/themes/*.css", types: THEME_TYPES },
    };
    for (const key of FROZEN_EXPORT_NULL_KEYS) {
        map[key] = { default: null, types: null };
    }
    for (const id of FROZEN_THEME_IDS) {
        map[`./themes/${id}.css`] = { default: `./dist/themes/${id}.css`, types: THEME_TYPES };
        map[`./styles/themes/${id}`] = { default: `./dist/themes/${id}.css`, types: THEME_TYPES };
    }
    return sortRecord(map);
}

/** Stems of the thirty-two Frozen lifecycle exports, in contract-table order. */
const FROZEN_RUNTIME_STEMS = [
    "Navigation",
    "Menu",
    "Tabs",
    "Breadcrumb",
    "Pagination",
    "Modal",
    "Drawer",
    "Sheet",
    "Popover",
    "Tooltip",
    "Toast",
    "Input",
    "Textarea",
    "Select",
    "Combobox",
    "Checkbox",
    "Radio",
    "Switch",
    "Slider",
    "Field",
    "IconButton",
    "Pressable",
    "TouchableRow",
    "Banner",
    "Progress",
    "Spinner",
    "Accordion",
    "Disclosure",
    "Wizard",
    "Avatar",
    "Table",
    "KeyboardAvoider",
] as const;

function frozenValueExports(): string[] {
    const names = ["JUICE_CHANGE_EVENT"];
    for (const stem of FROZEN_RUNTIME_STEMS) {
        names.push(`create${stem}`, `init${stem}`, `start${stem}Runtime`, `stop${stem}Runtime`);
    }
    return sorted(names);
}

/**
 * Public value exports that are Emerging. A change here is not a Frozen
 * contract break. `Accordion` is the Sig factory. The five motion helpers
 * and `tokens` are public Emerging exports.
 */
const EMERGING_VALUE_EXPORTS = [
    "Accordion",
    "createElementMotion",
    "createMotionCancelToken",
    "prefersReducedMotion",
    "runMotion",
    "subscribeReducedMotion",
    "tokens",
] as const;

/** Change bookkeeping stays internal. It is not a package value export. */
const INTERNAL_CHANGE_HELPERS = ["createJuiceChanges", "dispatchJuiceChange", "juiceStatesEqual"] as const;

/**
 * Required `--juice-*` names from `requiredJuiceBinds()` / theme contract §4.
 * Sorted. Sheet roles are not in this list; sheet paint falls through to drawer.
 */
const FROZEN_REQUIRED_BINDS = [
    "--juice-accordion-chevron",
    "--juice-accordion-focus-ring",
    "--juice-accordion-panel-rule",
    "--juice-accordion-trigger",
    "--juice-accordion-trigger-hover",
    "--juice-accordion-trigger-open",
    "--juice-banner-close",
    "--juice-banner-close-color",
    "--juice-banner-close-hover",
    "--juice-banner-error",
    "--juice-banner-error-soft",
    "--juice-banner-focus-ring",
    "--juice-banner-info",
    "--juice-banner-info-soft",
    "--juice-banner-ink",
    "--juice-banner-panel",
    "--juice-banner-panel-border",
    "--juice-banner-success",
    "--juice-banner-success-soft",
    "--juice-banner-warning",
    "--juice-banner-warning-soft",
    "--juice-border-strength-bold-color",
    "--juice-border-strength-bold-width",
    "--juice-border-strength-soft-color",
    "--juice-border-strength-soft-width",
    "--juice-breadcrumb-focus-ring",
    "--juice-breadcrumb-ink",
    "--juice-breadcrumb-ink-current",
    "--juice-breadcrumb-ink-hover",
    "--juice-breadcrumb-separator",
    "--juice-breadcrumb-surface",
    "--juice-checkbox-border",
    "--juice-checkbox-border-checked",
    "--juice-checkbox-control",
    "--juice-checkbox-control-checked",
    "--juice-checkbox-focus-ring",
    "--juice-checkbox-mark",
    "--juice-combobox-focus-ring",
    "--juice-combobox-input",
    "--juice-combobox-input-border",
    "--juice-combobox-input-ink",
    "--juice-combobox-list",
    "--juice-combobox-list-border",
    "--juice-combobox-list-shadow",
    "--juice-combobox-option",
    "--juice-combobox-option-hover",
    "--juice-combobox-option-ink",
    "--juice-combobox-option-selected",
    "--juice-combobox-trigger",
    "--juice-combobox-trigger-ink",
    "--juice-disclosure-border",
    "--juice-disclosure-chevron",
    "--juice-disclosure-focus-ring",
    "--juice-disclosure-ink",
    "--juice-disclosure-surface",
    "--juice-disclosure-trigger",
    "--juice-disclosure-trigger-hover",
    "--juice-disclosure-trigger-open",
    "--juice-drawer-close",
    "--juice-drawer-close-color",
    "--juice-drawer-close-hover",
    "--juice-drawer-focus-ring",
    "--juice-drawer-overlay",
    "--juice-drawer-panel",
    "--juice-drawer-panel-border",
    "--juice-drawer-panel-shadow",
    "--juice-field-error-ink",
    "--juice-field-gap",
    "--juice-field-help-ink",
    "--juice-field-invalid-border",
    "--juice-field-label-ink",
    "--juice-field-surface",
    "--juice-input-border",
    "--juice-input-focus-ring",
    "--juice-input-ink",
    "--juice-input-placeholder",
    "--juice-input-surface",
    "--juice-menu-focus-ring",
    "--juice-menu-ink",
    "--juice-menu-item",
    "--juice-menu-item-active",
    "--juice-menu-item-hover",
    "--juice-menu-opener",
    "--juice-menu-opener-ink",
    "--juice-menu-panel",
    "--juice-menu-panel-border",
    "--juice-menu-panel-shadow",
    "--juice-menu-separator",
    "--juice-modal-close",
    "--juice-modal-close-color",
    "--juice-modal-close-hover",
    "--juice-modal-focus-ring",
    "--juice-modal-overlay",
    "--juice-modal-panel",
    "--juice-modal-panel-border",
    "--juice-modal-panel-shadow",
    "--juice-overlay-frost-layer",
    "--juice-overlay-frost-wash",
    "--juice-overlay-tint-layer",
    "--juice-overlay-tint-wash",
    "--juice-pagination-border",
    "--juice-pagination-ellipsis",
    "--juice-pagination-focus-ring",
    "--juice-pagination-ink",
    "--juice-pagination-ink-current",
    "--juice-pagination-ink-disabled",
    "--juice-pagination-ink-hover",
    "--juice-pagination-surface",
    "--juice-pagination-surface-current",
    "--juice-pagination-surface-hover",
    "--juice-popover-close",
    "--juice-popover-close-color",
    "--juice-popover-close-hover",
    "--juice-popover-focus-ring",
    "--juice-popover-ink",
    "--juice-popover-panel",
    "--juice-popover-panel-border",
    "--juice-popover-panel-shadow",
    "--juice-progress-fill",
    "--juice-progress-focus-ring",
    "--juice-progress-ink",
    "--juice-progress-track",
    "--juice-progress-track-border",
    "--juice-radio-border",
    "--juice-radio-border-checked",
    "--juice-radio-control",
    "--juice-radio-control-checked",
    "--juice-radio-focus-ring",
    "--juice-radio-mark",
    "--juice-select-border",
    "--juice-select-chevron",
    "--juice-select-focus-ring",
    "--juice-select-ink",
    "--juice-select-surface",
    "--juice-shadow-tone-cool-color",
    "--juice-shadow-tone-cool-shadow",
    "--juice-shadow-tone-warm-color",
    "--juice-shadow-tone-warm-shadow",
    "--juice-slider-fill",
    "--juice-slider-focus-ring",
    "--juice-slider-thumb",
    "--juice-slider-thumb-border",
    "--juice-slider-thumb-shadow",
    "--juice-slider-track",
    "--juice-slider-track-border",
    "--juice-spinner-focus-ring",
    "--juice-spinner-indicator",
    "--juice-spinner-ink",
    "--juice-spinner-track",
    "--juice-surface-muted-bg",
    "--juice-surface-muted-blur",
    "--juice-surface-muted-border",
    "--juice-surface-muted-shadow",
    "--juice-surface-soft-bg",
    "--juice-surface-soft-blur",
    "--juice-surface-soft-border",
    "--juice-surface-soft-shadow",
    "--juice-surface-strong-bg",
    "--juice-surface-strong-blur",
    "--juice-surface-strong-border",
    "--juice-surface-strong-shadow",
    "--juice-switch-focus-ring",
    "--juice-switch-thumb",
    "--juice-switch-thumb-checked",
    "--juice-switch-track",
    "--juice-switch-track-checked",
    "--juice-tabs-focus-ring",
    "--juice-tabs-indicator",
    "--juice-tabs-list-rule",
    "--juice-tabs-text",
    "--juice-tabs-text-active",
    "--juice-tabs-text-hover",
    "--juice-tabs-trigger",
    "--juice-tabs-trigger-active",
    "--juice-tabs-trigger-hover",
    "--juice-textarea-border",
    "--juice-textarea-focus-ring",
    "--juice-textarea-ink",
    "--juice-textarea-placeholder",
    "--juice-textarea-surface",
    "--juice-toast-close",
    "--juice-toast-close-color",
    "--juice-toast-close-hover",
    "--juice-toast-error",
    "--juice-toast-error-soft",
    "--juice-toast-focus-ring",
    "--juice-toast-info",
    "--juice-toast-info-soft",
    "--juice-toast-ink",
    "--juice-toast-panel",
    "--juice-toast-panel-border",
    "--juice-toast-panel-shadow",
    "--juice-toast-success",
    "--juice-toast-success-soft",
    "--juice-toast-warning",
    "--juice-toast-warning-soft",
    "--juice-tooltip-ink",
    "--juice-tooltip-panel",
    "--juice-tooltip-panel-border",
    "--juice-tooltip-panel-shadow",
    "--juice-wizard-focus-ring",
    "--juice-wizard-header",
    "--juice-wizard-header-border",
    "--juice-wizard-panel",
    "--juice-wizard-panel-border",
    "--juice-wizard-rail",
    "--juice-wizard-rail-border",
    "--juice-wizard-shell",
    "--juice-wizard-step",
    "--juice-wizard-step-border",
    "--juice-wizard-step-complete",
    "--juice-wizard-step-connector",
    "--juice-wizard-step-current",
    "--juice-wizard-step-ink",
    "--juice-wizard-step-on",
] as const;

/**
 * Emerging token names. They must not move into `requiredJuiceBinds()`.
 * Other theme-contract §5 families are Emerging too; they are absent from
 * `FROZEN_REQUIRED_BINDS`, so adding one there is still a public-contract change.
 */
const EMERGING_TOKEN_NAMES = [
    "--juice-color-accent",
    "--juice-color-border",
    "--juice-color-heading",
    "--juice-color-highlight",
    "--juice-color-on-accent",
    "--juice-color-page",
    "--juice-color-surface",
    "--juice-color-text",
    "--juice-color-text-muted",
    "--juice-motion-duration-base",
    "--juice-motion-duration-fast",
    "--juice-motion-duration-instant",
    "--juice-motion-duration-slow",
    "--juice-motion-ease-enter",
    "--juice-motion-ease-exit",
    "--juice-motion-ease-in-out",
    "--juice-motion-ease-linear",
    "--juice-motion-ease-standard",
    "--juice-motion-ease-steps",
    "--juice-progress-indeterminate-duration",
    "--juice-progress-ratio",
    "--juice-slider-ratio",
    "--juice-spinner-spin-duration",
] as const;

const IDENTITY_PREFIXES = ["aqua", "kw", "cm", "tide", "jx"] as const;

/**
 * Core role helpers that carry the identity chain. Accordion uses short
 * names (`--aqua-#{$name}`, not `--aqua-accordion-`). Sheet is not in this
 * list; its helper falls through to drawer.
 */
const FROZEN_IDENTITY_HELPERS = [
    "accordion",
    "banner",
    "breadcrumb",
    "checkbox",
    "combobox",
    "disclosure",
    "drawer",
    "field",
    "input",
    "menu",
    "modal",
    "pagination",
    "popover",
    "progress",
    "radio",
    "select",
    "slider",
    "spinner",
    "switch",
    "tabs",
    "textarea",
    "toast",
    "tooltip",
    "wizard",
] as const;

const RETRO_PREFIXES = ["afb", "acg", "bdw", "dnd", "frr", "orc", "psp", "sgn", "ssm", "vpr"] as const;

type RoleHelper = { component: string; hops: string[]; body: string };

function hopName(raw: string): string {
    return raw.endsWith("-") ? raw.slice(0, -1) : raw;
}

function readRoleHelpers(): RoleHelper[] {
    const helpers: RoleHelper[] = [];
    const pattern = /@function\s+(-juice-[a-z0-9-]+-role)\([^)]*\)\s*\{([\s\S]*?)\n\}/g;
    for (const file of walkScss(join(SRC_DIR, "components"))) {
        const source = readText(file);
        for (const match of source.matchAll(pattern)) {
            const functionName = match[1] ?? "";
            const body = match[2] ?? "";
            const component = functionName.replace(/^-juice-/, "").replace(/-role$/, "");
            const hops = [...body.matchAll(/--([a-z0-9-]+)#\{\$name\}/g)].map((found) => hopName(found[1] ?? ""));
            helpers.push({ component, hops, body });
        }
    }
    return helpers;
}

function expectedIdentityHops(component: string): string[] {
    if (component === "accordion") return ["juice-accordion", ...IDENTITY_PREFIXES];
    return [`juice-${component}`, ...IDENTITY_PREFIXES.map((prefix) => `${prefix}-${component}`)];
}

type HostHook = {
    runtime: string;
    /** Spelling in the public-contract runtime table. */
    contract: string;
    file: string;
    fields: Record<string, string>;
};

/**
 * Default host queries. The contract table uses a compact spelling.
 * Navigation is three selectors covering `bar|links|mobile|sidebar`.
 * `<input input>`, `<textarea textarea>`, `<select select>`, and `<table table>`
 * are the element forms of the CSS selectors below. Slider's default query
 * also excludes `slider="vertical"`, which the slider runtime page states.
 * Table hosts are `[table]` elements that are `HTMLTableElement`.
 */
const FROZEN_HOST_HOOKS: HostHook[] = [
    {
        runtime: "navigation",
        contract: 'nav[type="bar|links|mobile|sidebar"]',
        file: "js/src/nav/navigation.ts",
        fields: {
            navSelector: 'nav[type="bar"], nav[type="links"]',
            sidebarSelector: 'nav[type="sidebar"]',
            toggleSelector: 'nav[type="mobile"]',
        },
    },
    {
        runtime: "menu",
        contract: "[menu-root]",
        file: "js/src/menu/menu-runtime.ts",
        fields: { rootSelector: "[menu-root]" },
    },
    {
        runtime: "tabs",
        contract: "[tabs]",
        file: "js/src/tabs/tabs-runtime.ts",
        fields: { tabsSelector: "[tabs]" },
    },
    {
        runtime: "breadcrumb",
        contract: "[breadcrumb]",
        file: "js/src/breadcrumb/breadcrumb-runtime.ts",
        fields: { breadcrumbSelector: "[breadcrumb]" },
    },
    {
        runtime: "pagination",
        contract: "[pagination]",
        file: "js/src/pagination/pagination-runtime.ts",
        fields: { paginationSelector: "[pagination]" },
    },
    {
        runtime: "modal",
        contract: "[modal-overlay]",
        file: "js/src/modal/modal-runtime.ts",
        fields: { overlaySelector: "[modal-overlay]" },
    },
    {
        runtime: "drawer",
        contract: "[drawer-overlay]",
        file: "js/src/drawer/drawer-runtime.ts",
        fields: { overlaySelector: "[drawer-overlay]" },
    },
    {
        runtime: "sheet",
        contract: "[sheet-overlay]",
        file: "js/src/sheet/sheet-runtime.ts",
        fields: { overlaySelector: "[sheet-overlay]" },
    },
    {
        runtime: "popover",
        contract: "[popover-root]",
        file: "js/src/popover/popover-runtime.ts",
        fields: { rootSelector: "[popover-root]" },
    },
    {
        runtime: "tooltip",
        contract: "[tooltip-root]",
        file: "js/src/tooltip/tooltip-runtime.ts",
        fields: { rootSelector: "[tooltip-root]" },
    },
    {
        runtime: "toast",
        contract: "[toast-region]",
        file: "js/src/toast/toast-runtime.ts",
        fields: { regionSelector: "[toast-region]" },
    },
    {
        runtime: "input",
        contract: "<input input>",
        file: "js/src/input/input-runtime.ts",
        fields: { inputSelector: "input[input]" },
    },
    {
        runtime: "textarea",
        contract: "<textarea textarea>",
        file: "js/src/textarea/textarea-runtime.ts",
        fields: { textareaSelector: "textarea[textarea]" },
    },
    {
        runtime: "select",
        contract: "<select select>",
        file: "js/src/select/select-runtime.ts",
        fields: { selectSelector: "select[select]" },
    },
    {
        runtime: "combobox",
        contract: "[combobox]",
        file: "js/src/combobox/combobox-runtime.ts",
        fields: { rootSelector: "[combobox]" },
    },
    {
        runtime: "checkbox",
        contract: "[checkbox]",
        file: "js/src/checkbox/checkbox-runtime.ts",
        fields: { checkboxSelector: "[checkbox]" },
    },
    {
        runtime: "radio",
        contract: "[radiogroup]",
        file: "js/src/radio/radio-runtime.ts",
        fields: { radiogroupSelector: "[radiogroup]" },
    },
    {
        runtime: "switch",
        contract: "[switch]",
        file: "js/src/switch/switch-runtime.ts",
        fields: { switchSelector: "[switch]" },
    },
    {
        runtime: "slider",
        contract: "[slider]",
        file: "js/src/slider/slider-runtime.ts",
        fields: { sliderSelector: '[slider]:not([slider="vertical"])' },
    },
    {
        runtime: "field",
        contract: "[field]",
        file: "js/src/field/field-runtime.ts",
        fields: { fieldSelector: "[field]" },
    },
    {
        runtime: "icon-button",
        contract: "[icon-button]",
        file: "js/src/icon-button/icon-button-runtime.ts",
        fields: { iconButtonSelector: "[icon-button]" },
    },
    {
        runtime: "pressable",
        contract: "[pressable]",
        file: "js/src/pressable/pressable-runtime.ts",
        fields: { pressableSelector: "[pressable]" },
    },
    {
        runtime: "touchable-row",
        contract: "[touchable-row]",
        file: "js/src/touchable-row/touchable-row-runtime.ts",
        fields: { touchableRowSelector: "[touchable-row]" },
    },
    {
        runtime: "banner",
        contract: "[banner]",
        file: "js/src/banner/banner-runtime.ts",
        fields: { bannerSelector: "[banner]" },
    },
    {
        runtime: "progress",
        contract: "[progress]",
        file: "js/src/progress/progress-runtime.ts",
        fields: { progressSelector: "[progress]" },
    },
    {
        runtime: "spinner",
        contract: "[spinner]",
        file: "js/src/spinner/spinner-runtime.ts",
        fields: { spinnerSelector: "[spinner]" },
    },
    {
        runtime: "accordion",
        contract: "[accordion]",
        file: "js/src/accordion/accordion-runtime.ts",
        fields: { accordionSelector: "[accordion]" },
    },
    {
        runtime: "disclosure",
        contract: "[disclosure]",
        file: "js/src/disclosure/disclosure-runtime.ts",
        fields: { disclosureSelector: "[disclosure]" },
    },
    {
        runtime: "wizard",
        contract: "[wizard-shell]",
        file: "js/src/wizard/wizard-runtime.ts",
        fields: { shellSelector: "[wizard-shell]" },
    },
    {
        runtime: "avatar",
        contract: "[avatar]",
        file: "js/src/avatar/avatar-runtime.ts",
        fields: { avatarSelector: "[avatar]" },
    },
    {
        runtime: "table",
        contract: "<table table>",
        file: "js/src/table/table-runtime.ts",
        fields: { tableSelector: "[table]" },
    },
    {
        runtime: "keyboard-avoider",
        contract: "[keyboard-avoider]",
        file: "js/src/keyboard-avoider/keyboard-avoider-runtime.ts",
        fields: { keyboardAvoiderSelector: "[keyboard-avoider]" },
    },
];

function readStringDefaults(source: string, file: string): Record<string, string> {
    const start = source.search(/const DEFAULTS\b/);
    if (start < 0) throw new Error(`${file} has no DEFAULTS object`);
    const open = source.indexOf("{", start);
    let depth = 0;
    let close = open;
    for (let i = open; i < source.length; i += 1) {
        if (source[i] === "{") depth += 1;
        else if (source[i] === "}") {
            depth -= 1;
            if (depth === 0) {
                close = i;
                break;
            }
        }
    }
    const body = source.slice(open + 1, close);
    const fields: Record<string, string> = {};
    for (const match of body.matchAll(/(\w+)\s*:\s*'([^']*)'/g)) {
        const name = match[1];
        const value = match[2];
        if (name && value !== undefined) fields[name] = value;
    }
    return fields;
}

/**
 * Documented P0 and P1 `[motion]` values from juice-animations.md, which the
 * public contract freezes. Sorted. `bounce:in` and `bounce:out` are not in
 * that catalog; see the catalog test.
 */
const FROZEN_MOTION_VALUES = [
    "accordion",
    "bg.alive",
    "blink",
    "blink:fast",
    "blink:signal",
    "blink:slow",
    "blink:terminal",
    "bounce",
    "bounce-in",
    "bounce-out",
    "bounce.in",
    "bounce.out",
    "fade.in",
    "fade.in.down",
    "fade.in.down::fast",
    "fade.in.up",
    "fade.in.up::fast",
    "fade.in::fast",
    "fade.out",
    "fade.out.down",
    "fade.out.up",
    "flash:red",
    "flicker",
    "grow",
    "pulse",
    "slideIn.left",
    "slideIn.left::fast",
    "slideIn.left::slow",
    "slideOut.down",
    "slideOut.down::fast",
    "slideOut.left",
    "slideOut.left::fast",
    "slideOut.right",
    "slideOut.right::fast",
    "slideOut.up",
    "slideOut.up::fast",
    "spin",
    "spin::fast",
    "spin::slow",
    "tilt",
    "turn",
    "turn::fast",
    "turn::slow",
    "wiggle",
] as const;

/**
 * Attribute values matched by `[motion="bounce\:in"]` and `[motion="bounce\:out"]`
 * in bounce.scss. The P1 table names `bounce.in` / `bounce-in` and
 * `bounce.out` / `bounce-out`, not these colon spellings. Pinned so a new
 * catalog value cannot slip through. They are not Frozen names in the doc.
 */
const MOTION_VALUES_IN_SOURCE_NOT_IN_CONTRACT = ["bounce:in", "bounce:out"] as const;

const FROZEN_BLINK_ALIAS_VALUES = ["blink", "blink:fast", "blink:signal", "blink:slow", "blink:terminal"] as const;

const FROZEN_MOTION_STATES = ["entered", "entering", "exited", "exiting"] as const;

function unescapeMotionValue(value: string): string {
    return value.replace(/\\:/g, ":");
}

function attributeValues(source: string, attribute: string): string[] {
    const values = new Set<string>();
    const pattern = new RegExp(`\\[${attribute}="([^"]+)"\\]`, "g");
    for (const match of source.matchAll(pattern)) {
        const value = match[1];
        if (value) values.add(unescapeMotionValue(value));
    }
    return sorted(values);
}

function animationCatalog(): { motion: string[]; animation: string[]; animate: string[] } {
    // Gradient `animation="flow|fall"` lives under styles/gradients and is a
    // separate namespace, not the Frozen [motion] catalog.
    const motion = new Set<string>();
    const animation = new Set<string>();
    const animate = new Set<string>();
    for (const file of walkScss(join(SRC_DIR, "styles", "animations"))) {
        const source = stripComments(readText(file));
        for (const value of attributeValues(source, "motion")) motion.add(value);
        for (const value of attributeValues(source, "animation")) animation.add(value);
        for (const value of attributeValues(source, "animate")) animate.add(value);
    }
    return { motion: sorted(motion), animation: sorted(animation), animate: sorted(animate) };
}

describe("Juice 1.0 public contract", () => {
    it("frozen package.json exports map matches the 1.0 public contract", () => {
        const pkg = JSON.parse(readText(join(PACKAGE_ROOT, "package.json"))) as {
            exports?: Record<string, PackageExportTarget>;
        };
        const actual = normalizeExports(pkg.exports ?? {});
        const expected = frozenExportMap();

        expect(SHIPPED_LIBRARY_THEMES.map((theme) => theme.id), contractBreak("shipped theme ids")).toEqual([
            ...FROZEN_THEME_IDS,
        ]);
        expect(Object.keys(actual), contractBreak("package.json exports keys")).toEqual(Object.keys(expected));
        expect(actual, contractBreak("package.json exports map, including wildcard and theme targets")).toEqual(
            expected
        );
    });

    it("frozen value exports from the built entry match the 1.0 public contract", async () => {
        const built = await builtValueKeys();
        const fromSource = valueExportsFromEntrySource(readText(join(SRC_DIR, "index.ts")));
        expect(built.keys, "built dist/index.js value exports differ from src/index.ts").toEqual(fromSource);

        const frozen = frozenValueExports();
        const frozenSet = new Set(frozen);
        const emergingSet = new Set<string>(EMERGING_VALUE_EXPORTS);
        const unclassified = built.keys.filter((name) => !frozenSet.has(name) && !emergingSet.has(name));
        const actualFrozen = built.keys.filter((name) => frozenSet.has(name));

        expect(
            unclassified,
            contractBreak(
                "value export is neither Frozen nor on the Emerging list. Classify it before it ships"
            )
        ).toEqual([]);
        expect(actualFrozen, contractBreak("value exports from the package entry")).toEqual(frozen);
        for (const name of INTERNAL_CHANGE_HELPERS) {
            expect(built.keys, contractBreak(`internal helper ${name} is a value export`)).not.toContain(name);
        }
    });

    it("emerging value exports are listed apart from the frozen contract", async () => {
        const built = await builtValueKeys();
        const emergingSet = new Set<string>(EMERGING_VALUE_EXPORTS);
        const actual = built.keys.filter((name) => emergingSet.has(name));

        expect(actual, emergingDrift("value exports from the package entry")).toEqual([...EMERGING_VALUE_EXPORTS]);
    });

    it("frozen required --juice-* bind names match the 1.0 public contract", () => {
        expect(sorted(requiredJuiceBinds()), contractBreak("required --juice-* bind names")).toEqual([
            ...FROZEN_REQUIRED_BINDS,
        ]);
    });

    it("emerging token names stay out of the required bind list", () => {
        const required = new Set(requiredJuiceBinds());
        const emerging = [
            ...EMERGING_TOKEN_NAMES,
            ...optionalAccordionBinds(),
            ...optionalTabsBinds(),
        ];
        const promoted = emerging.filter((name) => required.has(name));

        expect(promoted, contractBreak("an Emerging token is in the required --juice-* bind list")).toEqual([]);
    });

    it("frozen identity-prefix fallback chain matches the 1.0 public contract", () => {
        const helpers = readRoleHelpers();
        const byComponent = new Map(helpers.map((helper) => [helper.component, helper]));

        expect(
            sorted(helpers.map((helper) => helper.component)),
            contractBreak("core role helpers")
        ).toEqual(sorted([...FROZEN_IDENTITY_HELPERS, "sheet"]));

        for (const component of FROZEN_IDENTITY_HELPERS) {
            const helper = byComponent.get(component);
            expect(helper, contractBreak(`${component} role helper is missing`)).toBeDefined();
            expect(helper?.hops, contractBreak(`${component} identity-prefix fallback chain`)).toEqual(
                expectedIdentityHops(component)
            );
        }

        const sheet = byComponent.get("sheet");
        expect(
            sheet?.hops,
            contractBreak("sheet role helper is outside the identity chain and falls through to drawer")
        ).toEqual(["juice-sheet", "juice-drawer"]);

        for (const helper of helpers) {
            for (const prefix of RETRO_PREFIXES) {
                expect(
                    helper.body.includes(`--${prefix}-`),
                    contractBreak(`retro prefix --${prefix}- is in the ${helper.component} role helper`)
                ).toBe(false);
            }
        }
    });

    it("frozen CRT host hook selectors match the 1.0 public contract", () => {
        expect(FROZEN_HOST_HOOKS, contractBreak("CRT host hook count")).toHaveLength(FROZEN_RUNTIME_STEMS.length);

        for (const hook of FROZEN_HOST_HOOKS) {
            const source = readText(join(SRC_DIR, hook.file));
            const defaults = readStringDefaults(source, hook.file);
            for (const [field, selector] of Object.entries(hook.fields)) {
                expect(defaults[field], contractBreak(`${hook.runtime} ${field} (${hook.contract})`)).toBe(selector);
            }
        }

        const navigation = readText(join(SRC_DIR, "js/src/nav/navigation.ts"));
        const navigationDefaults = readStringDefaults(navigation, "js/src/nav/navigation.ts");
        const typeValues = sorted(
            [...Object.values(navigationDefaults).join(" ").matchAll(/type="([^"]+)"/g)]
                .map((match) => match[1] ?? "")
                .filter(Boolean)
        );
        expect(typeValues, contractBreak('navigation type values nav[type="bar|links|mobile|sidebar"]')).toEqual([
            "bar",
            "links",
            "mobile",
            "sidebar",
        ]);
        for (const call of ["setAttribute('hidden'", "removeAttribute('hidden'", "hasAttribute('hidden'"]) {
            expect(navigation, contractBreak("navigation sidebar hidden attribute")).toContain(call);
        }

        const table = readText(join(SRC_DIR, "js/src/table/table-runtime.ts"));
        expect(table, contractBreak("table host is <table table> via HTMLTableElement")).toContain(
            "instanceof HTMLTableElement"
        );
    });

    it("frozen [motion] catalog matches the documented P0 and P1 values", () => {
        const { motion } = animationCatalog();
        const documented = new Set<string>(FROZEN_MOTION_VALUES);
        const missing = FROZEN_MOTION_VALUES.filter((value) => !motion.includes(value));
        const extras = motion.filter((value) => !documented.has(value));

        expect(missing, contractBreak("[motion] catalog removed a documented P0 or P1 value")).toEqual([]);
        expect(
            extras,
            contractBreak(
                "[motion] catalog values that are not in the documented P0/P1 list. bounce:in and bounce:out are in bounce.scss and are not named in juice-public-contract.md; they are pinned so a new value cannot slip through"
            )
        ).toEqual([...MOTION_VALUES_IN_SOURCE_NOT_IN_CONTRACT]);
    });

    it("frozen blink animation and animate aliases match the 1.0 public contract", () => {
        const { animation, animate } = animationCatalog();
        const aliases = [...FROZEN_BLINK_ALIAS_VALUES];

        expect(animation, contractBreak('deprecated [animation] aliases are blink-only')).toEqual(aliases);
        expect(animate, contractBreak('deprecated [animate] aliases are blink-only')).toEqual(aliases);
    });

    it("frozen data-motion-state attribute and values match the 1.0 public contract", () => {
        const motion = readText(join(SRC_DIR, "js/src/shared/motion.ts"));
        const type = motion.match(/export type MotionState = ([^;]+);/);
        const states = sorted(
            (type?.[1] ?? "")
                .split("|")
                .map((part) => part.trim().replace(/['"]/g, ""))
                .filter(Boolean)
        );

        expect(motion, contractBreak("data-motion-state attribute name")).toContain("setAttribute('data-motion-state'");
        expect(states, contractBreak("data-motion-state values")).toEqual([...FROZEN_MOTION_STATES]);

        for (const file of [
            "js/src/accordion/accordion-runtime.ts",
            "js/src/disclosure/disclosure-runtime.ts",
        ]) {
            expect(
                readText(join(SRC_DIR, file)),
                contractBreak(`${file} sets data-motion-state`)
            ).toContain("setAttribute('data-motion-state'");
        }
    });

    it("frozen juice:change event name matches the 1.0 public contract", async () => {
        const built = await builtValueKeys();
        const source = readText(join(SRC_DIR, "js/src/shared/change.ts"));

        expect(built.juiceChange, contractBreak("JUICE_CHANGE_EVENT value export")).toBe("juice:change");
        expect(source, contractBreak("JUICE_CHANGE_EVENT constant")).toContain(
            "export const JUICE_CHANGE_EVENT = 'juice:change'"
        );
    });
});
