import { Seltzer } from "@citrusworx/seltzer";
import type { Endpoint, Route } from "@citrusworx/seltzer";
import { WPCore, type RouteParams, type WPCoreConfig } from "./WPCore.js";
import { requestWordPress, requestWordPressPage } from "./route-utils.js";
import { asCollection } from "./normalize.js";
import { createMediaUploadInit } from "../media/upload.js";
import type { MediaUploadPayload, WordPressPayload } from "../types/api.js";

export class WPClient extends WPCore {
    protected readonly app: Seltzer;

    constructor(config?: Partial<WPCoreConfig>) {
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

    protected buildEndpoint(route: Route<Endpoint>, params?: RouteParams): Endpoint {
        const path = this.interpolatePath(route.path, params);
        const endpoint = `${this.config.url}/${this.config.apiBase}${path}`;

        return {
            route,
            path,
            endpoint,
            options: {
                baseUrl: `${this.config.url}/${this.config.apiBase}`,
                headers: this.createAuthHeaders(),
                allowSelfSigned: this.config.allowSelfSigned
            }
        };
    }

    protected execute(route: Route<Endpoint>, params?: RouteParams) {
        const endpoint = this.buildEndpoint(route, params);
        return route.handler(endpoint);
    }

    protected mutate(route: Route<Endpoint>, body?: WordPressPayload, params?: RouteParams) {
        const endpoint = this.buildEndpoint(route, params);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(endpoint.options?.headers ?? {})
        };

        return requestWordPress(endpoint, {
            method: route.method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
    }

    protected mutateUpload(route: Route<Endpoint>, body: MediaUploadPayload, params?: RouteParams) {
        const endpoint = this.buildEndpoint(route, params);
        const upload = createMediaUploadInit(body);
        const headers: Record<string, string> = {
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

    async listAll(collection: string, query: Record<string, string> = {}): Promise<unknown[]> {
        const items: unknown[] = [];
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

    protected getApp(): Seltzer {
        return this.app;
    }
}
