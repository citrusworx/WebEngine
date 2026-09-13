import { type AxiosRequestConfig } from "axios";
export declare const DO_API_BASE = "https://api.digitalocean.com/v2";
export declare const DEFAULT_TOKEN_ENV = "DO_TOKEN";
export declare class DigitalOceanError extends Error {
    readonly status?: number;
    readonly id?: string;
    readonly requestId?: string;
    readonly details?: unknown;
    constructor(message: string, options?: {
        status?: number;
        id?: string;
        requestId?: string;
        details?: unknown;
    });
}
export declare function getDoToken(envName?: string): string;
export declare function authHeaders(extra?: Record<string, string>, envName?: string): Record<string, string>;
export declare function wrapDoError(error: unknown): DigitalOceanError;
export declare function doRequest<T>(config: AxiosRequestConfig): Promise<T>;
export interface DoClientConfig {
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    data?: unknown;
}
export declare const client: {
    get<T = unknown>(url: string, config?: DoClientConfig): Promise<{
        data: T;
    }>;
    post<T = unknown>(url: string, data?: unknown, config?: DoClientConfig): Promise<{
        data: T;
    }>;
    put<T = unknown>(url: string, data?: unknown, config?: DoClientConfig): Promise<{
        data: T;
    }>;
    patch<T = unknown>(url: string, data?: unknown, config?: DoClientConfig): Promise<{
        data: T;
    }>;
    delete<T = unknown>(url: string, config?: DoClientConfig): Promise<{
        data: T;
    }>;
};
