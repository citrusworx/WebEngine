import { catalog } from "virtual:juice-docs";
import type { DocNavGroup, DocNavItem, DocPage } from "./docs/types";
import "./docs.css";

const article = document.querySelector<HTMLElement>("#doc-article");
const navRoot = document.querySelector<HTMLElement>("#doc-nav");
const tocRoot = document.querySelector<HTMLElement>("#doc-toc");
const crumb = document.querySelector<HTMLElement>("#doc-crumb");
const filename = document.querySelector<HTMLElement>("#doc-filename");
const meta = document.querySelector<HTMLElement>("#doc-meta");
const search = document.querySelector<HTMLInputElement>("#doc-search");
const searchHint = document.querySelector<HTMLElement>("#doc-search-hint");
const navToggle = document.querySelector<HTMLButtonElement>("#doc-nav-toggle");
const sidebar = document.querySelector<HTMLElement>("[docs-sidebar]");

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

const pageIdFromPath = (pathname: string): string => {
  if (
    pathname === "/docs" ||
    pathname === "/docs/" ||
    pathname === "/docs/index.html" ||
    pathname === "/docs.html"
  ) {
    return catalog.defaultPageId;
  }
  if (pathname === "/docs/course/" || pathname === "/docs/course/index.html") {
    return "course/README";
  }
  const match = pathname.match(/^\/docs\/(.+?)\.html$/);
  if (!match?.[1]) {
    return catalog.defaultPageId;
  }
  return decodeURIComponent(match[1]);
};

const groupLabel = (groupId: string): string =>
  catalog.nav.find((group: DocNavGroup) => group.id === groupId)?.label ?? "Docs";

const currentPage = (): DocPage | undefined => catalog.pages[pageIdFromPath(window.location.pathname)];

const renderNav = (query = "") => {
  if (!navRoot) {
    return;
  }
  const needle = query.trim().toLowerCase();
  const page = currentPage();
  const groups = catalog.nav
    .map((group: DocNavGroup) => ({
      ...group,
        items: group.items.filter((item: DocNavItem) => {
        if (!needle) {
          return true;
        }
        return item.title.toLowerCase().includes(needle) || item.filename.toLowerCase().includes(needle);
      })
    }))
    .filter((group: DocNavGroup) => group.items.length > 0);

  navRoot.innerHTML = groups
    .map((group: DocNavGroup) => navGroupMarkup(group, page?.id, Boolean(needle)))
    .join("");
};

const navGroupMarkup = (group: DocNavGroup, activeId: string | undefined, forceOpen: boolean): string => {
  const open = forceOpen || group.items.some((item) => item.id === activeId) || group.id === "start";
  const items = group.items
    .map((item) => {
      const current = item.id === activeId ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${current}>${item.title}</a>`;
    })
    .join("");
  return `<details${open ? " open" : ""}>
    <summary>${group.label}</summary>
    <div stack gap="0.15rem">${items}</div>
  </details>`;
};

const renderToc = (page: DocPage) => {
  if (!tocRoot) {
    return;
  }
  const headings = page.toc.filter((heading) => heading.level === 2 || heading.level === 3);
  if (headings.length === 0) {
    tocRoot.innerHTML = `<p docs-toc-empty>No headings</p>`;
    return;
  }
  tocRoot.innerHTML = headings
    .map(
      (heading) =>
        `<a href="#${heading.id}" data-level="${heading.level}">${heading.text}</a>`
    )
    .join("");
};

const renderPage = (page: DocPage) => {
  if (article) {
    article.innerHTML = page.html;
  }
  if (filename) {
    filename.textContent = page.filename;
  }
  if (meta) {
    meta.textContent = `v${catalog.version}`;
  }
  if (crumb) {
    crumb.textContent = `Docs › ${groupLabel(page.group)} › ${page.title}`;
  }
  document.title = `${page.title} — Juice Docs`;
  renderNav(search?.value ?? "");
  renderToc(page);
  highlightTocFromHash();
};

const highlightTocFromHash = () => {
  if (!tocRoot) {
    return;
  }
  const hash = window.location.hash.slice(1);
  for (const link of tocRoot.querySelectorAll("a")) {
    const href = link.getAttribute("href") ?? "";
    const id = href.startsWith("#") ? href.slice(1) : "";
    if (id && id === hash) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
};

const showPage = (id: string, replace = false) => {
  const page = catalog.pages[id] ?? catalog.pages[catalog.defaultPageId];
  if (!page) {
    if (article) {
      article.innerHTML = "<h1>Page not found</h1><p>That docs page is not in the hosted tree.</p>";
    }
    return;
  }
  const nextUrl = `${page.href}${window.location.hash}`;
  if (replace) {
    window.history.replaceState({ id: page.id }, "", nextUrl);
  } else if (window.location.pathname !== page.href) {
    window.history.pushState({ id: page.id }, "", nextUrl);
  }
  renderPage(page);
};

const resolveInternalDocHref = (href: string): string | null => {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return null;
    }
    if (url.pathname === "/docs" || url.pathname === "/docs/" || url.pathname.startsWith("/docs/")) {
      return `${url.pathname}${url.hash}`;
    }
    return null;
  } catch {
    return null;
  }
};

const boot = () => {
  if (searchHint) {
    searchHint.textContent = isMac ? "⌘K" : "Ctrl K";
  }
  if (meta) {
    meta.textContent = `v${catalog.version}`;
  }

  const initial = pageIdFromPath(window.location.pathname);
  const page = catalog.pages[initial];
  if (page) {
    renderPage(page);
  } else {
    showPage(catalog.defaultPageId, true);
  }

  search?.addEventListener("input", () => {
    renderNav(search.value);
  });

  document.addEventListener("keydown", (event) => {
    const metaKey = isMac ? event.metaKey : event.ctrlKey;
    if (metaKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      search?.focus();
    }
    if (event.key === "Escape" && search && document.activeElement === search) {
      search.value = "";
      renderNav("");
      search.blur();
    }
  });

  navToggle?.addEventListener("click", () => {
    if (!sidebar) {
      return;
    }
    const collapsed = sidebar.hasAttribute("data-collapsed");
    if (collapsed) {
      sidebar.removeAttribute("data-collapsed");
      navToggle.setAttribute("aria-expanded", "true");
    } else {
      sidebar.setAttribute("data-collapsed", "");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  if (window.matchMedia("(max-width: 800px)").matches) {
    sidebar?.setAttribute("data-collapsed", "");
    navToggle?.setAttribute("aria-expanded", "false");
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const anchor = target.closest("a");
    if (!anchor) {
      return;
    }
    const href = anchor.getAttribute("href");
    if (!href) {
      return;
    }
    if (href.startsWith("#")) {
      return;
    }
    const internal = resolveInternalDocHref(href);
    if (!internal) {
      return;
    }
    event.preventDefault();
    const url = new URL(internal, window.location.origin);
    const id = pageIdFromPath(url.pathname);
    const page = catalog.pages[id] ?? catalog.pages[catalog.defaultPageId];
    if (!page) {
      return;
    }
    window.history.pushState({ id: page.id }, "", internal);
    renderPage(page);
    if (url.hash) {
      document.getElementById(url.hash.slice(1))?.scrollIntoView();
      highlightTocFromHash();
      return;
    }
    window.scrollTo({ top: 0 });
  });

  window.addEventListener("popstate", () => {
    const id = pageIdFromPath(window.location.pathname);
    const next = catalog.pages[id] ?? catalog.pages[catalog.defaultPageId];
    if (next) {
      renderPage(next);
    }
  });

  window.addEventListener("hashchange", highlightTocFromHash);
};

boot();
