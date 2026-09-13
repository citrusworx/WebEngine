import axios, { type AxiosRequestConfig } from "axios";

export const DO_API_BASE = "https://api.digitalocean.com/v2";
export const DEFAULT_TOKEN_ENV = "DO_TOKEN";

export class DigitalOceanError extends Error {
    readonly status?: number;
    readonly id?: string;
    readonly requestId?: string;
    readonly details?: unknown;

    constructor(
        message: string,
        options?: {
            status?: number;
            id?: string;
            requestId?: string;
            details?: unknown;
        }
    ) {
        super(message);
        this.name = "DigitalOceanError";
        this.status = options?.status;
        this.id = options?.id;
        this.requestId = options?.requestId;
        this.details = options?.details;
    }
}

export function getDoToken(envName = DEFAULT_TOKEN_ENV): string {
    const token = process.env[envName]?.trim();
    if (!token) {
        throw new DigitalOceanError(
            `${envName} is not set. Export a DigitalOcean personal access token (for example: export ${DEFAULT_TOKEN_ENV}=dop_v1_…).`
        );
    }
    return token;
}

export function authHeaders(
    extra?: Record<string, string>,
    envName = DEFAULT_TOKEN_ENV
): Record<string, string> {
    return {
        Authorization: `Bearer ${getDoToken(envName)}`,
        "Content-Type": "application/json",
        ...extra
    };
}

export function wrapDoError(error: unknown): DigitalOceanError {
    if (error instanceof DigitalOceanError) {
        return error;
    }

    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | { id?: string; message?: string; request_id?: string }
            | undefined;
        return new DigitalOceanError(
            data?.message ?? error.message ?? "DigitalOcean API request failed",
            {
                status: error.response?.status,
                id: data?.id,
                requestId: data?.request_id,
                details: data ?? error.response?.data
            }
        );
    }

    return new DigitalOceanError(
        error instanceof Error ? error.message : "Unknown DigitalOcean error"
    );
}

export async function doRequest<T>(config: AxiosRequestConfig): Promise<T> {
    try {
        const response = await axios.request<T>({
            baseURL: DO_API_BASE,
            ...config,
            headers: {
                ...authHeaders(),
                ...config.headers
            }
        });
        return response.data;
    } catch (error) {
        throw wrapDoError(error);
    }
}

export interface DoClientConfig {
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    data?: unknown;
}

export const client = {
    get<T = unknown>(url: string, config?: DoClientConfig) {
        return doRequest<T>({
            method: "GET",
            url,
            params: config?.params,
            headers: config?.headers
        }).then((data) => ({ data }));
    },
    post<T = unknown>(url: string, data?: unknown, config?: DoClientConfig) {
        return doRequest<T>({
            method: "POST",
            url,
            data,
            headers: config?.headers
        }).then((data) => ({ data }));
    },
    put<T = unknown>(url: string, data?: unknown, config?: DoClientConfig) {
        return doRequest<T>({
            method: "PUT",
            url,
            data,
            headers: config?.headers
        }).then((data) => ({ data }));
    },
    patch<T = unknown>(url: string, data?: unknown, config?: DoClientConfig) {
        return doRequest<T>({
            method: "PATCH",
            url,
            data,
            headers: config?.headers
        }).then((data) => ({ data }));
    },
    delete<T = unknown>(url: string, config?: DoClientConfig) {
        return doRequest<T>({
            method: "DELETE",
            url,
            data: config?.data,
            headers: config?.headers
        }).then((data) => ({ data }));
    }
};
