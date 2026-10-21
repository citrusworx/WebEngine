import { afterEach, describe, expect, it, vi } from "vitest";
import { KiwiPress } from "../cms/KiwiPress.js";
import { Bridge } from "./bridge.js";
import { BridgeError } from "./errors.js";

const wordpressConfig = {
    url: "https://cms.example.com/",
    username: "admin",
    appPassword: "aaaa bbbb cccc dddd"
};

const healthPayload = {
    plugin_version: "0.1.0",
    wp_version: "6.6",
    lockdown: true,
    paired: false,
    frontend_url_set: false,
    site_url: "https://cms.example.com"
};

const settingsPayload = {
    frontend_url: "https://app.example.com",
    lockdown: true,
    paired: true,
    project_label: "acme"
};

function jsonResponse(status: number, body: unknown) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (body === null ? "" : JSON.stringify(body))
    };
}

function headerRecord(init?: RequestInit): Record<string, string> {
    const headers = init?.headers;
    if (!headers || headers instanceof Headers || Array.isArray(headers)) {
        return {};
    }
    return headers as Record<string, string>;
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("Bridge", () => {
    it("reads public health without sending credentials", async () => {
        const fetchMock = vi.fn(async () => jsonResponse(200, healthPayload));
        vi.stubGlobal("fetch", fetchMock);

        const health = await new Bridge(wordpressConfig).health();

        expect(health).toEqual(healthPayload);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("https://cms.example.com/wp-json/kiwipress/v1/health");
        expect(init.method).toBe("GET");
        expect(headerRecord(init).Authorization).toBeUndefined();
    });

    it("reports a missing plugin when kiwipress/v1 returns 404", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(404, {
            code: "rest_no_route",
            message: "No route was found matching the URL and request method.",
            data: { status: 404 }
        })));

        const error = await new Bridge(wordpressConfig).health().then(() => null, (caught: unknown) => caught);

        expect(error).toBeInstanceOf(BridgeError);
        expect((error as BridgeError).code).toBe("plugin_missing");
        expect((error as BridgeError).status).toBe(404);
        expect((error as BridgeError).message).toMatch(/kiwipress\/v1/);
    });

    it("reports the site unreachable when the connection fails", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => {
            throw new TypeError("fetch failed");
        }));

        await expect(new Bridge(wordpressConfig).health()).rejects.toMatchObject({
            code: "site_unreachable"
        });
    });

    it("reads and writes settings with application-password auth", async () => {
        const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
            if (init?.method === "POST") {
                return jsonResponse(200, settingsPayload);
            }
            return jsonResponse(200, { ...settingsPayload, paired: false, project_label: "" });
        });
        vi.stubGlobal("fetch", fetchMock);

        const bridge = new Bridge(wordpressConfig);
        const current = await bridge.getSettings();
        const saved = await bridge.saveSettings({
            frontend_url: "https://app.example.com",
            paired: true,
            project_label: "acme"
        });

        expect(current.paired).toBe(false);
        expect(saved).toEqual(settingsPayload);

        const getCall = fetchMock.mock.calls[0] as [string, RequestInit];
        const postCall = fetchMock.mock.calls[1] as [string, RequestInit];
        expect(getCall[0]).toBe("https://cms.example.com/wp-json/kiwipress/v1/settings");
        expect(headerRecord(getCall[1]).Authorization).toMatch(/^Basic /);
        expect(postCall[1].method).toBe("POST");
        expect(JSON.parse(String(postCall[1].body))).toEqual({
            frontend_url: "https://app.example.com",
            paired: true,
            project_label: "acme"
        });
        expect(headerRecord(postCall[1])["Content-Type"]).toBe("application/json");
    });

    it("maps settings 401 and 403 onto credential and role errors", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, {
            code: "incorrect_password",
            message: "The provided password is an invalid application password."
        })));

        await expect(new Bridge(wordpressConfig).getSettings()).rejects.toMatchObject({
            code: "bad_credentials",
            status: 401
        });

        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, {
            code: "rest_forbidden",
            message: "Sorry, you are not allowed to do that."
        })));

        await expect(new Bridge(wordpressConfig).getSettings()).rejects.toMatchObject({
            code: "insufficient_role",
            status: 403
        });
    });

    it("accepts an administrator from users/me?context=edit", async () => {
        const fetchMock = vi.fn(async (url: string) => {
            if (String(url).includes("/kiwipress/v1/health")) {
                return jsonResponse(200, healthPayload);
            }
            return jsonResponse(200, {
                id: 7,
                slug: "ada",
                name: "Ada",
                capabilities: { manage_options: true, read: true }
            });
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(new Bridge(wordpressConfig).verifyCredentials()).resolves.toEqual({
            id: 7,
            slug: "ada",
            name: "Ada"
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const [healthUrl, healthInit] = fetchMock.mock.calls[0] as [string, RequestInit];
        const [userUrl, userInit] = fetchMock.mock.calls[1] as [string, RequestInit];
        expect(healthUrl).toBe("https://cms.example.com/wp-json/kiwipress/v1/health");
        expect(headerRecord(healthInit).Authorization).toBeUndefined();
        expect(userUrl).toBe("https://cms.example.com/wp-json/wp/v2/users/me?context=edit");
        expect(headerRecord(userInit).Authorization).toMatch(/^Basic /);
    });

    it("rejects a signed-in user without manage_options", async () => {
        vi.stubGlobal("fetch", vi.fn(async (url: string) => {
            if (String(url).includes("/kiwipress/v1/health")) {
                return jsonResponse(200, healthPayload);
            }
            return jsonResponse(200, {
                id: 4,
                slug: "guest",
                name: "Guest",
                capabilities: { manage_options: false, read: true }
            });
        }));

        await expect(new Bridge(wordpressConfig).verifyCredentials()).rejects.toMatchObject({
            code: "insufficient_role"
        });
    });

    it("rejects bad credentials on the user check", async () => {
        vi.stubGlobal("fetch", vi.fn(async (url: string) => {
            if (String(url).includes("/kiwipress/v1/health")) {
                return jsonResponse(200, healthPayload);
            }
            return jsonResponse(401, {
                code: "invalid_username",
                message: "Unknown username."
            });
        }));

        await expect(new Bridge(wordpressConfig).verifyCredentials()).rejects.toMatchObject({
            code: "bad_credentials"
        });
    });

    it("reports a missing plugin from verifyCredentials when health is 404", async () => {
        const fetchMock = vi.fn(async () => jsonResponse(404, {
            code: "rest_no_route",
            message: "No route was found matching the URL and request method.",
            data: { status: 404 }
        }));
        vi.stubGlobal("fetch", fetchMock);

        await expect(new Bridge(wordpressConfig).verifyCredentials()).rejects.toMatchObject({
            code: "plugin_missing",
            status: 404
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/kiwipress/v1/health");
    });

    it("rejects an unreachable site on the user check", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => {
            throw new TypeError("fetch failed");
        }));

        await expect(new Bridge(wordpressConfig).verifyCredentials()).rejects.toMatchObject({
            code: "site_unreachable"
        });
    });

    it("does not treat a users/me 404 as a missing bridge plugin", async () => {
        vi.stubGlobal("fetch", vi.fn(async (url: string) => {
            if (String(url).includes("/kiwipress/v1/health")) {
                return jsonResponse(200, healthPayload);
            }
            return jsonResponse(404, {
                code: "rest_no_route",
                message: "No route was found matching the URL and request method."
            });
        }));

        const error = await new Bridge(wordpressConfig).verifyCredentials().then(
            () => null,
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(BridgeError);
        expect((error as BridgeError).code).toBe("request_failed");
    });
});

describe("KiwiPress.bridge", () => {
    it("is the bridge client for a connected site", () => {
        const kiwi = KiwiPress.connect({
            url: "https://cms.example.com",
            username: "admin",
            appPassword: "pw"
        });

        expect(kiwi.bridge).toBeInstanceOf(Bridge);
    });

    it("requires a WordPress URL", () => {
        const kiwi = KiwiPress.connect({ mode: "nectarine" });
        expect(() => kiwi.bridge).toThrow(/WP_URL/);
    });
});
