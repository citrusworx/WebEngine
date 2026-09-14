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
/** Apply ResponseData defaults and write the HTTP response. No-op if headers were already sent. */
export declare function send(res: ServerResponse, data: ResponseData): void;
