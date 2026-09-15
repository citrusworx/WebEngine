import fs from "node:fs";
import yaml from "js-yaml";

/**
 * Load and parse a YAML file. Library primitive — apps should not reimplement this.
 */
export function loadYaml<T = Record<string, unknown>>(filepath: string): T {
    if (!fs.existsSync(filepath)) {
        throw new Error(`Nectarine YAML not found: ${filepath}`);
    }

    const source = fs.readFileSync(filepath, "utf8");
    const parsed = yaml.load(source);

    if (parsed === null || parsed === undefined) {
        throw new Error(`Nectarine YAML is empty: ${filepath}`);
    }

    if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`Nectarine YAML must parse to an object: ${filepath}`);
    }

    return parsed as T;
}

/** Alias matching Nectarine docs / schema loading. */
export const loadSchema = loadYaml;
