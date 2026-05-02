import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { RouteParams, WPCoreConfig } from "./WPCore";
import { WPClient } from "./WPClient";

export class WPDelete extends WPClient {
    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
    }

    protected delete(route: Route<Endpoint>, params?: RouteParams) {
        return this.mutate(route, undefined, params);
    }
}
