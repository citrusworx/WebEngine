import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { RouteParams, WPCoreConfig } from "./WPCore.ts";
import type { WordPressPayload } from "../types/api.ts";
import { WPClient } from "./WPClient";

export class WPCreate extends WPClient {
    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
    }

    protected create(route: Route<Endpoint>, body: WordPressPayload, params?: RouteParams) {
        return this.mutate(route, body, params);
    }
}
