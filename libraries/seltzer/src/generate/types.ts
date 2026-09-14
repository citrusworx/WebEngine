export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

/**
 * Flattened `*API.yml` operation.
 *
 * YAML layout: `resource → crud → operationName → api: { method, endpoint, query?, body? }`.
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
