import type { Endpoint } from "../types.js";
export declare class HttpError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly body: string;
    constructor(status: number, statusText: string, body: string);
}
export declare const client: {
    get(endpoint: Endpoint): Promise<unknown>;
    post(endpoint: Endpoint, data: unknown): Promise<unknown>;
    put(endpoint: Endpoint, data: unknown): Promise<unknown>;
    patch(endpoint: Endpoint, data: unknown): Promise<unknown>;
    delete(endpoint: Endpoint): Promise<unknown>;
};
