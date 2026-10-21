import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(path: string): string {
    return readFileSync(path, "utf8");
}

function walkSources(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) {
            walkSources(path, out);
            continue;
        }
        if (name.endsWith(".ts") && !name.endsWith(".test.ts")) {
            out.push(path);
        }
    }
    return out;
}

function section(readme: string): string {
    const start = readme.indexOf("<!-- seltzer-docs-drift -->");
    const end = readme.indexOf("<!-- /seltzer-docs-drift -->");
    if (start < 0 || end < start) {
        throw new Error("README is missing the seltzer-docs-drift markers");
    }
    return readme.slice(start, end);
}

function documentedNames(table: string): string[] {
    const names: string[] = [];
    for (const match of table.matchAll(/`([A-Za-z][A-Za-z0-9]*)`/g)) {
        names.push(match[1]);
    }
    return names;
}

function isPublicName(name: string, sources: string[]): boolean {
    const exportDecl = new RegExp(
        `export\\s+(?:declare\\s+)?(?:async\\s+)?(?:class|function|const|let|type|interface|enum)\\s+${name}\\b`,
    );
    const reexport = new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`);
    const property = new RegExp(`(?:^|[\\n;])\\s*(?:readonly\\s+)?${name}\\??\\s*:`);
    return sources.some(
        (source) => exportDecl.test(source) || reexport.test(source) || property.test(source),
    );
}

describe("docs drift", () => {
    const readme = read(join(packageRoot, "README.md"));
    const manifest = JSON.parse(read(join(packageRoot, "package.json"))) as { version?: string };
    const sources = walkSources(join(packageRoot, "src")).map(read);

    it("pins the README install snippet and documented version to package.json", () => {
        const version = manifest.version;
        expect(version, "package.json version").toMatch(/^\d+\.\d+\.\d+$/);
        const pins = [...readme.matchAll(/npm install @citrusworx\/seltzer@(\d+\.\d+\.\d+)/g)].map(
            (match) => match[1],
        );
        expect(pins, "README install snippet").toEqual([version]);
        expect(readme).toContain(`Documented version: \`${version}\``);
    });

    it("checks README public names against source exports and option fields", () => {
        const names = documentedNames(section(readme));
        expect(names.length).toBeGreaterThan(0);
        const missing = names.filter((name) => !isPublicName(name, sources));
        expect(missing, "names missing from public source").toEqual([]);
    });
});
