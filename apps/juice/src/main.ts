import "@citrusworx/juiceui";

const THEMES = ["kiwipress", "tide", "citrusmint", "aquaflux"] as const;

type ThemeId = (typeof THEMES)[number];

const STORAGE_KEY = "juice-showcase-theme";
const DEFAULT_THEME: ThemeId = "kiwipress";

const isTheme = (value: string | null | undefined): value is ThemeId =>
  THEMES.includes(value as ThemeId);

const syncThemeControls = (theme: ThemeId) => {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme]")) {
    const pressed = button.dataset.theme === theme;
    button.setAttribute("aria-pressed", pressed ? "true" : "false");
    if (pressed) {
      button.removeAttribute("btn");
    } else {
      button.setAttribute("btn", "outline");
    }
  }
};

const applyTheme = (theme: ThemeId) => {
  document.body.setAttribute("theme", theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
  syncThemeControls(theme);
};

const stored = window.localStorage.getItem(STORAGE_KEY);
applyTheme(isTheme(stored) ? stored : DEFAULT_THEME);

document.querySelectorAll<HTMLButtonElement>("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    if (isTheme(button.dataset.theme)) {
      applyTheme(button.dataset.theme);
    }
  });
});

document.querySelectorAll<HTMLElement>("[data-href]").forEach((element) => {
  element.addEventListener("click", () => {
    const href = element.dataset.href;
    if (!href) {
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.assign(href);
  });
});
