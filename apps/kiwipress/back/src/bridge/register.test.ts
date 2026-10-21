import http from "node:http";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "@citrusworx/seltzer";
import { decryptApplicationPassword } from "./crypto.js";
import { registerKiwiPressBridge, type BridgeRouteOptions } from "./register.js";
import { BridgeStore } from "./store.js";

const PASSWORD = "kiwi-app-password-not-for-logs";
const USER = "ada";

type Settings = {
    frontend_url: string;
    lockdown: boolean;
    paired: boolean;
    project_label: string;
};

type WpState = {
    pluginVersion: string;
    healthStatus: number;
    userStatus: number;
    manageOptions: boolean;
    failSettings: boolean;
    confirmLie: boolean;
    settings: Settings;
    seenAuth: Array<string | undefined>;
    usersMe: number;
    settingsPosts: unknown[];
};

const servers: http.Server[] = [];

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    server.close((error) => (error ? reject(error) : resolve()));
                })
        )
    );
});

function listen(server: http.Server): Promise<string> {
    servers.push(server);
    return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                reject(new Error("Expected TCP address"));
                return;
            }
            resolve(`http://127.0.0.1:${address.port}`);
        });
    });
}

function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
}

function freshState(): WpState {
    return {
        pluginVersion: "0.1.0",
        healthStatus: 200,
        userStatus: 200,
        manageOptions: true,
        failSettings: false,
        confirmLie: false,
        settings: {
            frontend_url: "",
            lockdown: true,
            paired: false,
            project_label: ""
        },
        seenAuth: [],
        usersMe: 0,
        settingsPosts: []
    };
}

async function startWordPress(state: WpState): Promise<string> {
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        state.seenAuth.push(req.headers.authorization);
        const raw = await readBody(req);

        if (url.pathname === "/frontend") {
            res.writeHead(204);
            res.end();
            return;
        }

        if (url.pathname === "/wp-json/kiwipress/v1/health") {
            if (state.healthStatus !== 200) {
                sendJson(res, state.healthStatus, { code: "rest_no_route", message: "No route was found matching the URL and request method." });
                return;
            }
            sendJson(res, 200, {
                plugin_version: state.pluginVersion,
                wp_version: "6.6",
                lockdown: state.settings.lockdown,
                paired: state.settings.paired,
                frontend_url_set: state.settings.frontend_url !== "",
                site_url: `http://${req.headers.host}`
            });
            return;
        }

        if (url.pathname === "/wp-json/wp/v2/users/me") {
            state.usersMe += 1;
            if (!req.headers.authorization) {
                sendJson(res, 401, { code: "rest_not_logged_in", message: "You are not currently logged in." });
                return;
            }
            if (url.searchParams.get("context") !== "edit") {
                sendJson(res, 400, { message: "missing edit context" });
                return;
            }
            if (state.userStatus !== 200) {
                sendJson(res, state.userStatus, { code: "incorrect_password", message: "The provided password is an invalid application password." });
                return;
            }
            sendJson(res, 200, {
                id: 3,
                slug: USER,
                name: "Ada",
                capabilities: { manage_options: state.manageOptions, read: true }
            });
            return;
        }

        if (url.pathname === "/wp-json/kiwipress/v1/settings") {
            if (state.failSettings) {
                sendJson(res, 500, { message: "settings unavailable" });
                return;
            }
            if (req.method === "POST") {
                const posted = raw ? JSON.parse(raw) as Partial<Settings> : {};
                state.settingsPosts.push(posted);
                state.settings = { ...state.settings, ...posted };
            }
            const body = state.confirmLie ? { ...state.settings, paired: false, project_label: "" } : state.settings;
            sendJson(res, 200, body);
            return;
        }

        sendJson(res, 404, { code: "rest_no_route" });
    });

    return listen(server);
}

async function startDead(): Promise<string> {
    const server = http.createServer((req) => {
        req.socket.destroy();
    });
    return listen(server);
}

async function startApi(options: BridgeRouteOptions = {}) {
    const app = registerKiwiPressBridge(Seltzer.init(), options);
    const server = app.listen(0, { onListening: () => undefined, host: "127.0.0.1" });
    if (!server.listening) {
        await new Promise<void>((resolve, reject) => {
            server.once("listening", () => resolve());
            server.once("error", reject);
        });
    }
    servers.push(server);
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }
    return `http://127.0.0.1:${address.port}`;
}

async function request(url: string, init: RequestInit = {}) {
    const response = await fetch(url, init);
    const json = await response.json() as Record<string, unknown>;
    return { status: response.status, json, text: JSON.stringify(json) };
}

