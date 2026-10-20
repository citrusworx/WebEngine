import type { ServerResponse } from "node:http";
/** Structured handler result. The runtime alone writes the HTTP response. */
export type ResponseData = {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
};
/**
 * True when `value` is a ResponseData shape: a plain object whose keys are only
 * `status`, `headers`, and/or `body`. Bare payloads (objects, arrays, strings)
 * are not wrapped — handlers must return `{ body: ... }`.
 */
export declare function isResponseData(value: unknown): value is ResponseData;
/**
 * Mark an object as an explicit transport result for `generateRoutes`.
 * Unbranded `{ status?, headers?, body? }` payloads stay wrapped as `{ body }`.
 */
export declare function response(data: ResponseData): ResponseData;
/** True when `value` was produced by {@link response}. */
export declare function isExplicitResponse(value: unknown): value is ResponseData;
export type SendOptions = {
    /**
     * Write the headers a GET would send, including `Content-Length` of the
     * encoded body, and write no bytes. Used for HEAD.
     */
    head?: boolean;
};
/**
 * Apply ResponseData defaults and write the HTTP response.
 * No-op if headers were already sent.
 * Status 204 and 304 never include a body. `head: true` never includes a body.
 */
export declare function send(res: ServerResponse, data: ResponseData, options?: SendOptions): void;
