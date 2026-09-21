import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked, type Tokens } from "marked";
import type { Plugin } from "vite";
import type { DocHeading, DocNavGroup, DocPage, DocsCatalog } from "./src/docs/types";

const VIRTUAL_ID = "virtual:juice-docs";
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

const pluginDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(pluginDir, "../..");
const docsRoot = resolve(repoRoot, "docs/juice");

const DEFAULT_PAGE_ID = "README";
const GITHUB_BLOB = "https://github.com/citrusworx/WebEngine/blob/master";

type GroupDef = {
  id: string;
  label: string;
  match: (pageId: string) => boolean;
};

const GROUP_DEFS: GroupDef[] = [
  {
    id: "start",
    label: "Start",
    match: (id) =>
      [
        "README",
        "juice-getting-started",
        "juice-page-tutorial",
        "juice-patterns",
        "juice-maturity-matrix",
        "juice-beta"
      ].includes(id)
  },
  {
    id: "course",
    label: "Course",
    match: (id) => id.startsWith("course/")
  },
  {
    id: "foundations",
    label: "Foundations",
    match: (id) =>
      [
        "juice-attributes",
        "juice-styles",
        "juice-layout",
        "juice-layout-flow",
        "juice-spacing",
        "juice-sizing",
        "juice-colors",
        "juice-typography-contract",
        "juice-typography",
        "juice-semantics",
        "juice-naming",
        "juice-layers",
        "juice-token-architecture",
        "juice-token-system",
        "juice-visual-design-language"
      ].includes(id)
  },
  {
    id: "surfaces",
    label: "Surfaces",
    match: (id) =>
      id.startsWith("juice-icons") ||
      ["juice-surfaces", "juice-surface-spec", "juice-cards", "juice-forms"].includes(id)
  },
  {
    id: "themes",
    label: "Themes",
    match: (id) =>
      ["juice-theme-contract", "juice-theme-authoring", "juice-theme-manual"].includes(id)
  },
  {
    id: "responsive",
    label: "Responsive",
    match: (id) => id.startsWith("juice-responsive-")
  },
  {
    id: "runtimes",
    label: "Runtimes",
    match: (id) =>
      id.endsWith("-runtime") ||
      id === "juice-runtime-behavior" ||
      id === "juice-navigation-lesson" ||
      id === "juice-navigation-patterns"
  },
  {
    id: "practice",
    label: "Practice",
    match: (id) =>
      [
        "juice-best-practices",
        "juice-anti-patterns",
        "juice-component-authoring",
        "juice-template-authoring",
        "juice-roadmap",
        "release-checklist",
        "juice-animations",
        "juice-animations-roadmap"
      ].includes(id)
  },
  {
    id: "rules",
    label: "Rules",
    match: (id) => id.startsWith("rules/")
  },
  {
    id: "more",
    label: "More",
    match: () => true
  }
];

const START_ORDER = [
  "README",
  "juice-getting-started",
  "juice-page-tutorial",
  "juice-patterns",
  "juice-maturity-matrix",
  "juice-beta"
];

const readJuiceVersion = (): string => {
  try {
    const raw = readFileSync(join(repoRoot, "libraries/juice/package.json"), "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? "0.9.0";
  } catch {
    return "0.9.0";
  }
};

const toPosix = (value: string): string => value.split(sep).join("/");

const pageHref = (id: string): string => {
  if (id === DEFAULT_PAGE_ID) {
    return "/docs/";
  }
  return `/docs/${id.split("/").map(encodeURIComponent).join("/")}.html`;
};

const collectMarkdownFiles = (root: string): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(full);
      }
    }
  };
  walk(root);
  return files.sort((a, b) => a.localeCompare(b));
};

const fileIdFromPath = (absolutePath: string): string =>
  toPosix(relative(docsRoot, absolutePath)).replace(/\.md$/i, "");

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const escapeAttr = (value: string): string => escapeHtml(value).replaceAll("'", "&#39;");

const stripTags = (value: string): string => value.replace(/<[^>]+>/g, "");

