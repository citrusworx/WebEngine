import { Seltzer } from "@citrusworx/seltzer";
import type { Endpoint, Route } from "@citrusworx/seltzer";
import { WPCore, type RouteParams, type WPCoreConfig } from "./WPCore";
import { requestWordPress } from "./route-utils";
import type { WordPressPayload } from "../types/api";

export class WPClient extends WPCore {
    protected readonly app: Seltzer;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.app = Seltzer.init().handler({
            adapter: "node:http",
            options: {
                baseUrl: `${this.config.url}/${this.config.apiBase}`,
                headers: this.createAuthHeaders()
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
                headers: this.createAuthHeaders()
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

    protected getApp(): Seltzer {
        return this.app;
    }
}
