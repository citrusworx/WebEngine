import type { Endpoint, Route } from "@citrusworx/seltzer";
import { WPClient } from "./WPClient.js";
export declare class WPRead extends WPClient {
    protected read(route: Route<Endpoint>, params?: Record<string, string | number>): any;
}
