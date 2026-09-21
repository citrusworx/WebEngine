import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { juiceDocsPlugin } from "./vite-plugin-juice-docs";
import { juiceSitePlugin } from "./vite-plugin-juice-site";

const root = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  root,
  appType: "mpa",
  plugins: [juiceDocsPlugin(), juiceSitePlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      allow: [root, repoRoot]
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 5173
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        gettingStarted: fileURLToPath(new URL("./getting-started.html", import.meta.url)),
        demos: fileURLToPath(new URL("./demos.html", import.meta.url)),
        themes: fileURLToPath(new URL("./themes.html", import.meta.url)),
        themeFrame: fileURLToPath(new URL("./theme-frame.html", import.meta.url)),
        reference: fileURLToPath(new URL("./reference.html", import.meta.url)),
        playground: fileURLToPath(new URL("./playground.html", import.meta.url)),
        notFound: fileURLToPath(new URL("./404.html", import.meta.url)),
        docs: fileURLToPath(new URL("./docs.html", import.meta.url))
      }
    }
  }
});
