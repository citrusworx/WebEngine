export type ApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiOperation = {
    resource: string;
    crud: string;
    name: string;
    method: ApiHttpMethod;
    path: string;
    query?: string;
    body?: Record<string, string>;
    /** Optional HTTP success status for Seltzer `generateRoutes`. */
    status?: number;
};
/**
 * Flatten a resource `*API.yml` (already-loaded object) into HTTP operations.
 *
 * Blackwater YAML is `resource → crud → name → api.{ method, endpoint, query, body }`.
 * `endpoint` maps to {@link ApiOperation.path}. `path` is accepted as a fallback.
 *
 * Seltzer hosts / auto-wiring consumers should call
 * `listApiOperations(resource, loaded.api)` — Nectarine does not generate routes.
 */
export declare function listApiOperations(resource: string, api: Record<string, unknown>): ApiOperation[];
/**
 * Load YAML from `apiPath` then {@link listApiOperations}.
 */
export declare function loadApiOperations(resource: string, apiPath: string): ApiOperation[];
