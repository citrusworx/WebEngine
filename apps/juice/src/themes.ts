/**
 * Shipped library themes for the Juice showcase.
 * Ids match `@citrusworx/juiceui` exports (`styles/themes/<id>` and `themes/<id>.css`).
 * Blush and anything under `_draft` are not in this list.
 * Each retro id is its own stylesheet — there is no `themes/retro` barrel.
 */
export const CORE_THEMES = [
  { id: "kiwipress", label: "KiwiPress" },
  { id: "tide", label: "Tide" },
  { id: "citrusmint", label: "Citrusmint" },
  { id: "aquaflux", label: "Aquaflux" }
] as const;

export const RETRO_THEMES = [
  { id: "retro-afterburn", label: "Afterburn" },
  { id: "retro-arcade-glow", label: "Arcade Glow" },
  { id: "retro-boardwalk", label: "Boardwalk" },
  { id: "retro-denim-dial", label: "Denim Dial" },
  { id: "retro-forest-radio", label: "Forest Radio" },
  { id: "retro-orchard-club", label: "Orchard Club" },
  { id: "retro-poolside-pop", label: "Poolside Pop" },
  { id: "retro-signal-garden", label: "Signal Garden" },
  { id: "retro-sunset-motel", label: "Sunset Motel" },
  { id: "retro-violet-parlor", label: "Violet Parlor" }
] as const;

export const THEMES = [...CORE_THEMES, ...RETRO_THEMES] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const THEME_IDS: readonly ThemeId[] = THEMES.map((theme) => theme.id);

export const DEFAULT_THEME: ThemeId = "kiwipress";

export const THEME_STORAGE_KEY = "juice-showcase-theme";

export const isThemeId = (value: string | null | undefined): value is ThemeId =>
  THEME_IDS.includes(value as ThemeId);
