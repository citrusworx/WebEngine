export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Flattened `*API.yml` operation. Same shape as
 * `@citrusworx/nectarine/config` `ApiOperation` — Nectarine's
 * `listApiOperations` result is structurally assignable to this type.
 *
 * Seltzer does not import Nectarine. Pass the array in from the host,
 * or build it by hand. This type is the input contract for
 * {@link generateRoutes} only.
 */
export type ApiOperation = {
    resource: string;
    crud: string;
    name: string;
    method: HttpMethod;
    path: string;
    query?: string;
    body?: Record<string, string>;
};
