/**
 * Build Sig while a second copy of its JSX globals sits where Juice's
 * accordion types would resolve it. `type Element` and the string index
 * signature in that copy do not merge with `src/jsx.ts`. The build must
 * still succeed because `@citrusworx/sigjs` is pinned to this package's source.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const nested = join(repo, "libraries/juice/node_modules/@citrusworx/sigjs");
const dist = join(nested, "dist");
const require = createRequire(import.meta.url);
const tsc = require.resolve("typescript/bin/tsc");

const packageJson = {
    name: "@citrusworx/sigjs",
    version: "0.6.0",
    type: "module",
    types: "./dist/index.d.ts",
    exports: {
        ".": {
            types: "./dist/index.d.ts",
            default: "./dist/index.js",
        },
    },
};

const indexDts = `export type Child = Node | string | number | null | undefined;
export * from "./jsx.js";
`;

const jsxDts = `declare global {
    namespace JSX {
        type Element = Node;
        interface IntrinsicElements {
            [elemName: string]: any;
        }
        interface ElementChildrenAttribute {
            children: {};
        }
    }
}
export {};
`;

mkdirSync(dist, { recursive: true });
let failed = false;
try {
    writeFileSync(join(nested, "package.json"), JSON.stringify(packageJson, null, 2));
    writeFileSync(join(dist, "index.d.ts"), indexDts);
    writeFileSync(join(dist, "jsx.d.ts"), jsxDts);

    execFileSync(
        process.execPath,
        [tsc, "-p", join(repo, "libraries/sig"), "--pretty", "false"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    console.log("sig build ignored the foreign JSX global");
} catch (error) {
    failed = true;
    const stdout = error && typeof error === "object" && "stdout" in error ? error.stdout : "";
    const stderr = error && typeof error === "object" && "stderr" in error ? error.stderr : "";
    if (stdout) process.stderr.write(String(stdout));
    if (stderr) process.stderr.write(String(stderr));
    console.error("sig build failed while a foreign @citrusworx/sigjs was installed under Juice");
} finally {
    rmSync(nested, { recursive: true, force: true });
}
if (failed) process.exit(1);
