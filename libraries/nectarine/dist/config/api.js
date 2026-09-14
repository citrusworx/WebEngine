"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listApiOperations = listApiOperations;
exports.loadApiOperations = loadApiOperations;
const yaml_js_1 = require("./yaml.js");
const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asHttpMethod(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const method = value.trim().toUpperCase();
    return HTTP_METHODS.has(method) ? method : undefined;
}
function asPath(spec) {
    if (typeof spec.endpoint === "string" && spec.endpoint.trim()) {
        return spec.endpoint.trim();
    }
    if (typeof spec.path === "string" && spec.path.trim()) {
        return spec.path.trim();
    }
    return undefined;
}
function asQuery(spec) {
    return typeof spec.query === "string" && spec.query.trim() ? spec.query.trim() : undefined;
}
function asBody(spec) {
    if (!isRecord(spec.body)) {
        return undefined;
    }
    const body = {};
    for (const [field, type] of Object.entries(spec.body)) {
        if (typeof type === "string" && type.trim()) {
            body[field] = type.trim();
        }
    }
    return Object.keys(body).length > 0 ? body : undefined;
}
function operationSpec(value) {
    if (!isRecord(value)) {
        return undefined;
    }
    return isRecord(value.api) ? value.api : value;
}
function isOperationLike(value) {
    const spec = operationSpec(value);
    return Boolean(spec && asHttpMethod(spec.method) && asPath(spec));
}
function looksLikeResourceBlock(api) {
    return Object.values(api).some((crud) => isRecord(crud) && Object.values(crud).some(isOperationLike));
}
function resolveResourceBlock(resource, api) {
    const named = api[resource];
    if (isRecord(named)) {
        return named;
    }
    if (looksLikeResourceBlock(api)) {
        return api;
    }
    return undefined;
}
function toOperation(resource, crud, name, value) {
    const spec = operationSpec(value);
    if (!spec) {
        return undefined;
    }
    const method = asHttpMethod(spec.method);
    const path = asPath(spec);
    if (!method || !path) {
        return undefined;
    }
    const operation = { resource, crud, name, method, path };
    const query = asQuery(spec);
    if (query) {
        operation.query = query;
    }
    const body = asBody(spec);
    if (body) {
        operation.body = body;
    }
    return operation;
}
/**
 * Flatten a resource `*API.yml` (already-loaded object) into HTTP operations.
 *
 * Blackwater YAML is `resource → crud → name → api.{ method, endpoint, query, body }`.
 * `endpoint` maps to {@link ApiOperation.path}. `path` is accepted as a fallback.
 *
 * Seltzer hosts / auto-wiring consumers should call
 * `listApiOperations(resource, loaded.api)` — Nectarine does not generate routes.
 */
function listApiOperations(resource, api) {
    const block = resolveResourceBlock(resource, api);
    if (!block) {
        return [];
    }
    const operations = [];
    for (const [crud, crudBlock] of Object.entries(block)) {
        if (!isRecord(crudBlock)) {
            continue;
        }
        for (const [name, value] of Object.entries(crudBlock)) {
            const operation = toOperation(resource, crud, name, value);
            if (operation) {
                operations.push(operation);
            }
        }
    }
    return operations;
}
/**
 * Load YAML from `apiPath` then {@link listApiOperations}.
 */
function loadApiOperations(resource, apiPath) {
    return listApiOperations(resource, (0, yaml_js_1.loadYaml)(apiPath));
}
//# sourceMappingURL=api.js.map