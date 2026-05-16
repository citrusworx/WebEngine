import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { RouteParams, WPCoreConfig } from "./WPCore";
import type { WordPressPayload } from "../types/api";
import { WPClient } from "./WPClient";
export declare class WPUpdate extends WPClient {
    constructor(config?: Partial<WPCoreConfig>);
    protected update(route: Route<Endpoint>, body: WordPressPayload, params?: RouteParams): Promise<any>;
}
