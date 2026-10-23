import { afterEach, describe, expect, it, vi } from "vitest";
import { KiwiPress } from "../cms/KiwiPress.js";
import { Bridge } from "./bridge.js";
import { BridgeError } from "./errors.js";
import { decodePreviewTokenUnverified, PREVIEW_HEADER, PREVIEW_QUERY_PARAM, previewTokenFromUrl } from "./preview.js";

const wordpressConfig = {
    url: "https://cms.example.com/",
    username: "admin",
    appPassword: "aaaa bbbb cccc dddd"
};

const healthPayload = {
    plugin_version: "0.2.0",
    wp_version: "6.6",
    lockdown: true,
    paired: false,
    frontend_url_set: false,
    site_url: "https://cms.example.com",
    features: ["preview"]
};

const settingsPayload = {
    frontend_url: "https://app.example.com",
    lockdown: true,
    paired: true,
    project_label: "acme",
    preview_path: "/preview"
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

    it("reads a preview without sending application-password credentials", async () => {
        const previousUser = process.env.WP_USER;
        const previousPassword = process.env.WP_APP_PASSWORD;
        process.env.WP_USER = "env-user";
        process.env.WP_APP_PASSWORD = "env-password-value";
        const token = "kp1.payload.sig";
        const fetchMock = vi.fn(async () => jsonResponse(200, {
            preview: true,
            source: "post",
            post_id: 4,
            post_type: "post",
            expires_at: "2026-10-23T05:10:00+00:00",
            post: { title: { rendered: "Draft title" } }
        }));
        vi.stubGlobal("fetch", fetchMock);

        try {
            const bridge = new Bridge({ url: "https://cms.example.com" });
            const document = await bridge.preview(token);
            expect(document.post.title?.rendered).toBe("Draft title");
            const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
            expect(url).toBe("https://cms.example.com/wp-json/kiwipress/v1/preview");
            expect(headerRecord(init).Authorization).toBeUndefined();
            expect(headerRecord(init)[PREVIEW_HEADER]).toBe(token);
        } finally {
            if (previousUser === undefined) delete process.env.WP_USER;
            else process.env.WP_USER = previousUser;
            if (previousPassword === undefined) delete process.env.WP_APP_PASSWORD;
            else process.env.WP_APP_PASSWORD = previousPassword;
        }
    });

    it("maps an expired preview token by its WordPress code, not as bad credentials", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, {
            code: "kiwipress_bridge_preview_expired",
            message: "Preview token has expired.",
            data: { status: 401 }
        })));

        await expect(new Bridge(wordpressConfig).preview("kp1.a.b")).rejects.toMatchObject({
            code: "preview_expired",
            status: 401
        });
    });

    it("creates a preview link with application-password auth", async () => {
        const fetchMock = vi.fn(async () => jsonResponse(200, {
            token: "kp1.a.b",
            url: "https://app.example.com/preview?kiwipress_preview=kp1.a.b",
            expires_at: "2026-10-23T05:10:00+00:00"
        }));
        vi.stubGlobal("fetch", fetchMock);

        const link = await new Bridge(wordpressConfig).createPreviewLink({ postId: 8, source: "auto" });
        expect(link.token).toBe("kp1.a.b");
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("https://cms.example.com/wp-json/kiwipress/v1/preview/token");
        expect(headerRecord(init).Authorization).toMatch(/^Basic /);
        expect(JSON.parse(String(init.body))).toEqual({ post_id: 8, source: "auto" });
    });

    it("treats a 0.1.0 health payload with no features field as an empty list", async () => {
        const legacy = { ...healthPayload, plugin_version: "0.1.0" };
        delete (legacy as { features?: string[] }).features;
        vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(200, legacy)));

        const health = await new Bridge(wordpressConfig).health();
        expect(health.features).toEqual([]);
        expect(health.plugin_version).toBe("0.1.0");
    });
});

describe("preview token helpers", () => {
    it("decodes a kp1 payload without trusting the signature", () => {
        const claims = {
            v: 1,
            iss: "https://cms.example.com",
            pid: 5,
            pt: "post",
            src: "autosave" as const,
            uid: 2,
            iat: 10,
            exp: 20,
            jti: "abc"
        };
        const token = `kp1.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.not-a-signature`;
        expect(decodePreviewTokenUnverified(token)).toEqual(claims);
        expect(decodePreviewTokenUnverified("kp1.only")).toBeNull();
        expect(previewTokenFromUrl(`https://app.example.com/preview?${PREVIEW_QUERY_PARAM}=${encodeURIComponent(token)}`)).toBe(token);
        expect(previewTokenFromUrl("https://app.example.com/preview")).toBeNull();
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
