import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { RouteParams, WPCoreConfig } from "./WPCore.js";
import type { WordPressPayload } from "../types/api.js";
import { WPClient } from "./WPClient.js";

export class WPUpdate extends WPClient {
    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
    }

    protected update(route: Route<Endpoint>, body: WordPressPayload, params?: RouteParams) {
        return this.mutate(route, body, params);
    }
}
