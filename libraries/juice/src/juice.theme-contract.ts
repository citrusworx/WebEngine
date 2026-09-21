/**
 * Machine-readable Juice Theme Contract (required vs optional `--juice-*` binds).
 *
 * Canonical prose: docs/juice/juice-theme-contract.md
 * Machine check: juice.theme-contract.test.ts
 *
 * Not a public package export. Tests and the generator suite import this list so
 * a dropped required bind fails `yarn workspace @citrusworx/juiceui verify`.
 */

export const SHIPPED_LIBRARY_THEMES = [
    { id: "aquaflux", prefix: "aqua" },
    { id: "kiwipress", prefix: "kw" },
    { id: "citrusmint", prefix: "cm" },
    { id: "tide", prefix: "tide" },
] as const;

export type ShippedLibraryThemeId = (typeof SHIPPED_LIBRARY_THEMES)[number]["id"];

/** Accordion core — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_ACCORDION_ROLES = [
    "trigger",
    "trigger-hover",
    "trigger-open",
    "chevron",
    "panel-rule",
    "focus-ring",
] as const;

/** Tabs core — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_TABS_ROLES = [
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

/** Modal chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_MODAL_ROLES = [
    "overlay",
    "panel",
    "panel-border",
    "panel-shadow",
    "close",
    "close-color",
    "close-hover",
    "focus-ring",
] as const;

/** Drawer chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_DRAWER_ROLES = [
    "overlay",
    "panel",
    "panel-border",
    "panel-shadow",
    "close",
    "close-color",
    "close-hover",
    "focus-ring",
] as const;

/** Toast chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_TOAST_ROLES = [
    "panel",
    "panel-border",
    "panel-shadow",
    "ink",
    "close",
    "close-color",
    "close-hover",
    "focus-ring",
    "success",
    "success-soft",
    "error",
    "error-soft",
    "info",
    "info-soft",
    "warning",
    "warning-soft",
] as const;

/** Banner chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_BANNER_ROLES = [
    "panel",
    "panel-border",
    "ink",
    "close",
    "close-color",
    "close-hover",
    "focus-ring",
    "success",
    "success-soft",
    "error",
    "error-soft",
    "info",
    "info-soft",
    "warning",
    "warning-soft",
] as const;

/** Popover chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_POPOVER_ROLES = [
    "panel",
    "panel-border",
    "panel-shadow",
    "ink",
    "close",
    "close-color",
    "close-hover",
    "focus-ring",
] as const;

/** Tooltip chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_TOOLTIP_ROLES = [
    "panel",
    "panel-border",
    "panel-shadow",
    "ink",
] as const;

/** Combobox chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_COMBOBOX_ROLES = [
    "input",
    "input-border",
    "input-ink",
    "list",
    "list-border",
    "list-shadow",
    "option",
    "option-hover",
    "option-selected",
    "option-ink",
    "trigger",
    "trigger-ink",
    "focus-ring",
] as const;

/** Menu chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_MENU_ROLES = [
    "panel",
    "panel-border",
    "panel-shadow",
    "ink",
    "item",
    "item-hover",
    "item-active",
    "separator",
    "focus-ring",
    "opener",
    "opener-ink",
] as const;

/** Switch chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_SWITCH_ROLES = [
    "track",
    "track-checked",
    "thumb",
    "thumb-checked",
    "focus-ring",
] as const;

/** Slider chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_SLIDER_ROLES = [
    "track",
    "track-border",
    "fill",
    "thumb",
    "thumb-border",
    "thumb-shadow",
    "focus-ring",
] as const;

/** Checkbox chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_CHECKBOX_ROLES = [
    "control",
    "control-checked",
    "border",
    "border-checked",
    "mark",
    "focus-ring",
] as const;

/** Radio chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_RADIO_ROLES = [
    "control",
    "control-checked",
    "border",
    "border-checked",
    "mark",
    "focus-ring",
] as const;

/** Breadcrumb chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_BREADCRUMB_ROLES = [
    "ink",
    "ink-current",
    "ink-hover",
    "separator",
    "focus-ring",
    "surface",
] as const;

/** Wizard chrome — required on every shipped library theme and generated `--jx-*` themes. */
export const REQUIRED_WIZARD_ROLES = [
    "shell",
    "header",
    "header-border",
    "rail",
    "rail-border",
    "step",
    "step-border",
    "step-ink",
    "step-current",
    "step-complete",
    "step-on",
    "step-connector",
    "panel",
    "panel-border",
    "focus-ring",
] as const;

export const SURFACE_TONES = ["soft", "strong", "muted"] as const;
export const SURFACE_TONE_ROLES = ["bg", "border", "shadow", "blur"] as const;
export const BORDER_STRENGTHS = ["soft", "bold"] as const;
export const BORDER_STRENGTH_ROLES = ["width", "color"] as const;
export const SHADOW_TONES = ["cool", "warm"] as const;
export const SHADOW_TONE_ROLES = ["color", "shadow"] as const;
export const OVERLAYS = ["frost", "tint"] as const;
export const OVERLAY_ROLES = ["wash", "layer"] as const;
/** Surface-depth slice C recipes. Core composition — not a required bind family. */
export const SURFACE_VARIANTS = ["monochromatic", "glass", "tinted"] as const;

