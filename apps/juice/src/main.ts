import { createToast } from "@citrusworx/juiceui";
import { bindInstallCopy } from "./install-pm";

const THEMES = ["kiwipress", "tide", "citrusmint", "aquaflux"] as const;

type ThemeId = (typeof THEMES)[number];

const STORAGE_KEY = "juice-showcase-theme";
const DEFAULT_THEME: ThemeId = "kiwipress";

const isTheme = (value: string | null | undefined): value is ThemeId =>
  THEMES.includes(value as ThemeId);

const THEME_GROUP = "[data-theme-group]";

const syncThemeControls = (theme: ThemeId) => {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme]")) {
    const pressed = button.dataset.theme === theme;
    const inGroup = Boolean(button.closest(THEME_GROUP));
    if (inGroup) {
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", pressed ? "true" : "false");
      button.tabIndex = pressed ? 0 : -1;
      button.removeAttribute("aria-pressed");
    } else {
      button.setAttribute("aria-pressed", pressed ? "true" : "false");
    }
    if (pressed) {
      button.removeAttribute("btn");
    } else {
      button.setAttribute("btn", "outline");
    }
  }

  for (const group of document.querySelectorAll<HTMLElement>(THEME_GROUP)) {
    const radios = [...group.querySelectorAll<HTMLButtonElement>("[data-theme]")];
    if (!radios.some((radio) => radio.tabIndex === 0) && radios[0]) {
      radios[0].tabIndex = 0;
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

const THEME_KEYS = new Set(["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"]);

document.addEventListener("keydown", (event) => {
  if (!THEME_KEYS.has(event.key)) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.matches("[data-theme]")) {
    return;
  }
  const group = target.closest<HTMLElement>(THEME_GROUP);
  if (!group) {
    return;
  }
  const radios = [...group.querySelectorAll<HTMLButtonElement>("[data-theme]")];
  const index = radios.indexOf(target);
  if (index < 0 || radios.length === 0) {
    return;
  }
  let nextIndex = index;
  if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = radios.length - 1;
  } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (index + 1) % radios.length;
  } else {
    nextIndex = (index - 1 + radios.length) % radios.length;
  }
  const next = radios[nextIndex];
  if (!next || !isTheme(next.dataset.theme)) {
    return;
  }
  event.preventDefault();
  applyTheme(next.dataset.theme);
  next.focus();
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

bindInstallCopy();

const toastController = createToast();

document.querySelectorAll<HTMLButtonElement>("[data-toast-show]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.toastShow;
    if (!id) {
      return;
    }
    toastController.show(document.getElementById(id));
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-toast-dismiss]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.toastDismiss;
    if (!id) {
      return;
    }
    toastController.dismiss(document.getElementById(id));
  });
});
