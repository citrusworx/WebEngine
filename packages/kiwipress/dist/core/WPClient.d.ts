import { Seltzer } from "@citrusworx/seltzer";
import type { Endpoint, Route } from "@citrusworx/seltzer";
import { WPCore, type RouteParams, type WPCoreConfig } from "./WPCore.js";
import type { WordPressPayload } from "../types/api.js";
export declare class WPClient extends WPCore {
    protected readonly app: Seltzer;
    constructor(config?: Partial<WPCoreConfig>);
    protected buildEndpoint(route: Route<Endpoint>, params?: RouteParams): Endpoint;
    protected execute(route: Route<Endpoint>, params?: RouteParams): any;
    protected mutate(route: Route<Endpoint>, body?: WordPressPayload, params?: RouteParams): Promise<any>;
    protected getApp(): Seltzer;
}
