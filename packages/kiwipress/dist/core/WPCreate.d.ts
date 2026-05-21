import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { RouteParams, WPCoreConfig } from "./WPCore.js";
import type { WordPressPayload } from "../types/api.js";
import { WPClient } from "./WPClient.js";
export declare class WPCreate extends WPClient {
    constructor(config?: Partial<WPCoreConfig>);
    protected create(route: Route<Endpoint>, body: WordPressPayload, params?: RouteParams): Promise<any>;
}
