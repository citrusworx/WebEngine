import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { WordPressPayload } from "../types/api.js";
import type { RouteParams, WPCoreConfig } from "./WPCore.js";
import { WPClient } from "./WPClient.js";
export declare class WPDelete extends WPClient {
    constructor(config?: Partial<WPCoreConfig>);
    protected delete(route: Route<Endpoint>, params?: RouteParams, body?: WordPressPayload): Promise<any>;
}
