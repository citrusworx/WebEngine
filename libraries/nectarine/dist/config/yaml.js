"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchema = void 0;
exports.loadYaml = loadYaml;
const node_fs_1 = __importDefault(require("node:fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Load and parse a YAML file. Library primitive — apps should not reimplement this.
 */
function loadYaml(filepath) {
    if (!node_fs_1.default.existsSync(filepath)) {
        throw new Error(`Nectarine YAML not found: ${filepath}`);
    }
    const source = node_fs_1.default.readFileSync(filepath, "utf8");
    const parsed = js_yaml_1.default.load(source);
    if (parsed === null || parsed === undefined) {
        throw new Error(`Nectarine YAML is empty: ${filepath}`);
    }
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`Nectarine YAML must parse to an object: ${filepath}`);
    }
    return parsed;
}
/** Alias matching Nectarine docs / schema loading. */
exports.loadSchema = loadYaml;
//# sourceMappingURL=yaml.js.map