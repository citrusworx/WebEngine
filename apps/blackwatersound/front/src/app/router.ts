import { Signal } from "@citrusworx/sigjs";

export const currentPath = Signal(window.location.pathname || "/");

let installed = false;

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function navigate(path: string) {
  if (path === currentPath.get()) {
    return;
  }

  window.history.pushState({}, "", path);
  currentPath.set(path);
  scrollToTop();
}

export function installNavigation() {
  if (installed) {
    return;
  }

  installed = true;

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a");

    if (!anchor) {
      return;
    }

    if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
      return;
    }

    const href = anchor.getAttribute("href");

    if (!href || !isInternalHref(href)) {
      return;
    }

    event.preventDefault();
    navigate(href);
  });

  window.addEventListener("popstate", () => {
    currentPath.set(window.location.pathname || "/");
    scrollToTop();
  });
}
