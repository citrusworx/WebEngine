import { WPCore, type WPCoreConfig } from "../core/WPCore.js";
/** Public health payload from `GET /wp-json/kiwipress/v1/health`. */
export type BridgeHealth = {
    plugin_version: string;
    wp_version: string;
    lockdown: boolean;
    paired: boolean;
    frontend_url_set: boolean;
    site_url: string;
};
/** Settings payload from `GET` or `POST /wp-json/kiwipress/v1/settings`. */
export type BridgeSettings = {
    frontend_url: string;
    lockdown: boolean;
    paired: boolean;
    project_label: string;
};
export type BridgeSettingsPatch = Partial<BridgeSettings>;
/** Result of the single authenticated `users/me?context=edit` check. */
export type BridgeCredentialCheck = {
    id: number;
    slug: string;
    name: string;
};
/**
 * Client for the KiwiPress Bridge plugin.
 *
 * The library owns HTTP. `health()` is unauthenticated. Settings calls and
 * `verifyCredentials()` send the same application-password basic auth the
 * content client uses. `verifyCredentials()` reads public health first, then
 * makes one authenticated request: `GET /wp/v2/users/me?context=edit`.
 */
export declare class Bridge extends WPCore {
    constructor(config?: Partial<WPCoreConfig>);
    /** `GET /wp-json/kiwipress/v1/health`. No Authorization header. */
    health(): Promise<BridgeHealth>;
    /** `GET /wp-json/kiwipress/v1/settings`. Requires manage_options. */
    getSettings(): Promise<BridgeSettings>;
    /**
     * `POST /wp-json/kiwipress/v1/settings` with the provided keys only.
     * Omitted keys are left unchanged on the site.
     */
    saveSettings(partial: BridgeSettingsPatch): Promise<BridgeSettings>;
    /**
     * Confirm the plugin is active and the application password belongs to a
     * user who can manage options.
     *
     * Public health runs first. A deactivated plugin 404s `kiwipress/v1` while
     * `/wp/v2/users/me` would still succeed, so that 404 is `plugin_missing`
     * and not a successful credential check. The only authenticated request
     * is `GET /wp/v2/users/me?context=edit`. A 404 on that core route stays
     * `request_failed`.
     */
    verifyCredentials(): Promise<BridgeCredentialCheck>;
    private endpoint;
    private request;
}
