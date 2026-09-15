import fs from "node:fs";
import path from "node:path";
import { loadYaml } from "../config/yaml.js";
import { MigrationCompileError } from "../compiler/migration.js";

const YAML_FILE = /\.ya?ml$/i;

/**
 * Load versioned migration YAML documents from a directory.
 *
 * Missing directories yield `[]` so apps can wire a migrations folder before
 * any files exist. Files are read in name order; {@link compileMigrations}
 * sorts by the `version` field.
 */
export function loadMigrationDocuments(directory: string): unknown[] {
    if (typeof directory !== "string" || directory.trim() === "") {
        throw new MigrationCompileError("loadMigrationDocuments requires a directory path");
    }
    if (!fs.existsSync(directory)) {
        return [];
    }

    const stat = fs.statSync(directory);
    if (!stat.isDirectory()) {
        throw new MigrationCompileError(`Not a migration directory: ${directory}`);
    }

    const names = fs
        .readdirSync(directory)
        .filter((name) => YAML_FILE.test(name))
        .sort((left, right) => left.localeCompare(right));

    return names.map((name) => loadYaml(path.join(directory, name)));
}
