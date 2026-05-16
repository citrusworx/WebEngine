import { Seltzer } from "@citrusworx/seltzer";
import { WPCore } from "./WPCore";
import { requestWordPress } from "./route-utils";
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
    getApp() {
        return this.app;
    }
}
//# sourceMappingURL=WPClient.js.map