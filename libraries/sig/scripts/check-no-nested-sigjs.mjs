/**
 * Fail when Yarn (or npm) has installed a second @citrusworx/sigjs.
 *
 * 0.x carets do not cross minors. A consumer pinned below the workspace
 * version makes Yarn put a registry tarball at
 * `<consumer>/node_modules/@citrusworx/sigjs`. Sig's build must see one copy.
 *
 * `libraries/sig/examples/counter` is its own npm project, not a workspace
 * member, so an install there is an outside consumer and is ignored.
 */
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const workspaceSig = realpathSync(join(repo, "libraries/sig"));
const counterRoot = join(repo, "libraries/sig/examples/counter") + sep;

// The workspace copy is a symlink. find does not descend into symlinks,
// so match the directory itself instead of package.json inside it.
const found = execFileSync(
    "find",
    [
        repo,
        "(",
        "-type",
        "d",
        "-o",
        "-type",
        "l",
        ")",
        "-name",
        "sigjs",
        "-path",
        "*/node_modules/@citrusworx/sigjs",
        "-print",
    ],
    { encoding: "utf8" }
)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const nested = [];
let sawWorkspace = false;

for (const pkgDir of found) {
    if (pkgDir.startsWith(counterRoot)) continue;
    const real = realpathSync(pkgDir);
    if (real === workspaceSig) {
        sawWorkspace = true;
        continue;
    }
    nested.push(`${pkgDir} -> ${real}`);
}

if (!sawWorkspace) {
    console.error(
        "Expected node_modules/@citrusworx/sigjs to be the libraries/sig workspace."
    );
    process.exit(1);
}

if (nested.length > 0) {
    console.error("Nested @citrusworx/sigjs install (must be the workspace only):");
    for (const line of nested) console.error(`  ${line}`);
    process.exit(1);
}

console.log("single @citrusworx/sigjs install: libraries/sig");
