import { cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await cp(path.join(root, "examples/blueprints"), path.join(root, "dist/blueprints"), {
    recursive: true
});
