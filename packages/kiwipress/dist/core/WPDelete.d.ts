import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { RouteParams, WPCoreConfig } from "./WPCore.js";
import { WPClient } from "./WPClient.js";
export declare class WPDelete extends WPClient {
    constructor(config?: Partial<WPCoreConfig>);
    protected delete(route: Route<Endpoint>, params?: RouteParams): Promise<any>;
}
