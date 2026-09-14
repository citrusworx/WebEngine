export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
/**
 * Flattened `*API.yml` operation — same shape as
 * `@citrusworx/nectarine/config` `ApiOperation`.
 *
 * Flatten with Nectarine `listApiOperations` / `loadApiOperations`.
 * This type is the input contract for {@link generateRoutes} only.
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
