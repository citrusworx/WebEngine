import { type NativeCms } from "./native.js";
import type { CmsPersistence } from "./persistence.js";
import { NectarineStore } from "./store.js";
import type { CmsMode } from "./types.js";
import { Bridge } from "../bridge/bridge.js";
import { WPAuth } from "../core/WPAuth.js";
import { WPSync, type WordPressClients } from "../core/WPSync.js";
import type { WPCoreConfig } from "../core/WPCore.js";
export type KiwiPressConfig = Partial<WPCoreConfig> & {
    mode?: CmsMode;
    store?: NectarineStore;
    persistence?: CmsPersistence;
};
export declare class KiwiPress {
    readonly auth: WPAuth;
    readonly store: NectarineStore;
    readonly native: NativeCms;
    readonly sync?: WPSync;
    mode: CmsMode;
    private readonly config;
    private readonly wp?;
    private readonly bridgeClient;
    constructor(config?: KiwiPressConfig);
    static connect(config?: KiwiPressConfig): KiwiPress;
    ready(): Promise<this>;
    persist(): Promise<void>;
    get persistence(): CmsPersistence | undefined;
    get wordpress(): WordPressClients;
    /**
     * WordPress bridge client for this site (`kiwipress/v1` plus credential check).
     * Content still moves through `wordpress` and `/wp/v2`.
     */
    get bridge(): Bridge;
    toNectarine(store?: NectarineStore): KiwiPress;
    promote(): this;
    useWordPress(): this;
}
