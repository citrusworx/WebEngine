import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const SRC = dirname(fileURLToPath(import.meta.url));
const JUICE_IMPORT =
    /(?:from\s+|import\s*\(\s*|import\s+)['"]@citrusworx\/juiceui(?:\/[^'"]*)?['"]/;

test("the main Sig entry does not import Juice", () => {
    const entry = readFileSync(join(SRC, "index.ts"), "utf8");
    expect(entry).not.toMatch(JUICE_IMPORT);
    expect(entry).not.toMatch(/['"]\.\/juice\.js['"]/);

    const offenders = readdirSync(SRC).filter((name) => {
        if (!name.endsWith(".ts") || name.endsWith(".test.ts") || name === "juice.ts") {
            return false;
        }
        return JUICE_IMPORT.test(readFileSync(join(SRC, name), "utf8"));
    });

    expect(offenders).toEqual([]);
});

test("the juice subpath is the only Sig module that imports Juice", () => {
    const source = readFileSync(join(SRC, "juice.ts"), "utf8");
    expect(source).toMatch(JUICE_IMPORT);
    expect(source).toContain('from "./signal.js"');
    expect(source).not.toContain('from "@citrusworx/sigjs"');
});