/**
 * Optional accordion hooks consumed with transparent / no-op fallbacks.
 * Tide binds all of these. Other shipped themes omit them.
 */
export const OPTIONAL_ACCORDION_ROLE_HOOKS = [
    "item-border",
    "item-border-open",
    "trigger-accent",
    "panel",
    "open-glow",
] as const;

export const OPTIONAL_ACCORDION_CHEVRON_METRICS = ["chevron-size", "chevron-weight"] as const;

export const OPTIONAL_ACCORDION_ROLES = [
    ...OPTIONAL_ACCORDION_ROLE_HOOKS,
    ...OPTIONAL_ACCORDION_CHEVRON_METRICS,
] as const;

/** Optional tabs hooks. Tide binds `panel` only. Other shipped themes bind neither. */
export const OPTIONAL_TABS_ROLES = ["panel", "panel-rule"] as const;
export const TIDE_OPTIONAL_TABS_ROLES = ["panel"] as const;

/** Standalone blur is a core utility, not a per-theme role. */
export const STANDALONE_BLUR_ROLES = ["--juice-blur-sm", "--juice-blur-md"] as const;

export function requiredAccordionBinds(): string[] {
    return REQUIRED_ACCORDION_ROLES.map((role) => `--juice-accordion-${role}`);
}

export function requiredTabsBinds(): string[] {
    return REQUIRED_TABS_ROLES.map((role) => `--juice-tabs-${role}`);
}

export function requiredModalBinds(): string[] {
    return REQUIRED_MODAL_ROLES.map((role) => `--juice-modal-${role}`);
}

export function requiredDrawerBinds(): string[] {
    return REQUIRED_DRAWER_ROLES.map((role) => `--juice-drawer-${role}`);
}

export function requiredToastBinds(): string[] {
    return REQUIRED_TOAST_ROLES.map((role) => `--juice-toast-${role}`);
}

export function requiredBannerBinds(): string[] {
    return REQUIRED_BANNER_ROLES.map((role) => `--juice-banner-${role}`);
}

export function requiredPopoverBinds(): string[] {
    return REQUIRED_POPOVER_ROLES.map((role) => `--juice-popover-${role}`);
}

export function requiredTooltipBinds(): string[] {
    return REQUIRED_TOOLTIP_ROLES.map((role) => `--juice-tooltip-${role}`);
}

export function requiredComboboxBinds(): string[] {
    return REQUIRED_COMBOBOX_ROLES.map((role) => `--juice-combobox-${role}`);
}

export function requiredMenuBinds(): string[] {
    return REQUIRED_MENU_ROLES.map((role) => `--juice-menu-${role}`);
}

export function requiredSwitchBinds(): string[] {
    return REQUIRED_SWITCH_ROLES.map((role) => `--juice-switch-${role}`);
}

export function requiredSliderBinds(): string[] {
    return REQUIRED_SLIDER_ROLES.map((role) => `--juice-slider-${role}`);
}

export function requiredCheckboxBinds(): string[] {
    return REQUIRED_CHECKBOX_ROLES.map((role) => `--juice-checkbox-${role}`);
}

export function requiredRadioBinds(): string[] {
    return REQUIRED_RADIO_ROLES.map((role) => `--juice-radio-${role}`);
}

export function requiredBreadcrumbBinds(): string[] {
    return REQUIRED_BREADCRUMB_ROLES.map((role) => `--juice-breadcrumb-${role}`);
}

export function requiredWizardBinds(): string[] {
    return REQUIRED_WIZARD_ROLES.map((role) => `--juice-wizard-${role}`);
}

export function requiredSurfaceToneBinds(): string[] {
    return SURFACE_TONES.flatMap((tone) =>
        SURFACE_TONE_ROLES.map((role) => `--juice-surface-${tone}-${role}`)
    );
}

export function requiredBorderStrengthBinds(): string[] {
    return BORDER_STRENGTHS.flatMap((strength) =>
        BORDER_STRENGTH_ROLES.map((role) => `--juice-border-strength-${strength}-${role}`)
    );
}

export function requiredShadowToneBinds(): string[] {
    return SHADOW_TONES.flatMap((tone) =>
        SHADOW_TONE_ROLES.map((role) => `--juice-shadow-tone-${tone}-${role}`)
    );
}

export function requiredOverlayBinds(): string[] {
    return OVERLAYS.flatMap((overlay) =>
        OVERLAY_ROLES.map((role) => `--juice-overlay-${overlay}-${role}`)
    );
}

