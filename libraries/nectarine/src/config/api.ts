import { loadYaml } from "./yaml.js";

export type ApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiOperation = {
    resource: string;
    crud: string;
    name: string;
    method: ApiHttpMethod;
    path: string;
    query?: string;
    body?: Record<string, string>;
};

const HTTP_METHODS = new Set<ApiHttpMethod>(["GET", "POST", "PUT", "PATCH", "DELETE"]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asHttpMethod(value: unknown): ApiHttpMethod | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const method = value.trim().toUpperCase();
    return HTTP_METHODS.has(method as ApiHttpMethod) ? (method as ApiHttpMethod) : undefined;
}

function asPath(spec: Record<string, unknown>): string | undefined {
    if (typeof spec.endpoint === "string" && spec.endpoint.trim()) {
        return spec.endpoint.trim();
    }

    if (typeof spec.path === "string" && spec.path.trim()) {
        return spec.path.trim();
    }

    return undefined;
}

function asQuery(spec: Record<string, unknown>): string | undefined {
    return typeof spec.query === "string" && spec.query.trim() ? spec.query.trim() : undefined;
}

function asBody(spec: Record<string, unknown>): Record<string, string> | undefined {
    if (!isRecord(spec.body)) {
        return undefined;
    }

    const body: Record<string, string> = {};
    for (const [field, type] of Object.entries(spec.body)) {
        if (typeof type === "string" && type.trim()) {
            body[field] = type.trim();
        }
    }

    return Object.keys(body).length > 0 ? body : undefined;
}

function operationSpec(value: unknown): Record<string, unknown> | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    return isRecord(value.api) ? value.api : value;
}

function isOperationLike(value: unknown): boolean {
    const spec = operationSpec(value);
    return Boolean(spec && asHttpMethod(spec.method) && asPath(spec));
}

function looksLikeResourceBlock(api: Record<string, unknown>): boolean {
    return Object.values(api).some(
        (crud) => isRecord(crud) && Object.values(crud).some(isOperationLike),
    );
}

function resolveResourceBlock(
    resource: string,
    api: Record<string, unknown>,
): Record<string, unknown> | undefined {
    const named = api[resource];
    if (isRecord(named)) {
        return named;
    }

    if (looksLikeResourceBlock(api)) {
        return api;
    }

    return undefined;
}

function toOperation(
    resource: string,
    crud: string,
    name: string,
    value: unknown,
): ApiOperation | undefined {
    const spec = operationSpec(value);
    if (!spec) {
        return undefined;
    }

    const method = asHttpMethod(spec.method);
    const path = asPath(spec);
    if (!method || !path) {
        return undefined;
    }

    const operation: ApiOperation = { resource, crud, name, method, path };
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
export function listApiOperations(
    resource: string,
    api: Record<string, unknown>,
): ApiOperation[] {
    const block = resolveResourceBlock(resource, api);
    if (!block) {
        return [];
    }

    const operations: ApiOperation[] = [];

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
export function loadApiOperations(resource: string, apiPath: string): ApiOperation[] {
    return listApiOperations(resource, loadYaml(apiPath));
}
