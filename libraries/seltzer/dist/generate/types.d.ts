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
    /**
     * Optional HTTP status for a successful payload wrap.
     * Copied from YAML `api.status` by Nectarine `listApiOperations`.
     * Omitting it keeps the historic `{ body }` / 200 default.
     */
    status?: number;
};
