import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { Stenzil } from "./index";

const examplesDir = join(__dirname, "../examples");

function processFile(filePath: string): void {
    const name = relative(examplesDir, filePath);
    const source = readFileSync(filePath, "utf-8");

    console.log(`\n${"═".repeat(60)}`);
    console.log(`  ${name}`);
    console.log("═".repeat(60));

    const tokens = Stenzil.tokenize(source);
    console.log("\n── Tokens ──────────────────────────────────────────────");
    for (const token of tokens) {
        const preview = token.value.replace(/\s+/g, " ").slice(0, 60);
        console.log(`  [${token.line}:${token.col}] ${token.type.padEnd(12)} ${preview}`);
    }

    const ast = Stenzil.parse(source);
    console.log("\n── AST ─────────────────────────────────────────────────");
    console.log(JSON.stringify(ast, null, 2));
}

function walkDir(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkDir(full));
        } else if (entry.name.endsWith(".stzl")) {
            files.push(full);
        }
    }
    return files;
}

const files = walkDir(examplesDir);
for (const file of files) {
    processFile(file);
}