function withKey(extra: BridgeRouteOptions = {}): BridgeRouteOptions {
    const key = randomBytes(32);
    return {
        ...extra,
        resolveKey: () => key
    };
}

function pairBody(siteUrl: string, frontendUrl: string) {
    return {
        siteUrl,
        username: USER,
        applicationPassword: PASSWORD,
        frontendUrl
    };
}

describe("WordPress bridge routes", () => {
    it("probes health without credentials and reports a missing plugin", async () => {
        const state = freshState();
        const site = await startWordPress(state);
        const base = await startApi();

        const found = await request(`${base}/projects/acme/bridge/probe`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ siteUrl: site })
        });

        expect(found.status).toBe(200);
        expect(found.json).toMatchObject({
            pluginPresent: true,
            pluginVersion: "0.1.0",
            lockdown: true,
            paired: false
        });
        expect(state.seenAuth.every((value) => value === undefined)).toBe(true);

        state.healthStatus = 404;
        const missing = await request(`${base}/projects/acme/bridge/probe`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ siteUrl: site })
        });
        expect(missing.status).toBe(200);
        expect(missing.json).toMatchObject({ pluginPresent: false, code: "plugin_missing" });
    });

    it("reports an unreachable site from probe", async () => {
        const dead = await startDead();
        const base = await startApi();
        const res = await request(`${base}/projects/acme/bridge/probe`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ siteUrl: dead })
        });

        expect(res.status).toBe(200);
        expect(res.json).toMatchObject({ pluginPresent: false, code: "site_unreachable" });
    });

    it("refuses to pair when the secret key is missing and stores nothing", async () => {
        const previous = process.env.KIWIPRESS_SECRET_KEY;
        delete process.env.KIWIPRESS_SECRET_KEY;
        try {
            const state = freshState();
            const site = await startWordPress(state);
            const store = BridgeStore.memory();
            const base = await startApi({ store });
            const res = await request(`${base}/projects/acme/bridge/pair`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(pairBody(site, `${site}/frontend`))
            });

            expect(res.status).toBe(503);
            expect(res.json.code).toBe("secret_key_missing");
            expect(state.usersMe).toBe(0);
            expect(state.settingsPosts).toEqual([]);
            expect(await store.get("acme")).toBeNull();
            expect(res.text).not.toContain(PASSWORD);
        } finally {
            if (previous === undefined) delete process.env.KIWIPRESS_SECRET_KEY;
            else process.env.KIWIPRESS_SECRET_KEY = previous;
        }
    });

    it("pairs only after credentials and settings confirm, and never returns the password", async () => {
        const state = freshState();
        const site = await startWordPress(state);
        const key = randomBytes(32);
        const dir = mkdtempSync(path.join(tmpdir(), "kiwi-bridge-pair-"));
        const filePath = path.join(dir, "bridges.json");
        const store = new BridgeStore(filePath);
        const base = await startApi({ store, resolveKey: () => key, now: () => new Date("2026-10-21T12:00:00.000Z") });
        const logs: string[] = [];
        const spy = console.error;
        console.error = (...args: unknown[]) => {
            logs.push(args.map(String).join(" "));
        };

        try {
            const res = await request(`${base}/projects/acme/bridge/pair`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(pairBody(site, `${site}/frontend`))
            });

            expect(res.status).toBe(200);
            expect(res.json).toMatchObject({
                projectId: "acme",
                username: USER,
                frontendUrl: `${site}/frontend`,
                pairedAt: "2026-10-21T12:00:00.000Z",
                settings: {
                    paired: true,
                    project_label: "acme",
                    frontend_url: `${site}/frontend`
                }
            });
            expect(res.json).not.toHaveProperty("applicationPassword");
            expect(res.text).not.toContain(PASSWORD);
            expect(state.usersMe).toBe(1);
            const presented = state.seenAuth.find((value) => value?.startsWith("Basic "));
            const decoded = Buffer.from(String(presented).slice("Basic ".length), "base64").toString("utf8");
            expect(decoded).toBe(`${USER}:${PASSWORD}`);
            expect(state.settings.paired).toBe(true);
            expect(logs.join("\n")).not.toContain(PASSWORD);

            const stored = await store.get("acme");
            expect(stored?.applicationPassword.startsWith("v1.")).toBe(true);
            expect(stored?.applicationPassword).not.toContain(PASSWORD);
            expect(decryptApplicationPassword(stored!.applicationPassword, "acme", key)).toBe(PASSWORD);
            const onDisk = readFileSync(filePath, "utf8");
            expect(onDisk).not.toContain(PASSWORD);
            expect(res.text).not.toContain(stored!.applicationPassword);

            const status = await request(`${base}/projects/acme/bridge/status`);
            expect(status.status).toBe(200);
            expect(status.json.status).toBe("connected");
            expect(status.json.reasons).toEqual([]);
            expect(status.text).not.toContain(PASSWORD);
            expect(status.text).not.toContain(stored!.applicationPassword);
            expect((await store.get("acme"))?.lastHealth?.result.status).toBe("connected");

            const other = await request(`${base}/projects/other/bridge/status`);
            expect(other.json.status).toBe("disconnected");
        } finally {
            console.error = spy;
        }
    });

    it("does not persist when credentials, role, or confirmation fail", async () => {
        const state = freshState();
        state.userStatus = 401;
        const site = await startWordPress(state);
        const store = BridgeStore.memory();
        const base = await startApi(withKey({ store }));

        const bad = await request(`${base}/projects/acme/bridge/pair`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(pairBody(site, `${site}/frontend`))
        });
        expect(bad.status).toBe(401);
        expect(bad.json.code).toBe("bad_credentials");
        expect(await store.get("acme")).toBeNull();
        expect(state.settingsPosts).toEqual([]);

        state.userStatus = 200;
        state.manageOptions = false;
        const role = await request(`${base}/projects/acme/bridge/pair`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(pairBody(site, `${site}/frontend`))
        });
        expect(role.status).toBe(403);
        expect(role.json.code).toBe("insufficient_role");
        expect(await store.get("acme")).toBeNull();

        state.manageOptions = true;
        state.confirmLie = true;
        const confirm = await request(`${base}/projects/acme/bridge/pair`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(pairBody(site, `${site}/frontend`))
        });
        expect(confirm.status).toBe(502);
        expect(confirm.json.code).toBe("confirm_failed");
        expect(await store.get("acme")).toBeNull();
        expect(state.settings.paired).toBe(false);
    });

    it("marks a paired project needs_attention for version, pairing flag, or frontend", async () => {
        const state = freshState();
        const site = await startWordPress(state);
        const dead = await startDead();
        const store = BridgeStore.memory();
        const base = await startApi(withKey({ store }));

        const paired = await request(`${base}/projects/acme/bridge/pair`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(pairBody(site, dead))
        });
        expect(paired.status).toBe(200);

        state.pluginVersion = "0.0.9";
        state.settings.paired = false;
        const status = await request(`${base}/projects/acme/bridge/status`);
        expect(status.json.status).toBe("needs_attention");
        expect(status.json.reasons).toEqual([
            "Plugin version 0.0.9 is older than 0.1.0.",
            "WordPress reports this site is not paired.",
            "The frontend URL is unreachable."
        ]);
        expect((await store.get("acme"))?.lastHealth?.result.status).toBe("needs_attention");
    });

    it("unpairs remotely when it can, and always deletes the local credential", async () => {
        const state = freshState();
        const site = await startWordPress(state);
        const store = BridgeStore.memory();
        const base = await startApi(withKey({ store }));
        await request(`${base}/projects/acme/bridge/pair`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(pairBody(site, `${site}/frontend`))
        });

        const ok = await request(`${base}/projects/acme/bridge/unpair`, { method: "POST" });
        expect(ok.json).toMatchObject({ unpaired: true, remoteUpdated: true, projectId: "acme" });
        expect(ok.text).not.toContain(PASSWORD);
        expect(state.settings.paired).toBe(false);
        expect(await store.get("acme")).toBeNull();

        await request(`${base}/projects/acme/bridge/pair`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(pairBody(site, `${site}/frontend`))
        });
        state.failSettings = true;
        const failed = await request(`${base}/projects/acme/bridge/unpair`, { method: "POST" });
        expect(failed.json).toMatchObject({ unpaired: true, remoteUpdated: false });
        expect(await store.get("acme")).toBeNull();

        const again = await request(`${base}/projects/acme/bridge/status`);
        expect(again.json.status).toBe("disconnected");
    });

    it("requires the same gateway token as the other app routes", async () => {
        const base = await startApi({ token: "secret" });
        const res = await request(`${base}/projects/acme/bridge/status`);
        expect(res.status).toBe(401);

        const allowed = await request(`${base}/projects/acme/bridge/status`, {
            headers: { authorization: "Bearer secret" }
        });
        expect(allowed.status).toBe(200);
        expect(allowed.json.status).toBe("disconnected");
    });

    it("rejects a site URL that is not absolute http(s)", async () => {
        const base = await startApi();
        const res = await request(`${base}/projects/acme/bridge/probe`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ siteUrl: "ftp://cms.example.com" })
        });
        expect(res.status).toBe(400);
        expect(res.json.code).toBe("invalid_input");
    });
});
