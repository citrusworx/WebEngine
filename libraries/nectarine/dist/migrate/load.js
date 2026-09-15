"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMigrationDocuments = loadMigrationDocuments;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const yaml_js_1 = require("../config/yaml.js");
const migration_js_1 = require("../compiler/migration.js");
const YAML_FILE = /\.ya?ml$/i;
/**
 * Load versioned migration YAML documents from a directory.
 *
 * Missing directories yield `[]` so apps can wire a migrations folder before
 * any files exist. Files are read in name order; {@link compileMigrations}
 * sorts by the `version` field.
 */
function loadMigrationDocuments(directory) {
    if (typeof directory !== "string" || directory.trim() === "") {
        throw new migration_js_1.MigrationCompileError("loadMigrationDocuments requires a directory path");
    }
    if (!node_fs_1.default.existsSync(directory)) {
        return [];
    }
    const stat = node_fs_1.default.statSync(directory);
    if (!stat.isDirectory()) {
        throw new migration_js_1.MigrationCompileError(`Not a migration directory: ${directory}`);
    }
    const names = node_fs_1.default
        .readdirSync(directory)
        .filter((name) => YAML_FILE.test(name))
        .sort((left, right) => left.localeCompare(right));
    return names.map((name) => (0, yaml_js_1.loadYaml)(node_path_1.default.join(directory, name)));
}
//# sourceMappingURL=load.js.map