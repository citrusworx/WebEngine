import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    oxc: {
        jsx: {
            runtime: "automatic",
            importSource: "@citrusworx/sigjs"
        }
    },
    resolve: {
        alias: {
            "@citrusworx/juice/styles": resolve(__dirname, "../../../libraries/juice/dist/index.css")
        }
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"]
    }
});