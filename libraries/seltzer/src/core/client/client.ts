import type { Endpoint } from "../types.js";

const BODY_SNIPPET_LIMIT = 200;

export class HttpError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly body: string;

    constructor(status: number, statusText: string, body: string) {
        const snippet = snippetBody(body);
        super(snippet ? `HTTP ${status} ${statusText}: ${snippet}` : `HTTP ${status} ${statusText}`);
        this.name = "HttpError";
        this.status = status;
        this.statusText = statusText;
        this.body = body;
    }
}

function snippetBody(body: string): string {
    const trimmed = body.trim();
    if (!trimmed) {
        return "";
    }
    return trimmed.length > BODY_SNIPPET_LIMIT ? `${trimmed.slice(0, BODY_SNIPPET_LIMIT)}…` : trimmed;
}

function resolveUrl(endpoint: Endpoint): string {
    return endpoint.options?.baseUrl ? `${endpoint.options.baseUrl}${endpoint.path}` : endpoint.path;
}

function jsonHeaders(endpoint: Endpoint): Record<string, string> {
    return {
        "Content-Type": "application/json",
        ...(endpoint.options?.headers ?? {}),
    };
}

function isJsonContentType(contentType: string | null): boolean {
    if (!contentType) {
        return false;
    }
    const media = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    return media === "application/json" || media.endsWith("+json");
}

async function parseSuccessBody(res: Response): Promise<unknown> {
    if (res.status === 204 || res.status === 205) {
        return undefined;
    }

    const contentType = res.headers.get("content-type");
    const text = await res.text();

    if (text.length === 0) {
        return undefined;
    }

    if (isJsonContentType(contentType)) {
        return JSON.parse(text);
    }

    // No Content-Type: keep the previous JSON default when the body is JSON, else text.
    if (!contentType) {
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    return text;
}

type FetchInit = RequestInit & { dispatcher?: unknown };

async function insecureDispatcher(): Promise<unknown> {
    try {
        const specifier = "undici";
        const mod = (await import(specifier)) as {
            Agent?: new (options: { connect: { rejectUnauthorized: boolean } }) => unknown;
        };
        if (typeof mod.Agent !== "function") {
            throw new Error("undici.Agent is not available");
        }
        return new mod.Agent({
            connect: { rejectUnauthorized: false },
        });
    } catch {
        throw new Error(
            "Endpoint.options.allowSelfSigned requires the undici package so fetch can use Agent({ connect: { rejectUnauthorized: false } }). Install undici in the host, or use a trusted certificate.",
        );
    }
}

async function request(endpoint: Endpoint, init: RequestInit): Promise<unknown> {
    const url = resolveUrl(endpoint);
    const fetchInit: FetchInit = { ...init };
    const allowSelfSigned = Boolean(endpoint.options?.allowSelfSigned);

    if (allowSelfSigned && url.startsWith("https://")) {
        fetchInit.dispatcher = await insecureDispatcher();
    }

    const res = await fetch(url, fetchInit as RequestInit);

    if (!res.ok) {
        throw new HttpError(res.status, res.statusText, await res.text());
    }

    return parseSuccessBody(res);
}

export const client = {
    get(endpoint: Endpoint) {
        return request(endpoint, {
            method: "GET",
            headers: endpoint.options?.headers,
        });
    },
    post(endpoint: Endpoint, data: unknown) {
        return request(endpoint, {
            method: "POST",
            headers: jsonHeaders(endpoint),
            body: JSON.stringify(data),
        });
    },
    put(endpoint: Endpoint, data: unknown) {
        return request(endpoint, {
            method: "PUT",
            headers: jsonHeaders(endpoint),
            body: JSON.stringify(data),
        });
    },
    patch(endpoint: Endpoint, data: unknown) {
        return request(endpoint, {
            method: "PATCH",
            headers: jsonHeaders(endpoint),
            body: JSON.stringify(data),
        });
    },
    delete(endpoint: Endpoint) {
        return request(endpoint, {
            method: "DELETE",
            headers: endpoint.options?.headers,
        });
    },
};
