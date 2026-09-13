"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parser = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const sql_js_1 = require("../compiler/sql.js");
exports.parser = {
    // Create parseYAML function that takes a filepath and returns the parsed YAML as an object
    yaml: (filepath) => {
        const file = node_fs_1.default.readFileSync(filepath, 'utf8');
        const yaml = js_yaml_1.default.load(file);
        return yaml;
    },
    // Create registerRoute function that takes a YAML string, method, and route, and returns the route configuration for that method and route
    registerRoute: (yaml, method, route) => {
        if (!yaml.includes("api.yml") && !yaml.endsWith("api.yaml")) {
            return "Config must end with 'api.yml' or be named 'api.yaml'.";
        }
        // Take YAML and parse into obj
        const api_obj = exports.parser.yaml(yaml);
        // Capture specific part of obj for routes ex api_obj["get"]["allUsers"]
        const config = api_obj[method]?.[route];
        if (!config) {
            throw new Error(`Route configuration not found for method: ${method}, route: ${route}`);
        }
        return config;
    },
    // Create genSQL function that takes a YAML string, type, method, and config, and returns the SQL statement for that type, method, and config (ex: genSQL('user.yml, 'user', 'get', 'UserById');
    genSQL: (yaml, type, method, config) => {
        // Take sql.yml and parse
        const sql_obj = exports.parser.yaml(yaml);
        // to create SubSQL obj for CRUD and simplicity
        const obj = sql_obj[type]?.[method]?.[config];
        if (!obj) {
            throw new Error(`SQL Configuration not found for that type: ${type}, method: ${method}, config: ${config}`);
        }
        return obj;
    },
    /**
     * Compile a query object from {@link parser.genSQL} into SQL.
     * Delegates to the shared compiler so this is not a second code path.
     * Pass `method` for DELETE (and to disambiguate incomplete shapes).
     */
    buildSQL: (genSQL, method) => {
        return (0, sql_js_1.compileQuery)(genSQL, method);
    },
};
//# sourceMappingURL=util.js.map