const slugify = (value: string): string => {
  const slug = stripTags(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return slug || "section";
};

const uniqueHeadingId = (base: string, used: Set<string>): string => {
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
};

const codeWindowTitle = (lang: string | undefined): string => {
  const info = (lang ?? "").trim();
  if (!info) {
    return "code";
  }
  const first = info.split(/\s+/)[0] ?? "code";
  if (first.includes(".") || first.includes("/")) {
    return first;
  }
  switch (first) {
    case "bash":
    case "sh":
    case "shell":
    case "zsh":
      return "command.sh";
    case "html":
      return "example.html";
    case "ts":
    case "typescript":
      return "example.ts";
    case "js":
    case "javascript":
      return "example.js";
    case "json":
      return "data.json";
    case "css":
      return "styles.css";
    case "scss":
      return "styles.scss";
    case "yaml":
    case "yml":
      return "config.yaml";
    case "toml":
      return "config.toml";
    default:
      return first;
  }
};

const JUICEUI_INSTALL_LINE =
  /^(npm install|pnpm add|yarn add|bun add)\s+@citrusworx\/juiceui$/;

type JuiceuiInstallCommand = {
  label: string;
  command: string;
};

const parseJuiceuiInstallCommands = (text: string): JuiceuiInstallCommand[] | null => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length < 2) {
    return null;
  }

  const commands: JuiceuiInstallCommand[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!JUICEUI_INSTALL_LINE.test(line)) {
      return null;
    }
    if (seen.has(line)) {
      continue;
    }
    seen.add(line);
    const label = line.split(/\s+/)[0] ?? line;
    commands.push({ label, command: line });
  }

  return commands.length >= 2 ? commands : null;
};

const renderInstallPmTabs = (commands: JuiceuiInstallCommand[], name: string): string => {
  const triggers = commands
    .map(
      (pm, index) =>
        `<button type="button" tab${index === 0 ? " active" : ""}>${escapeHtml(pm.label)}</button>`
    )
    .join("");
  const panels = commands
    .map((pm, index) => {
      const payload = `<pre><code class="language-bash">${escapeHtml(pm.command)}</code></pre>`;
      const window = windowChrome("install.sh", payload, "doc-md-window--code");
      return `<div tab-panel${index === 0 ? "" : " hidden"}>${window}</div>`;
    })
    .join("");
  return `<div install-pm>
  <div tabs name="${escapeAttr(name)}">
    <div tabs-list aria-label="Package manager">${triggers}</div>
    ${panels}
  </div>
</div>`;
};

const windowChrome = (title: string, payload: string, extraClass = ""): string => {
  const cls = extraClass ? ` doc-md-window ${extraClass}` : " doc-md-window";
  return `<div class="${cls.trim()}">
  <div class="doc-md-window-chrome">
    <span class="doc-traffic" aria-hidden="true">
      <span class="doc-dot doc-dot--red"></span>
      <span class="doc-dot doc-dot--yellow"></span>
      <span class="doc-dot doc-dot--green"></span>
    </span>
    <span class="doc-md-window-title">${escapeHtml(title)}</span>
    <span class="doc-md-window-spacer"></span>
  </div>
  <div class="doc-md-window-body">${payload}</div>
</div>`;
};

const splitHref = (href: string): { path: string; hash: string } => {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) {
    return { path: href, hash: "" };
  }
  return { path: href.slice(0, hashIndex), hash: href.slice(hashIndex) };
};

const rewriteHref = (href: string, fromId: string, pageIds: Set<string>): string => {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) {
    return href;
  }

  const juiceBlob = `${GITHUB_BLOB}/docs/juice/`;
  if (href.startsWith(juiceBlob)) {
    const rest = href.slice(juiceBlob.length);
    const { path, hash } = splitHref(rest);
    const id = path.replace(/\.md$/i, "");
    if (pageIds.has(id)) {
      return `${pageHref(id)}${hash}`;
    }
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return href;
  }

  const { path, hash } = splitHref(href);
  if (!path) {
    return href;
  }

  const fromFile = join(docsRoot, `${fromId}.md`);
  const target = resolve(dirname(fromFile), path);
  const posixTarget = toPosix(target);
  const posixDocsRoot = toPosix(docsRoot);
  const insideDocs =
    posixTarget === posixDocsRoot || posixTarget.startsWith(`${posixDocsRoot}/`);

  if (insideDocs) {
    const rel = toPosix(relative(docsRoot, target)).replace(/\.md$/i, "");
    if (pageIds.has(rel)) {
      return `${pageHref(rel)}${hash}`;
    }
  }

  const repoRel = toPosix(relative(repoRoot, target));
  if (!repoRel.startsWith("..")) {
    return `${GITHUB_BLOB}/${repoRel}${hash}`;
  }

  return href;
};

