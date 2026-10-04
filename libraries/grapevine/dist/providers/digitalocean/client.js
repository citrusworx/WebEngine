import axios from "axios";
export const DO_API_BASE = "https://api.digitalocean.com/v2";
export const DEFAULT_TOKEN_ENV = "DO_TOKEN";
export class DigitalOceanError extends Error {
    status;
    id;
    requestId;
    details;
    constructor(message, options) {
        super(message);
        this.name = "DigitalOceanError";
        this.status = options?.status;
        this.id = options?.id;
        this.requestId = options?.requestId;
        this.details = options?.details;
    }
}
export function getDoToken(envName = DEFAULT_TOKEN_ENV) {
    const token = process.env[envName]?.trim();
    if (!token) {
        throw new DigitalOceanError(`${envName} is not set. Export a DigitalOcean personal access token (for example: export ${DEFAULT_TOKEN_ENV}=dop_v1_…).`);
    }
    return token;
}
export function authHeaders(extra, envName = DEFAULT_TOKEN_ENV) {
    return {
        Authorization: `Bearer ${getDoToken(envName)}`,
        "Content-Type": "application/json",
        ...extra
    };
}
export function wrapDoError(error) {
    if (error instanceof DigitalOceanError) {
        return error;
    }
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        return new DigitalOceanError(data?.message ?? error.message ?? "DigitalOcean API request failed", {
            status: error.response?.status,
            id: data?.id,
            requestId: data?.request_id,
            details: data ?? error.response?.data
        });
    }
    return new DigitalOceanError(error instanceof Error ? error.message : "Unknown DigitalOcean error");
}
export async function doRequest(config) {
    try {
        const response = await axios.request({
            baseURL: DO_API_BASE,
            ...config,
            headers: {
                ...authHeaders(),
                ...config.headers
            }
        });
        return response.data;
    }
    catch (error) {
        throw wrapDoError(error);
    }
}
const MAX_LIST_PAGES = 100;
function nextPagePath(body) {
    const links = body.links;
    if (!links || typeof links !== "object") {
        return undefined;
    }
    const pages = links.pages;
    const next = pages?.next;
    return typeof next === "string" && next.length > 0 ? next : undefined;
}
/** Follow `links.pages.next` and concatenate one collection key. */
export async function doList(url, collectionKey, params) {
    const items = [];
    let path = url;
    let query = { per_page: 200, ...params };
    for (let page = 0; page < MAX_LIST_PAGES && path; page += 1) {
        const response = await doRequest({
            method: "GET",
            url: path,
            params: query
        });
        const chunk = response[collectionKey];
        if (Array.isArray(chunk)) {
            items.push(...chunk);
        }
        const next = nextPagePath(response);
        if (!next) {
            return items;
        }
        path = next.startsWith(DO_API_BASE) ? next.slice(DO_API_BASE.length) : next;
        query = undefined;
    }
    throw new DigitalOceanError(`DigitalOcean list ${url} exceeded ${MAX_LIST_PAGES} pages`);
}
export const client = {
    get(url, config) {
        return doRequest({
            method: "GET",
            url,
            params: config?.params,
            headers: config?.headers
        }).then((data) => ({ data }));
    },
    post(url, data, config) {
        return doRequest({
            method: "POST",
            url,
            data,
            headers: config?.headers
        }).then((data) => ({ data }));
    },
    put(url, data, config) {
        return doRequest({
            method: "PUT",
            url,
            data,
            headers: config?.headers
        }).then((data) => ({ data }));
    },
    patch(url, data, config) {
        return doRequest({
            method: "PATCH",
            url,
            data,
            headers: config?.headers
        }).then((data) => ({ data }));
    },
    delete(url, config) {
        return doRequest({
            method: "DELETE",
            url,
            data: config?.data,
            headers: config?.headers
        }).then((data) => ({ data }));
    }
};
//# sourceMappingURL=client.js.map