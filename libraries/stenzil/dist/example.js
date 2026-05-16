"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const index_1 = require("./index");
const examplesDir = (0, node_path_1.join)(__dirname, "../examples");
function processFile(filePath) {
    const name = (0, node_path_1.relative)(examplesDir, filePath);
    const source = (0, node_fs_1.readFileSync)(filePath, "utf-8");
    console.log(`\n${"═".repeat(60)}`);
    console.log(`  ${name}`);
    console.log("═".repeat(60));
    const tokens = index_1.Stenzil.tokenize(source);
    console.log("\n── Tokens ──────────────────────────────────────────────");
    for (const token of tokens) {
        const preview = token.value.replace(/\s+/g, " ").slice(0, 60);
        console.log(`  [${token.line}:${token.col}] ${token.type.padEnd(12)} ${preview}`);
    }
    const ast = index_1.Stenzil.parse(source);
    console.log("\n── AST ─────────────────────────────────────────────────");
    console.log(JSON.stringify(ast, null, 2));
}
function walkDir(dir) {
    const entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = (0, node_path_1.join)(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkDir(full));
        }
        else if (entry.name.endsWith(".stzl")) {
            files.push(full);
        }
    }
    return files;
}
const files = walkDir(examplesDir);
for (const file of files) {
    processFile(file);
}
//# sourceMappingURL=example.js.map