const firstHeadingTitle = (source: string, fallback: string): string => {
  const match = source.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
};

const parseReadmeLabels = (source: string): Map<string, string> => {
  const labels = new Map<string, string>();
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  for (const match of source.matchAll(linkRe)) {
    const label = match[1]?.trim();
    const href = match[2]?.split("#")[0]?.trim();
    if (!label || !href || !href.endsWith(".md")) {
      continue;
    }
    const resolved = toPosix(relative(docsRoot, resolve(docsRoot, href))).replace(/\.md$/i, "");
    if (resolved && !resolved.startsWith("..")) {
      labels.set(resolved, label.replace(/\s+—.*$/, "").replace(/\s+\(.*$/, "").trim());
    }
  }
  return labels;
};

const assignGroup = (id: string): string => {
  for (const group of GROUP_DEFS) {
    if (group.match(id)) {
      return group.id;
    }
  }
  return "more";
};

const courseRank = (id: string): number => {
  if (id === "course/README") {
    return 0;
  }
  const numbered = id.match(/^course\/(\d+)/);
  if (numbered) {
    return 1 + Number(numbered[1]);
  }
  if (id.endsWith("glossary")) {
    return 90;
  }
  if (id.endsWith("answers")) {
    return 91;
  }
  return 50;
};

const startRank = (id: string): number => {
  const index = START_ORDER.indexOf(id);
  return index === -1 ? 50 : index;
};

const renderMarkdown = (
  source: string,
  pageId: string,
  pageIds: Set<string>
): { html: string; toc: DocHeading[] } => {
  const toc: DocHeading[] = [];
  const usedIds = new Set<string>();
  let installBlock = 0;

  const marked = new Marked();
  marked.use({
    gfm: true,
    renderer: {
      heading(this: { parser: { parseInline: (tokens: Tokens.Heading["tokens"]) => string } }, token: Tokens.Heading) {
        const text = this.parser.parseInline(token.tokens);
        const id = uniqueHeadingId(slugify(text), usedIds);
        toc.push({ id, text: stripTags(text), level: token.depth });
        return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
      },
      code({ text, lang }: Tokens.Code) {
        const fence = (lang ?? "").trim().split(/\s+/)[0] ?? "";
        if (["bash", "sh", "shell", "zsh"].includes(fence)) {
          const install = parseJuiceuiInstallCommands(text);
          if (install) {
            installBlock += 1;
            const name = `install-${pageId.replace(/[^\w]+/g, "-")}-${installBlock}`;
            return renderInstallPmTabs(install, name);
          }
        }
        const title = codeWindowTitle(lang);
        const langClass = lang ? ` class="language-${escapeAttr(lang.split(/\s+/)[0] ?? "")}"` : "";
        const payload = `<pre><code${langClass}>${escapeHtml(text)}</code></pre>`;
        return windowChrome(title, payload, "doc-md-window--code");
      },
      blockquote(this: { parser: { parse: (tokens: Tokens.Blockquote["tokens"]) => string } }, token: Tokens.Blockquote) {
        const body = this.parser.parse(token.tokens);
        return windowChrome("note", `<div class="doc-md-note">${body}</div>`, "doc-md-window--note");
      },
      link(this: { parser: { parseInline: (tokens: Tokens.Link["tokens"]) => string } }, token: Tokens.Link) {
        const text = this.parser.parseInline(token.tokens);
        const href = rewriteHref(token.href, pageId, pageIds);
        const title = token.title ? ` title="${escapeAttr(token.title)}"` : "";
        return `<a href="${escapeAttr(href)}"${title}>${text}</a>`;
      }
    }
  });

  const html = marked.parse(source, { async: false }) as string;
  return { html, toc };
};

export const buildDocsCatalog = (): DocsCatalog => {
  const files = collectMarkdownFiles(docsRoot);
  const pageIds = new Set(files.map(fileIdFromPath));
  const version = readJuiceVersion();
  const pages: Record<string, DocPage> = {};
  let readmeSource = "";

  for (const file of files) {
    const id = fileIdFromPath(file);
    const source = readFileSync(file, "utf8");
    if (id === DEFAULT_PAGE_ID) {
      readmeSource = source;
    }
    const filename = toPosix(relative(docsRoot, file)).split("/").pop() ?? `${id}.md`;
    const title = firstHeadingTitle(source, filename.replace(/\.md$/i, ""));
    const { html, toc } = renderMarkdown(source, id, pageIds);
    pages[id] = {
      id,
      title,
      filename,
      href: pageHref(id),
      html,
      toc,
      group: assignGroup(id)
    };
  }

  const labels = parseReadmeLabels(readmeSource);
  const nav: DocNavGroup[] = GROUP_DEFS.map((group) => {
    const items = Object.values(pages)
      .filter((page) => page.group === group.id)
      .sort((a, b) => {
        if (group.id === "start") {
          return startRank(a.id) - startRank(b.id);
        }
        if (group.id === "course") {
          return courseRank(a.id) - courseRank(b.id);
        }
        return (labels.get(a.id) ?? a.title).localeCompare(labels.get(b.id) ?? b.title);
      })
      .map((page) => ({
        id: page.id,
        title: labels.get(page.id) ?? page.title,
        href: page.href,
        filename: page.filename
      }));
    return { id: group.id, label: group.label, items };
  }).filter((group) => group.items.length > 0);

  return {
    version,
    defaultPageId: DEFAULT_PAGE_ID,
    pages,
    nav
  };
};

const rewriteDocsRequest = (url: string | undefined): string | null => {
  if (!url) {
    return null;
  }
  const path = url.split("?")[0]?.split("#")[0] ?? "";
  if (path === "/docs" || path === "/docs/" || path === "/docs/index.html") {
    return "/docs.html";
  }
  if (path.startsWith("/docs/") && (path.endsWith(".html") || path.endsWith("/"))) {
    return "/docs.html";
  }
  return null;
};

const writePageCopies = (outDir: string, catalog: DocsCatalog, html: string) => {
  const written = new Set<string>();
  const writeCopy = (relPath: string) => {
    const dest = join(outDir, relPath);
    if (written.has(dest)) {
      return;
    }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, html);
    written.add(dest);
  };

  writeCopy("docs/index.html");
  writeCopy("docs/course/index.html");

  for (const page of Object.values(catalog.pages)) {
    writeCopy(`docs/${page.id}.html`);
  }
};

export const juiceDocsPlugin = (): Plugin => {
  let catalog = buildDocsCatalog();

  return {
    name: "juice-docs",
    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_VIRTUAL_ID;
      }
      return undefined;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) {
        return undefined;
      }
      catalog = buildDocsCatalog();
      return `export const catalog = ${JSON.stringify(catalog)};\n`;
    },
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const rewritten = rewriteDocsRequest(req.url);
        if (rewritten) {
          req.url = rewritten;
        }
        next();
      });
    },
    handleHotUpdate({ file, server }) {
      const posixFile = toPosix(file);
      if (!posixFile.includes("/docs/juice/") || !posixFile.endsWith(".md")) {
        return;
      }
      const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
      if (mod) {
        server.moduleGraph.invalidateModule(mod);
      }
      server.ws.send({ type: "full-reload" });
      return [];
    },
    writeBundle(options) {
      const outDir = options.dir;
      if (!outDir) {
        return;
      }
      const built = join(outDir, "docs.html");
      const html = readFileSync(built, "utf8");
      catalog = buildDocsCatalog();
      writePageCopies(outDir, catalog, html);
    }
  };
};
