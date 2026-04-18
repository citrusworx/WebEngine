"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parser = void 0;
exports.buildSQL = buildSQL;
const jsyaml = require('js-yaml');
const fs = require('fs');
exports.parser = {
    yaml: (filepath) => {
        const file = fs.readFileSync(filepath, 'utf8');
        const yaml = jsyaml.load(file);
        console.log(yaml);
        return yaml;
    },
    registerRoute: (yaml, method, route) => {
        if (!yaml.includes("api.yml") || !yaml.endsWith("api.yaml")) {
            return "Config must end with 'api.yml' or 'api.yaml'.";
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
    genSQL: (yaml, type, method, config) => {
        // Take sql.yml and parse
        const sql_obj = exports.parser.yaml(yaml);
        // to create SubSQL obj for CRUD and simplicity
        const obj = sql_obj[type]?.[method]?.[config];
        if (!obj) {
            throw new Error(`SQL Configuration not found for that type: ${type}, method: ${method}, config: ${config}`);
        }
        return obj;
    }
};
// Create buildSQL function
// 
// Test over CRUD cases to make sure that SQL statements are built properly
// Test over DB cases to generate SQL statments based on DB engine (Postgres, MySQL, MariaDB, MSSQL, etc)
// Create Playwright test for this function
function buildSQL() {
}
//# sourceMappingURL=util.js.map