import type { Endpoint, Route } from "@citrusworx/seltzer";
import { WPClient } from "./WPClient.js";
export declare class WPRead extends WPClient {
    protected read(route: Route<Endpoint>, params?: Record<string, string | number>): import("@citrusworx/seltzer").ResponseData | Promise<import("@citrusworx/seltzer").ResponseData>;
}
