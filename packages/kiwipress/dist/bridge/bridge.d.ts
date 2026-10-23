import { WPCore, type WPCoreConfig } from "../core/WPCore.js";
import { type PreviewDocument, type PreviewLink, type PreviewLinkSource } from "./preview.js";
/** Public health payload from `GET /wp-json/kiwipress/v1/health`. */
export type BridgeHealth = {
    plugin_version: string;
    wp_version: string;
    lockdown: boolean;
    paired: boolean;
    frontend_url_set: boolean;
    site_url: string;
    /** Empty on 0.1.0 sites, which omit the field. 0.2.0 includes `preview`. */
    features: string[];
};
/** Settings payload from `GET` or `POST /wp-json/kiwipress/v1/settings`. */
export type BridgeSettings = {
    frontend_url: string;
    lockdown: boolean;
    paired: boolean;
    project_label: string;
    /** Path only. Empty when an older plugin does not send the field. */
    preview_path: string;
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
    /**
     * `GET /wp-json/kiwipress/v1/preview` with the token header.
     *
     * Unauthenticated, including when `WP_USER` / `WP_APP_PASSWORD` (or the
     * constructor credentials) are set. A bad Authorization header would make
     * WordPress reject this public route.
     */
    preview(token: string): Promise<PreviewDocument>;
    /**
     * `POST /wp-json/kiwipress/v1/preview/token`. Requires the caller to be
     * able to edit the post. `source: "auto"` lets WordPress pick an autosave
     * when one exists.
     */
    createPreviewLink(input: {
        postId: number;
        source?: PreviewLinkSource;
    }): Promise<PreviewLink>;
    private endpoint;
    private request;
}
