const BODY_SNIPPET_LIMIT = 200;
export class HttpError extends Error {
    constructor(status, statusText, body) {
        const snippet = snippetBody(body);
        super(snippet ? `HTTP ${status} ${statusText}: ${snippet}` : `HTTP ${status} ${statusText}`);
        this.name = "HttpError";
        this.status = status;
        this.statusText = statusText;
        this.body = body;
    }
}
function snippetBody(body) {
    const trimmed = body.trim();
    if (!trimmed) {
        return "";
    }
    return trimmed.length > BODY_SNIPPET_LIMIT ? `${trimmed.slice(0, BODY_SNIPPET_LIMIT)}…` : trimmed;
}
function resolveUrl(endpoint) {
    return endpoint.options?.baseUrl ? `${endpoint.options.baseUrl}${endpoint.path}` : endpoint.path;
}
function jsonHeaders(endpoint) {
    return {
        "Content-Type": "application/json",
        ...(endpoint.options?.headers ?? {}),
    };
}
function isJsonContentType(contentType) {
    if (!contentType) {
        return false;
    }
    const media = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    return media === "application/json" || media.endsWith("+json");
}
async function parseSuccessBody(res) {
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
        }
        catch {
            return text;
        }
    }
    return text;
}
async function insecureDispatcher() {
    try {
        const specifier = "undici";
        const mod = (await import(specifier));
        if (typeof mod.Agent !== "function") {
            throw new Error("undici.Agent is not available");
        }
        return new mod.Agent({
            connect: { rejectUnauthorized: false },
        });
    }
    catch {
        throw new Error("Endpoint.options.allowSelfSigned requires the undici package so fetch can use Agent({ connect: { rejectUnauthorized: false } }). Install undici in the host, or use a trusted certificate.");
    }
}
async function request(endpoint, init) {
    const url = resolveUrl(endpoint);
    const fetchInit = { ...init };
    const allowSelfSigned = Boolean(endpoint.options?.allowSelfSigned);
    if (allowSelfSigned && url.startsWith("https://")) {
        fetchInit.dispatcher = await insecureDispatcher();
    }
    const res = await fetch(url, fetchInit);
    if (!res.ok) {
        throw new HttpError(res.status, res.statusText, await res.text());
    }
    return parseSuccessBody(res);
}
export const client = {
    get(endpoint) {
        return request(endpoint, {
            method: "GET",
            headers: endpoint.options?.headers,
        });
    },
    post(endpoint, data) {
        return request(endpoint, {
            method: "POST",
            headers: jsonHeaders(endpoint),
            body: JSON.stringify(data),
        });
    },
    put(endpoint, data) {
        return request(endpoint, {
            method: "PUT",
            headers: jsonHeaders(endpoint),
            body: JSON.stringify(data),
        });
    },
    patch(endpoint, data) {
        return request(endpoint, {
            method: "PATCH",
            headers: jsonHeaders(endpoint),
            body: JSON.stringify(data),
        });
    },
    delete(endpoint) {
        return request(endpoint, {
            method: "DELETE",
            headers: endpoint.options?.headers,
        });
    },
};
//# sourceMappingURL=client.js.map