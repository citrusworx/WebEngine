import { Categories } from "../categories/categories.js";
import { Comments } from "../comments/comments.js";
import { createNativeCms, type NativeCms } from "./native.js";
import { NectarineStore } from "./store.js";
import type { CmsMode } from "./types.js";
import { Pages } from "../pages/pages.js";
import { Posts } from "../posts/posts.js";
import { Tags } from "../tags/tags.js";
import { Users } from "../users/users.js";
import { WPAuth } from "../core/WPAuth.js";
import { WPSync, type WordPressClients } from "../core/WPSync.js";
import type { WPCoreConfig } from "../core/WPCore.js";

export type KiwiPressConfig = Partial<WPCoreConfig> & {
    mode?: CmsMode;
    store?: NectarineStore;
};

export class KiwiPress {
    readonly auth: WPAuth;
    readonly store: NectarineStore;
    readonly native: NativeCms;
    readonly sync?: WPSync;
    mode: CmsMode;

    private readonly config: KiwiPressConfig;
    private readonly wp?: WordPressClients;

    constructor(config: KiwiPressConfig = {}) {
        this.config = config;
        this.mode = config.mode ?? "wordpress";
        this.store = config.store ?? new NectarineStore();
        this.native = createNativeCms(this.store);
        this.auth = WPAuth.fromConfig(config);

        const url = config.url?.trim() || (typeof process !== "undefined" ? process.env.WP_URL?.trim() : "");

        if (url) {
            const wordpressConfig = { ...config, url };
            this.wp = {
                posts: new Posts(wordpressConfig),
                pages: new Pages(wordpressConfig),
                users: new Users(wordpressConfig),
                categories: new Categories(wordpressConfig),
                tags: new Tags(wordpressConfig),
                comments: new Comments(wordpressConfig)
            };
            this.sync = new WPSync(this.wp, this.store, url);
        } else if (this.mode === "wordpress") {
            throw new Error("KiwiPress requires a WordPress URL via config.url or process.env.WP_URL.");
        }
    }

    static connect(config: KiwiPressConfig = {}): KiwiPress {
        return new KiwiPress(config);
    }

    get wordpress(): WordPressClients {
        if (!this.wp) {
            throw new Error("KiwiPress WordPress clients require config.url or process.env.WP_URL.");
        }

        return this.wp;
    }

    toNectarine(store = this.store): KiwiPress {
        return new KiwiPress({
            ...this.config,
            mode: "nectarine",
            store
        });
    }

    promote(): this {
        this.mode = "nectarine";
        return this;
    }

    useWordPress(): this {
        if (!this.wp) {
            throw new Error("KiwiPress WordPress clients require config.url or process.env.WP_URL.");
        }

        this.mode = "wordpress";
        return this;
    }
}
