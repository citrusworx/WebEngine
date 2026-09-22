import {
  CORE_THEMES,
  DEFAULT_THEME,
  isThemeId,
  RETRO_THEMES,
  THEME_STORAGE_KEY,
  type ThemeId
} from "./themes";

const THEME_GROUP = "[data-theme-group]";
const THEME_KEYS = new Set(["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"]);

const fillSelect = (select: HTMLSelectElement) => {
  if (select.dataset.themeSelectReady === "true") {
    return;
  }
  select.replaceChildren();
  for (const [label, group] of [
    ["Core", CORE_THEMES],
    ["Retro", RETRO_THEMES]
  ] as const) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = label;
    for (const theme of group) {
      const option = document.createElement("option");
      option.value = theme.id;
      option.textContent = theme.label;
      optgroup.append(option);
    }
    select.append(optgroup);
  }
  select.dataset.themeSelectReady = "true";
};

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

  for (const select of document.querySelectorAll<HTMLSelectElement>("select[data-theme-select]")) {
    select.value = theme;
  }
};

const applyTheme = (theme: ThemeId) => {
  document.body.setAttribute("theme", theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  syncThemeControls(theme);
};

export const bindThemeSwitch = () => {
  document.querySelectorAll<HTMLSelectElement>("select[data-theme-select]").forEach(fillSelect);

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  applyTheme(isThemeId(stored) ? stored : DEFAULT_THEME);

  document.querySelectorAll<HTMLButtonElement>("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      if (isThemeId(button.dataset.theme)) {
        applyTheme(button.dataset.theme);
      }
    });
  });

  document.querySelectorAll<HTMLSelectElement>("select[data-theme-select]").forEach((select) => {
    select.addEventListener("change", () => {
      if (isThemeId(select.value)) {
        applyTheme(select.value);
      }
    });
  });

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
    if (!next || !isThemeId(next.dataset.theme)) {
      return;
    }
    event.preventDefault();
    applyTheme(next.dataset.theme);
    next.focus();
  });
};
