import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";

const escapeAttr = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");

const wantsDocument = (req: IncomingMessage) => {
  const method = req.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }
  const accept = req.headers.accept ?? "";
  if (!accept) {
    return true;
  }
  return accept.includes("text/html") || accept.includes("*/*");
};

const pathnameOf = (url: string | undefined) => {
  const raw = url ?? "/";
  const path = raw.split("?")[0]?.split("#")[0] ?? "/";
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

const isAssetPath = (pathname: string) =>
  pathname.startsWith("/@") ||
  pathname.startsWith("/src/") ||
  pathname.startsWith("/node_modules/") ||
  pathname.startsWith("/__") ||
  /\.[a-z0-9]+$/i.test(pathname);

const alreadyHandled = (res: ServerResponse) => res.headersSent || res.writableEnded;

const headTagsFor = (html: string) => {
  const noindex = /name="robots"[^>]*content="[^"]*noindex/i.test(html);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? "Juice";
  const description = html.match(/name="description"\s+content="([^"]*)"/)?.[1]?.trim();
  const tags = [`<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`];
  if (!noindex && description) {
    const safeTitle = escapeAttr(title);
    const safeDescription = escapeAttr(description);
    tags.push(
      `<meta property="og:title" content="${safeTitle}" />`,
      `<meta property="og:description" content="${safeDescription}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:image" content="/og.png" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${safeTitle}" />`,
      `<meta name="twitter:description" content="${safeDescription}" />`,
      `<meta name="twitter:image" content="/og.png" />`
    );
  }
  return tags.join("\n    ");
};

const injectHead = (html: string) => {
  if (html.includes('rel="icon"') || html.includes("rel='icon'")) {
    return html;
  }
  const viewport = `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`;
  if (!html.includes(viewport)) {
    return html;
  }
  return html.replace(viewport, `${viewport}\n    ${headTagsFor(html)}`);
};

const sendHtml = (req: IncomingMessage, res: ServerResponse, html: string, status: number) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  if ((req.method ?? "GET") === "HEAD") {
    res.end();
    return;
  }
  res.end(html);
};

const devNotFound =
  (server: ViteDevServer): Connect.NextHandleFunction =>
  async (req, res, next) => {
    if (alreadyHandled(res) || !wantsDocument(req) || isAssetPath(pathnameOf(req.url))) {
      next();
      return;
    }
    try {
      const template = readFileSync(new URL("./404.html", import.meta.url), "utf8");
      const html = await server.transformIndexHtml(req.url ?? "/404.html", template);
      sendHtml(req, res, html, 404);
    } catch (error) {
      next(error);
    }
  };

const previewNotFound =
  (server: PreviewServer): Connect.NextHandleFunction =>
  (req, res, next) => {
    if (alreadyHandled(res) || !wantsDocument(req) || isAssetPath(pathnameOf(req.url))) {
      next();
      return;
    }
    try {
      const file = join(server.config.root, server.config.build.outDir, "404.html");
      sendHtml(req, res, readFileSync(file, "utf8"), 404);
    } catch (error) {
      next(error);
    }
  };

export const juiceSitePlugin = (): Plugin => ({
  name: "juice-site",
  transformIndexHtml: {
    order: "pre",
    handler(html) {
      return injectHead(html);
    }
  },
  configureServer(server) {
    return () => {
      server.middlewares.use(devNotFound(server));
    };
  },
  configurePreviewServer(server) {
    return () => {
      server.middlewares.use(previewNotFound(server));
    };
  }
});
