import { parser } from "@citrusworx/nectarine/util";
function asObject(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return null;
}
function readApiNode(value) {
    const node = asObject(value);
    const api = asObject(node?.api) ?? node;
    if (!api) {
        return null;
    }
    if (typeof api.method === "string" && typeof api.endpoint === "string") {
        return {
            method: api.method,
            endpoint: api.endpoint
        };
    }
    return null;
}
function walkNamedRoutes(resource, operation, named, routes) {
    const group = asObject(named);
    if (!group) {
        return;
    }
    const direct = readApiNode(group);
    if (direct) {
        routes.push({
            resource,
            operation,
            name: operation,
            method: direct.method,
            endpoint: direct.endpoint
        });
        return;
    }
    for (const [name, node] of Object.entries(group)) {
        const api = readApiNode(node);
        if (!api) {
            continue;
        }
        routes.push({
            resource,
            operation,
            name,
            method: api.method,
            endpoint: api.endpoint
        });
    }
}
export function loadNectarineApi(data) {
    const root = asObject(data) ?? {};
    const routes = [];
    const operations = new Set(["get", "create", "update", "delete", "post", "put", "patch"]);
    const looksNested = Object.values(root).some((value) => {
        const node = asObject(value);
        return node && Object.keys(node).some((key) => operations.has(key));
    });
    if (looksNested) {
        for (const [resource, methods] of Object.entries(root)) {
            const methodGroup = asObject(methods);
            if (!methodGroup) {
                continue;
            }
            for (const [operation, named] of Object.entries(methodGroup)) {
                walkNamedRoutes(resource, operation, named, routes);
            }
        }
        return routes;
    }
    for (const [operation, named] of Object.entries(root)) {
        walkNamedRoutes("resource", operation, named, routes);
    }
    return routes;
}
export function loadNectarineApiFile(filepath) {
    return loadNectarineApi(parser.yaml(filepath));
}
//# sourceMappingURL=api.js.map