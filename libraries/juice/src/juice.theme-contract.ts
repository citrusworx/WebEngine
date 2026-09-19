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
 * Modal chrome uses `--jx-modal-*` aliases, same suffix pattern as tabs.
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
    ];
}
