/**
 * Snapshot of the public export names for every `package.json` `exports` entry.
 *
 * Value names, type names, class members, and the global JSX namespace are
 * read from source with Node builtins. A new, removed, or moved export fails
 * this test. Returned-object members (`Signal.get`, `memo.get`) are not
 * syntax exports; those live in docs/sigjs/api-surface.md.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_ENTRIES = [
    ".",
    "./jsx-dev-runtime",
    "./jsx-runtime",
    "./juice",
    "./sig-router",
];

const EXPECTED_VALUES: Record<string, string[]> = {
    ".": [
        "Fragment",
        "JSX",
        "Signal",
        "SigRouter",
        "batch",
        "bindList",
        "disposeTree",
        "effect",
        "jsx",
        "jsxs",
        "memo",
        "mount",
        "untrack",
    ],
    "./jsx-dev-runtime": ["Fragment", "JSX", "jsxDEV", "jsxs"],
    "./jsx-runtime": ["Fragment", "JSX", "disposeTree", "jsx", "jsxs", "mount"],
    "./juice": ["bind"],
    "./sig-router": ["SigRouter"],
};

const EXPECTED_TYPES: Record<string, string[]> = {
    ".": [
        "Child",
        "ListItem",
        "RouteFactory",
        "RouteMap",
        "RouteParams",
        "RouteView",
    ],
    "./jsx-dev-runtime": [],
    "./jsx-runtime": ["Child"],
    "./juice": [
        "JuiceBinding",
        "JuiceRuntimeName",
        "JuiceRuntimeState",
        "JuiceSignal",
    ],
    "./sig-router": ["RouteFactory", "RouteMap", "RouteParams", "RouteView"],
};

const EXPECTED_CLASS_MEMBERS: Record<string, Record<string, string[]>> = {
    ".": {
        SigRouter: [
            "constructor",
            "get",
            "goBack",
            "has",
            "navigate",
            "set",
            "start",
            "stop",
        ],
    },
    "./jsx-dev-runtime": {},
    "./jsx-runtime": {},
    "./juice": {},
    "./sig-router": {
        SigRouter: [
            "constructor",
            "get",
            "goBack",
            "has",
            "navigate",
            "set",
            "start",
            "stop",
        ],
    },
};

const EXPECTED_GLOBAL_JSX: Record<string, string[]> = {
    ".": [
        "JSX.Element",
        "JSX.ElementChildrenAttribute",
        "JSX.IntrinsicAttributes",
        "JSX.IntrinsicElements",
    ],
    "./jsx-dev-runtime": [
        "JSX.Element",
        "JSX.ElementChildrenAttribute",
        "JSX.IntrinsicAttributes",
        "JSX.IntrinsicElements",
    ],
    "./jsx-runtime": [
        "JSX.Element",
        "JSX.ElementChildrenAttribute",
        "JSX.IntrinsicAttributes",
        "JSX.IntrinsicElements",
    ],
    "./juice": [],
    "./sig-router": [],
};

const NOT_PUBLIC = ["attachNodeCleanup", "captureCleanupScope"];

type Surface = {
    values: string[];
    types: string[];
    classMembers: Record<string, string[]>;
    globalJsx: string[];
};

function stripComments(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

function sorted(values: Iterable<string>): string[] {
    return [...values].sort();
}

function sortRecord(record: Record<string, string[]>): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const key of Object.keys(record).sort()) {
        out[key] = sorted(record[key] ?? []);
    }
    return out;
}

function sortMembers(
    record: Record<string, Record<string, string[]>>
): Record<string, Record<string, string[]>> {
    const out: Record<string, Record<string, string[]>> = {};
    for (const entry of Object.keys(record).sort()) {
        const classes: Record<string, string[]> = {};
        for (const name of Object.keys(record[entry] ?? {}).sort()) {
            classes[name] = sorted(record[entry]?.[name] ?? []);
        }
        out[entry] = classes;
    }
    return out;
}

function resolveSpecifier(fromFile: string, spec: string): string {
    const filename = spec.endsWith(".js") ? spec.slice(0, -3) + ".ts" : spec;
    return resolve(dirname(fromFile), filename);
}

function classMembers(source: string, name: string): string[] {
    const start = source.search(new RegExp(`export\\s+class\\s+${name}\\b`));
    const open = source.indexOf("{", start);
    let depth = 0;
    let close = open;
    for (let i = open; i < source.length; i++) {
        if (source[i] === "{") depth += 1;
        else if (source[i] === "}") {
            depth -= 1;
            if (depth === 0) {
                close = i;
                break;
            }
        }
    }

    const skip = new Set([
        "if",
        "for",
        "while",
        "switch",
        "catch",
        "function",
        "return",
        "super",
    ]);
    const members = new Set<string>();
    for (const line of source.slice(open + 1, close).split("\n")) {
        const match = line.match(
            /^\s*(?:(public|private|protected)\s+)?(?:readonly\s+)?(?:async\s+)?#?([A-Za-z_][A-Za-z0-9_]*)\s*\(/
        );
        if (!match) continue;
        const access = match[1];
        const method = match[2];
        if (!method || access === "private" || access === "protected" || skip.has(method)) {
            continue;
        }
        members.add(method);
    }
    return sorted(members);
}

function collect(filePath: string, seen: Set<string>, into: {
    values: Set<string>;
    types: Set<string>;
    classMembers: Map<string, string[]>;
    globalJsx: Set<string>;
}) {
    if (seen.has(filePath)) return;
    seen.add(filePath);

    const source = stripComments(readFileSync(filePath, "utf8"));

    for (const match of source.matchAll(/export\s+\*\s+from\s+["']([^"']+)["']/g)) {
        const spec = match[1];
        if (!spec) continue;
        collect(resolveSpecifier(filePath, spec), seen, into);
    }

    for (const match of source.matchAll(/^export\s+function\s+([A-Za-z0-9_]+)/gm)) {
        if (match[1]) into.values.add(match[1]);
    }
    for (const match of source.matchAll(/^export\s+namespace\s+([A-Za-z0-9_]+)/gm)) {
        if (match[1]) into.values.add(match[1]);
    }
    for (const match of source.matchAll(/export\s+class\s+([A-Za-z0-9_]+)/g)) {
        const name = match[1];
        if (!name) continue;
        into.values.add(name);
        into.classMembers.set(name, classMembers(source, name));
    }
    for (const match of source.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g)) {
        if (match[1]) into.values.add(match[1]);
    }
    for (const match of source.matchAll(/^export\s+(?:type|interface)\s+([A-Za-z0-9_]+)/gm)) {
        if (match[1]) into.types.add(match[1]);
    }
    for (const match of source.matchAll(/export\s+(type\s+)?\{([^}]+)\}(?:\s+from\s+["']([^"']+)["'])?/g)) {
        const listIsType = Boolean(match[1]);
        for (const part of (match[2] ?? "").split(",")) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            const alias = trimmed.split(/\s+as\s+/);
            const local = alias[0]?.trim() ?? "";
            const exported = (alias[1] ?? alias[0] ?? "").trim().replace(/^type\s+/, "");
            if (!exported) continue;
            if (listIsType || local.startsWith("type ")) into.types.add(exported);
            else into.values.add(exported);
        }
        const spec = match[3];
        const exportedNames = (match[2] ?? "").split(",").map((part) => {
            const alias = part.trim().split(/\s+as\s+/);
            return (alias[1] ?? alias[0] ?? "").trim().replace(/^type\s+/, "");
        });
        if (spec && exportedNames.includes("JSX")) {
            addJsxNamespace(
                stripComments(readFileSync(resolveSpecifier(filePath, spec), "utf8")),
                into.globalJsx
            );
        }
    }

    addJsxNamespace(source, into.globalJsx);
}

function addJsxNamespace(source: string, into: Set<string>) {
    const re = /namespace\s+JSX\s*\{/g;
    for (const match of source.matchAll(re)) {
        const open = (match.index ?? 0) + match[0].length - 1;
        let depth = 0;
        let close = open;
        for (let i = open; i < source.length; i++) {
            if (source[i] === "{") depth += 1;
            else if (source[i] === "}") {
                depth -= 1;
                if (depth === 0) {
                    close = i;
                    break;
                }
            }
        }
        const body = source.slice(open + 1, close);
        for (const found of body.matchAll(/\b(?:type|interface)\s+([A-Za-z0-9_]+)/g)) {
            if (found[1]) into.add(`JSX.${found[1]}`);
        }
    }
}

function sourceForTypesField(typesField: string): string {
    const relative = typesField
        .replace(/^\.\//, "")
        .replace(/^dist\//, "src/")
        .replace(/\.d\.ts$/, ".ts");
    return join(ROOT, relative);
}

function readSurface(typesField: string): Surface {
    const into = {
        values: new Set<string>(),
        types: new Set<string>(),
        classMembers: new Map<string, string[]>(),
        globalJsx: new Set<string>(),
    };
    collect(sourceForTypesField(typesField), new Set(), into);
    const classMembers: Record<string, string[]> = {};
    for (const [name, members] of into.classMembers) {
        classMembers[name] = members;
    }
    return {
        values: sorted(into.values),
        types: sorted(into.types),
        classMembers,
        globalJsx: sorted(into.globalJsx),
    };
}

function readExports(): Record<string, { types?: string }> {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
        exports: Record<string, { types?: string }>;
    };
    return pkg.exports;
}

test("package exports and their public names match the v1 snapshot", () => {
    const exportsMap = readExports();
    const entries = Object.keys(exportsMap).sort();
    expect(entries).toEqual(EXPECTED_ENTRIES);

    const values: Record<string, string[]> = {};
    const types: Record<string, string[]> = {};
    const classMembers: Record<string, Record<string, string[]>> = {};
    const globalJsx: Record<string, string[]> = {};

    for (const entry of entries) {
        const typesField = exportsMap[entry]?.types;
        expect(typesField, entry).toBeTruthy();
        const surface = readSurface(typesField!);
        values[entry] = surface.values;
        types[entry] = surface.types;
        classMembers[entry] = surface.classMembers;
        globalJsx[entry] = surface.globalJsx;

        for (const name of NOT_PUBLIC) {
            expect(surface.values, `${entry} value ${name}`).not.toContain(name);
            expect(surface.types, `${entry} type ${name}`).not.toContain(name);
        }
    }

    expect(sortRecord(values)).toEqual(sortRecord(EXPECTED_VALUES));
    expect(sortRecord(types)).toEqual(sortRecord(EXPECTED_TYPES));
    expect(sortMembers(classMembers)).toEqual(sortMembers(EXPECTED_CLASS_MEMBERS));
    expect(sortRecord(globalJsx)).toEqual(sortRecord(EXPECTED_GLOBAL_JSX));
});
