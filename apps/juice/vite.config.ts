import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  server: {
    host: "0.0.0.0",
    port: 5173
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
        reference: fileURLToPath(new URL("./reference.html", import.meta.url))
      }
    }
  }
});
