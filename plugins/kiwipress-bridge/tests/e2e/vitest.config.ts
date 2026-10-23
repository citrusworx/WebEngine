import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../../..");

export default defineConfig({
    root: here,
    server: {
        fs: {
            allow: [repoRoot]
        }
    },
    test: {
        environment: "node",
        include: ["bridge.e2e.ts"],
        fileParallelism: false,
        sequence: {
            concurrent: false
        },
        testTimeout: 180_000,
        hookTimeout: 180_000
    }
});
