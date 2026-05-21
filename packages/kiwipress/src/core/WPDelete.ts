import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { RouteParams, WPCoreConfig } from "./WPCore.js";
import { WPClient } from "./WPClient.js";

export class WPDelete extends WPClient {
    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
    }

    protected delete(route: Route<Endpoint>, params?: RouteParams) {
        return this.mutate(route, undefined, params);
    }
}
