/**
 * A nested registry copy of Sig must not break `tsc`, and Yarn must not
 * have installed one. The scripts are the CI checks as well.
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test.describe.configure({ mode: "serial" });

test("the workspace links a single @citrusworx/sigjs", () => {
    execFileSync(process.execPath, [join(ROOT, "scripts/check-no-nested-sigjs.mjs")], {
        encoding: "utf8",
        stdio: "pipe",
    });
});

test("sig build ignores a nested sigjs JSX global", () => {
    execFileSync(process.execPath, [join(ROOT, "scripts/check-foreign-jsx-build.mjs")], {
        encoding: "utf8",
        stdio: "pipe",
    });
});
