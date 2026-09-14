import { HTTP_METHODS } from "./types.js";
const HTTP_METHOD_SET = new Set(HTTP_METHODS);
function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asStringRecord(value) {
    if (!isPlainObject(value)) {
        return undefined;
    }
    const entries = Object.entries(value);
    if (entries.length === 0) {
        return undefined;
    }
    if (!entries.every(([, entry]) => typeof entry === "string")) {
        return undefined;
    }
    return Object.fromEntries(entries);
}
function readApiBlock(spec) {
    if (!isPlainObject(spec)) {
        return null;
    }
    if (isPlainObject(spec.api)) {
        return spec.api;
    }
    if ("method" in spec && "endpoint" in spec) {
        return spec;
    }
    return null;
}
function assertHttpMethod(value, label) {
    const method = String(value ?? "").toUpperCase();
    if (!HTTP_METHOD_SET.has(method)) {
        throw new Error(`Invalid HTTP method "${String(value ?? "")}" for ${label}`);
    }
    return method;
}
/**
 * Flatten loaded `*API.yml` (`resource → crud → operation → api`) into {@link ApiOperation}s.
 *
 * Lives next to {@link generateRoutes} so Nectarine can absorb this helper later
 * without changing the route compiler.
 */
export function listApiOperations(api) {
    const operations = [];
    for (const [resource, crudMap] of Object.entries(api)) {
        if (!isPlainObject(crudMap)) {
            continue;
        }
        for (const [crud, opMap] of Object.entries(crudMap)) {
            if (!isPlainObject(opMap)) {
                continue;
            }
            for (const [name, spec] of Object.entries(opMap)) {
                const block = readApiBlock(spec);
                if (!block) {
                    continue;
                }
                const label = `${resource}.${crud}.${name}`;
                const method = assertHttpMethod(block.method, label);
                const path = typeof block.endpoint === "string" ? block.endpoint.trim() : "";
                if (!path) {
                    throw new Error(`Missing api.endpoint for ${label}`);
                }
                const operation = {
                    resource,
                    crud,
                    name,
                    method,
                    path,
                };
                if (typeof block.query === "string" && block.query.trim()) {
                    operation.query = block.query.trim();
                }
                const body = asStringRecord(block.body);
                if (body) {
                    operation.body = body;
                }
                operations.push(operation);
            }
        }
    }
    return operations;
}
//# sourceMappingURL=list-api-operations.js.map