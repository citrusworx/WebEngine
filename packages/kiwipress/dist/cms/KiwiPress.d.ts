import { type NativeCms } from "./native.js";
import { NectarineStore } from "./store.js";
import type { CmsMode } from "./types.js";
import { WPAuth } from "../core/WPAuth.js";
import { WPSync, type WordPressClients } from "../core/WPSync.js";
import type { WPCoreConfig } from "../core/WPCore.js";
export type KiwiPressConfig = Partial<WPCoreConfig> & {
    mode?: CmsMode;
    store?: NectarineStore;
};
export declare class KiwiPress {
    readonly auth: WPAuth;
    readonly store: NectarineStore;
    readonly native: NativeCms;
    readonly sync?: WPSync;
    mode: CmsMode;
    private readonly config;
    private readonly wp?;
    constructor(config?: KiwiPressConfig);
    static connect(config?: KiwiPressConfig): KiwiPress;
    get wordpress(): WordPressClients;
    toNectarine(store?: NectarineStore): KiwiPress;
    promote(): this;
    useWordPress(): this;
}
