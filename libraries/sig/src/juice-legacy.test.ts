import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const require = createRequire(import.meta.url);
const dir = dirname(fileURLToPath(import.meta.url));
const sigRoot = join(dir, "..");
const tsc = require.resolve("typescript/bin/tsc");

const newer = (runtime: string, exportName: string) =>
    `Sig juice bind: "${runtime}" needs a newer @citrusworx/juiceui that exports ${exportName}.`;

test("older Juice still imports the adapter, binds switch, and refuses the three new runtimes", () => {
    execFileSync(process.execPath, [tsc, "-p", sigRoot, "--pretty", "false"], {
        encoding: "utf8",
    });

    const declarations = readFileSync(join(sigRoot, "dist/juice.d.ts"), "utf8");
    const imported = declarations
        .split("\n")
        .find((line) => line.startsWith("import type"));
    expect(imported).toBeTruthy();
    expect(imported).not.toMatch(/\b(IconButtonState|AvatarState|TableState)\b/);
    expect(declarations).toContain("pressed: boolean");
    expect(declarations).toContain("fallback: boolean");
    expect(declarations).toContain('direction: "ascending" | "descending" | "none"');

    const result = spawnSync(
        process.execPath,
        [
            "--experimental-strip-types",
            "--import",
            join(dir, "juice-legacy-register.mjs"),
            join(dir, "juice-legacy.probe.mjs"),
        ],
        { encoding: "utf8", cwd: sigRoot }
    );
    const output = `${result.stdout}\n${result.stderr}`;
    expect(result.status, output).toBe(0);

    const line = result.stdout
        .split("\n")
        .find((entry) => entry.startsWith("LEGACY_REPORT "));
    expect(line, output).toBeTruthy();
    const report = JSON.parse(line!.slice("LEGACY_REPORT ".length)) as {
        switch: { checked: boolean };
        errors: Record<string, string>;
    };

    expect(report.switch).toEqual({ checked: true });
    expect(report.errors).toEqual({
        "icon-button": newer("icon-button", "startIconButtonRuntime"),
        "icon-button:inferred": newer("icon-button", "startIconButtonRuntime"),
        avatar: newer("avatar", "startAvatarRuntime"),
        "avatar:inferred": newer("avatar", "startAvatarRuntime"),
        table: newer("table", "startTableRuntime"),
        "table:inferred": newer("table", "startTableRuntime"),
    });
});
