import { createNativeCms } from "./native.js";
import { NectarineStore } from "./store.js";
import { WPAuth } from "../core/WPAuth.js";
import { createWordPressClients, WPSync } from "../core/WPSync.js";
export class KiwiPress {
    auth;
    store;
    native;
    sync;
    mode;
    config;
    wp;
    constructor(config = {}) {
        this.config = config;
        this.mode = config.mode ?? "wordpress";
        this.store = config.store ?? new NectarineStore();
        if (config.persistence) {
            this.store.usePersistence(config.persistence);
        }
        this.native = createNativeCms(this.store);
        this.auth = WPAuth.fromConfig(config);
        const url = config.url?.trim() || (typeof process !== "undefined" ? process.env.WP_URL?.trim() : "");
        if (url) {
            const wordpressConfig = { ...config, url };
            this.wp = createWordPressClients(wordpressConfig);
            this.sync = new WPSync(this.wp, this.store, url);
        }
        else if (this.mode === "wordpress") {
            throw new Error("KiwiPress requires a WordPress URL via config.url or process.env.WP_URL.");
        }
    }
    static connect(config = {}) {
        return new KiwiPress(config);
    }
    async ready() {
        await this.store.hydrate();
        return this;
    }
    persist() {
        return this.store.flush();
    }
    get persistence() {
        return this.store.persistence;
    }
    get wordpress() {
        if (!this.wp) {
            throw new Error("KiwiPress WordPress clients require config.url or process.env.WP_URL.");
        }
        return this.wp;
    }
    toNectarine(store = this.store) {
        return new KiwiPress({
            ...this.config,
            mode: "nectarine",
            store
        });
    }
    promote() {
        this.mode = "nectarine";
        return this;
    }
    useWordPress() {
        if (!this.wp) {
            throw new Error("KiwiPress WordPress clients require config.url or process.env.WP_URL.");
        }
        this.mode = "wordpress";
        return this;
    }
}
//# sourceMappingURL=KiwiPress.js.map