/** Every required `--juice-*` bind from Theme Contract section 4. */
export function requiredJuiceBinds(): string[] {
    return [
        ...requiredAccordionBinds(),
        ...requiredTabsBinds(),
        ...requiredModalBinds(),
        ...requiredDrawerBinds(),
        ...requiredToastBinds(),
        ...requiredBannerBinds(),
        ...requiredPopoverBinds(),
        ...requiredTooltipBinds(),
        ...requiredComboboxBinds(),
        ...requiredMenuBinds(),
        ...requiredSwitchBinds(),
        ...requiredSliderBinds(),
        ...requiredCheckboxBinds(),
        ...requiredRadioBinds(),
        ...requiredBreadcrumbBinds(),
        ...requiredWizardBinds(),
        ...requiredSurfaceToneBinds(),
        ...requiredBorderStrengthBinds(),
        ...requiredShadowToneBinds(),
        ...requiredOverlayBinds(),
    ];
}

export function optionalAccordionBinds(): string[] {
    return OPTIONAL_ACCORDION_ROLES.map((role) => `--juice-accordion-${role}`);
}

export function optionalTabsBinds(): string[] {
    return OPTIONAL_TABS_ROLES.map((role) => `--juice-tabs-${role}`);
}

export function declaredCustomProperties(css: string): Set<string> {
    const names = new Set<string>();

    for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
        names.add(match[1]);
    }

    return names;
}

export function missingRequiredJuiceBinds(css: string): string[] {
    const declared = declaredCustomProperties(css);
    return requiredJuiceBinds().filter((name) => !declared.has(name));
}

/**
 * `--jx-*` → `--juice-*` declarations the generator already emits.
 * Surface / border-strength / shadow-tone / overlay roles bind `--juice-*` from `--jx-*`
 * tokens without a uniform suffix, so they are presence-checked only.
 * Modal, drawer, toast, banner, popover, tooltip, combobox, menu, switch, slider, checkbox, radio, breadcrumb, and wizard chrome use `--jx-modal-*` /
 * `--jx-drawer-*` / `--jx-toast-*` / `--jx-banner-*` / `--jx-popover-*` / `--jx-tooltip-*` /
 * `--jx-combobox-*` / `--jx-menu-*` / `--jx-switch-*` / `--jx-slider-*` / `--jx-checkbox-*` /
 * `--jx-radio-*` / `--jx-breadcrumb-*` / `--jx-wizard-*` aliases, same suffix pattern as tabs.
 */
export function requiredGeneratedJxJuiceBinds(): Array<{ juice: string; jx: string }> {
    return [
        ...REQUIRED_ACCORDION_ROLES.map((role) => ({
            juice: `--juice-accordion-${role}`,
            jx: `--jx-${role}`,
        })),
        ...REQUIRED_TABS_ROLES.map((role) => ({
            juice: `--juice-tabs-${role}`,
            jx: `--jx-tabs-${role}`,
        })),
        ...REQUIRED_MODAL_ROLES.map((role) => ({
            juice: `--juice-modal-${role}`,
            jx: `--jx-modal-${role}`,
        })),
        ...REQUIRED_DRAWER_ROLES.map((role) => ({
            juice: `--juice-drawer-${role}`,
            jx: `--jx-drawer-${role}`,
        })),
        ...REQUIRED_TOAST_ROLES.map((role) => ({
            juice: `--juice-toast-${role}`,
            jx: `--jx-toast-${role}`,
        })),
        ...REQUIRED_BANNER_ROLES.map((role) => ({
            juice: `--juice-banner-${role}`,
            jx: `--jx-banner-${role}`,
        })),
        ...REQUIRED_POPOVER_ROLES.map((role) => ({
            juice: `--juice-popover-${role}`,
            jx: `--jx-popover-${role}`,
        })),
        ...REQUIRED_TOOLTIP_ROLES.map((role) => ({
            juice: `--juice-tooltip-${role}`,
            jx: `--jx-tooltip-${role}`,
        })),
        ...REQUIRED_COMBOBOX_ROLES.map((role) => ({
            juice: `--juice-combobox-${role}`,
            jx: `--jx-combobox-${role}`,
        })),
        ...REQUIRED_MENU_ROLES.map((role) => ({
            juice: `--juice-menu-${role}`,
            jx: `--jx-menu-${role}`,
        })),
        ...REQUIRED_SWITCH_ROLES.map((role) => ({
            juice: `--juice-switch-${role}`,
            jx: `--jx-switch-${role}`,
        })),
        ...REQUIRED_SLIDER_ROLES.map((role) => ({
            juice: `--juice-slider-${role}`,
            jx: `--jx-slider-${role}`,
        })),
        ...REQUIRED_CHECKBOX_ROLES.map((role) => ({
            juice: `--juice-checkbox-${role}`,
            jx: `--jx-checkbox-${role}`,
        })),
        ...REQUIRED_RADIO_ROLES.map((role) => ({
            juice: `--juice-radio-${role}`,
            jx: `--jx-radio-${role}`,
        })),
        ...REQUIRED_BREADCRUMB_ROLES.map((role) => ({
            juice: `--juice-breadcrumb-${role}`,
            jx: `--jx-breadcrumb-${role}`,
        })),
        ...REQUIRED_WIZARD_ROLES.map((role) => ({
            juice: `--juice-wizard-${role}`,
            jx: `--jx-wizard-${role}`,
        })),
    ];
}
