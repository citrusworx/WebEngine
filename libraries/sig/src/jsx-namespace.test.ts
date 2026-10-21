/**
 * `jsxImportSource` must resolve `JSX.IntrinsicElements` from the runtime
 * entry alone. A file that never imports the package root used to fail with
 * TS7026 because the namespace lived only on the global augmentation in `.`.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

test("jsxImportSource typechecks without importing the package root", () => {
    const tsc = require.resolve("typescript/bin/tsc");
    for (const project of ["tsconfig.runtime.json", "tsconfig.dev-runtime.json"]) {
        const output = execFileSync(process.execPath, [tsc, "-p", join(ROOT, "typecheck", project), "--pretty", "false"], {
            encoding: "utf8",
        });
        expect(output).not.toContain("TS7026");
    }
});
