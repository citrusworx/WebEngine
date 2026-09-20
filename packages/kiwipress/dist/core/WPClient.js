import { Seltzer } from "@citrusworx/seltzer";
import { WPCore } from "./WPCore.js";
import { requestWordPress, requestWordPressPage } from "./route-utils.js";
import { asCollection } from "./normalize.js";
import { createMediaUploadInit } from "../media/upload.js";
export class WPClient extends WPCore {
    app;
    constructor(config) {
        super(config);
        this.app = Seltzer.init().handler({
            adapter: "node:http",
            options: {
                baseUrl: `${this.config.url}/${this.config.apiBase}`,
                headers: this.createAuthHeaders(),
                allowSelfSigned: this.config.allowSelfSigned
            }
        });
    }
    buildEndpoint(route, params) {
        const path = this.interpolatePath(route.path, params);
        const endpoint = `${this.config.url}/${this.config.apiBase}${path}`;
        return {
            route: route,
            path,
            endpoint,
            options: {
                baseUrl: `${this.config.url}/${this.config.apiBase}`,
                headers: this.createAuthHeaders(),
                allowSelfSigned: this.config.allowSelfSigned
            }
        };
    }
    execute(route, params) {
        const endpoint = this.buildEndpoint(route, params);
        return route.handler(endpoint);
    }
    mutate(route, body, params) {
        const endpoint = this.buildEndpoint(route, params);
        const headers = {
            "Content-Type": "application/json",
            ...(endpoint.options?.headers ?? {})
        };
        return requestWordPress(endpoint, {
            method: route.method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
    }
    mutateUpload(route, body, params) {
        const endpoint = this.buildEndpoint(route, params);
        const upload = createMediaUploadInit(body);
        const headers = {
            ...(endpoint.options?.headers ?? {}),
            ...upload.headers
        };
        if (typeof FormData !== "undefined" && upload.body instanceof FormData) {
            delete headers["Content-Type"];
            delete headers["content-type"];
        }
        return requestWordPress(endpoint, {
            method: route.method,
            headers,
            body: upload.body
        });
    }
    async listAll(collection, query = {}) {
        const items = [];
        let page = 1;
        let totalPages = 1;
        const maxPages = 1000;
        do {
            const search = new URLSearchParams({
                per_page: "100",
                ...query,
                page: String(page)
            });
            const result = await requestWordPressPage({
                path: `/${collection}`,
                endpoint: `${this.config.url}/${this.config.apiBase}/${collection}?${search.toString()}`,
                options: {
                    baseUrl: `${this.config.url}/${this.config.apiBase}`,
                    headers: this.createAuthHeaders(),
                    allowSelfSigned: this.config.allowSelfSigned
                }
            });
            items.push(...asCollection(result.data));
            totalPages = Math.min(result.totalPages, maxPages);
            page += 1;
        } while (page <= totalPages);
        return items;
    }
    getApp() {
        return this.app;
    }
}
//# sourceMappingURL=WPClient.js.map