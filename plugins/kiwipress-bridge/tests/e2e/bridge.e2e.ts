import http from "node:http";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Bridge } from "@citrusworx/kiwipress";
import { Seltzer } from "@citrusworx/seltzer";
import { decryptApplicationPassword, resolveSecretKey } from "../../../../apps/kiwipress/back/src/bridge/crypto.ts";
import { registerKiwiPressBridge } from "../../../../apps/kiwipress/back/src/bridge/register.ts";
import { urlsMatch } from "../../../../apps/kiwipress/back/src/bridge/status.ts";
import { BridgeStore } from "../../../../apps/kiwipress/back/src/bridge/store.ts";

/**
 * Real WordPress (Docker) plus the real bridge client and back routes.
 * Start it with plugins/kiwipress-bridge/tests/e2e/run.sh — not `vitest` alone.
 * The suite sets KIWIPRESS_SECRET_KEY itself so pairing uses AES-256-GCM.
 */

process.env.KIWIPRESS_SECRET_KEY = randomBytes(32).toString("base64");

const PROJECT_ID = "bridge-e2e";

type ApiResult = {
    status: number;
    body: Record<string, unknown>;
    text: string;
};

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `${name} is not set. Run yarn test:e2e:bridge (plugins/kiwipress-bridge/tests/e2e/run.sh).`
        );
    }
    return value;
}

function wp(args: string[]): Promise<string> {
    const composeFile = requiredEnv("KIWIPRESS_E2E_COMPOSE_FILE");
    const project = requiredEnv("KIWIPRESS_E2E_COMPOSE_PROJECT");
    return new Promise((resolve, reject) => {
        execFile(
            "docker",
            [
                "compose",
                "-f",
                composeFile,
                "-p",
                project,
                "--profile",
                "cli",
                "run",
                "--rm",
                "-T",
                "--no-deps",
                "wpcli",
                ...args
            ],
            { timeout: 120_000, maxBuffer: 4_000_000 },
            (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`wp ${args.join(" ")} failed.\n${stderr}\n${stdout}`));
                    return;
                }
                resolve(stdout);
            }
        );
    });
}

function parseWpJson(output: string): Record<string, unknown> {
    const start = output.indexOf("{");
    const end = output.lastIndexOf("}");
    if (start < 0 || end < start) {
        throw new Error(`wp did not return JSON:\n${output}`);
    }
    const parsed = JSON.parse(output.slice(start, end + 1)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`wp JSON was not an object:\n${output}`);
    }
    return parsed as Record<string, unknown>;
}

class FrontendServer {
    private server: http.Server | null = null;
    private boundPort = 0;
    url = "";

    async start(): Promise<void> {
        if (this.server) {
            return;
        }

        const server = http.createServer((_req, res) => {
            res.writeHead(204);
            res.end();
        });

        await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(this.boundPort, "127.0.0.1", () => resolve());
        });

        const address = server.address();
        if (!address || typeof address === "string") {
            server.close();
            throw new Error("Frontend server did not bind a TCP port.");
        }

        this.server = server;
        this.boundPort = address.port;
        this.url = `http://127.0.0.1:${address.port}/`;
    }

    async stop(): Promise<void> {
        const server = this.server;
        if (!server) {
            return;
        }
        this.server = null;
        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
}

const frontend = new FrontendServer();
const storeDir = mkdtempSync(path.join(tmpdir(), "kiwipress-bridge-e2e-"));
const storePath = path.join(storeDir, "kiwipress-bridges.json");
const store = new BridgeStore(storePath);

let siteUrl = "";
let adminUser = "";
let adminPassword = "";
let subscriberUser = "";
let subscriberPassword = "";
let apiBase = "";
let apiServer: http.Server | null = null;

function adminBridge(): Bridge {
    return new Bridge({
        url: siteUrl,
        username: adminUser,
        appPassword: adminPassword
    });
}

async function api(pathname: string, init: RequestInit = {}): Promise<ApiResult> {
    const response = await fetch(`${apiBase}${pathname}`, init);
    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = null;
        }
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`Bridge route ${pathname} returned HTTP ${response.status}: ${text}`);
    }
    return { status: response.status, body: parsed as Record<string, unknown>, text };
}

function passwordAbsent(value: string): void {
    expect(value).not.toContain(adminPassword);
    expect(value.replace(/\s+/g, "")).not.toContain(adminPassword.replace(/\s+/g, ""));
}

function isFrontendRedirect(status: number, location: string | null): boolean {
    if (!frontend.url || status < 300 || status >= 400 || !location) {
        return false;
    }
    try {
        return urlsMatch(new URL(location, siteUrl).toString(), frontend.url);
    } catch {
        return false;
    }
}

beforeAll(async () => {
    siteUrl = requiredEnv("KIWIPRESS_E2E_SITE_URL").replace(/\/+$/, "");
    adminUser = requiredEnv("KIWIPRESS_E2E_ADMIN_USER");
    adminPassword = requiredEnv("KIWIPRESS_E2E_ADMIN_APP_PASSWORD");
    subscriberUser = requiredEnv("KIWIPRESS_E2E_SUBSCRIBER_USER");
    subscriberPassword = requiredEnv("KIWIPRESS_E2E_SUBSCRIBER_APP_PASSWORD");

    const key = resolveSecretKey();
    if (key.length !== 32) {
        throw new Error("KIWIPRESS_SECRET_KEY did not resolve to 32 bytes.");
    }

    const app = registerKiwiPressBridge(Seltzer.init(), { store });
    apiServer = app.listen(0, { onListening: () => undefined, host: "127.0.0.1" });
    if (!apiServer.listening) {
        await new Promise<void>((resolve, reject) => {
            apiServer?.once("listening", () => resolve());
            apiServer?.once("error", reject);
        });
    }
    const address = apiServer.address();
    if (!address || typeof address === "string") {
        throw new Error("Bridge API did not bind a TCP port.");
    }
    apiBase = `http://127.0.0.1:${address.port}`;
    await frontend.start();
});

afterAll(async () => {
    await frontend.stop();
    if (!apiServer) {
        return;
    }
    const server = apiServer;
    apiServer = null;
    await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
});

describe("KiwiPress bridge against WordPress", () => {
    it("health() without credentials returns plugin 0.1.0, lockdown, and paired false", async () => {
        const bridge = new Bridge({
            url: siteUrl,
            username: adminUser,
            appPassword: "wrong wrong wrong wrong wrong wrong"
        });
        const health = await bridge.health();

        expect(health.plugin_version).toBe("0.1.0");
        expect(health.lockdown).toBe(true);
        expect(health.paired).toBe(false);
        expect(health.frontend_url_set).toBe(false);
        expect(health.site_url.replace(/\/+$/, "")).toBe(siteUrl);
        expect(health.wp_version).toMatch(/^\d+\.\d+/);
    });

    it("verifyCredentials accepts the administrator application password", async () => {
        const user = await adminBridge().verifyCredentials();
        expect(user.id).toBeGreaterThan(0);
        expect(user.slug).toBe(adminUser);
    });

    it("verifyCredentials rejects a wrong application password", async () => {
        const bridge = new Bridge({
            url: siteUrl,
            username: adminUser,
            appPassword: "wrong wrong wrong wrong wrong wrong"
        });
        await expect(bridge.verifyCredentials()).rejects.toMatchObject({ code: "bad_credentials" });
    });

    it("verifyCredentials rejects a non-admin application password", async () => {
        const bridge = new Bridge({
            url: siteUrl,
            username: subscriberUser,
            appPassword: subscriberPassword
        });
        await expect(bridge.verifyCredentials()).rejects.toMatchObject({ code: "insufficient_role" });
    });

    it("verifyCredentials reports plugin_missing when the plugin is deactivated", async () => {
        await wp(["plugin", "deactivate", "kiwipress-bridge"]);
        try {
            await expect(adminBridge().verifyCredentials()).rejects.toMatchObject({ code: "plugin_missing" });
        } finally {
            await wp(["plugin", "activate", "kiwipress-bridge"]);
        }

        const health = await new Bridge({ url: siteUrl }).health();
        expect(health.plugin_version).toBe("0.1.0");
    });

    it("probe reports the real plugin", async () => {
        const probed = await api(`/projects/${PROJECT_ID}/bridge/probe`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ siteUrl })
        });

        expect(probed.status, probed.text).toBe(200);
        expect(probed.body).toMatchObject({
            pluginPresent: true,
            pluginVersion: "0.1.0",
            lockdown: true,
            paired: false
        });
    });

    it("pair writes WordPress settings and stores ciphertext, not the password", async () => {
        const paired = await api(`/projects/${PROJECT_ID}/bridge/pair`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                siteUrl,
                username: adminUser,
                applicationPassword: adminPassword,
                frontendUrl: frontend.url
            })
        });

        expect(paired.status, paired.text).toBe(200);
        passwordAbsent(paired.text);
        expect(paired.body).not.toHaveProperty("applicationPassword");
        expect(paired.body).toMatchObject({
            projectId: PROJECT_ID,
            username: adminUser,
            settings: {
                paired: true,
                project_label: PROJECT_ID
            }
        });
        expect(urlsMatch(String((paired.body.settings as { frontend_url: string }).frontend_url), frontend.url)).toBe(true);

        const settings = await adminBridge().getSettings();
        expect(settings.paired).toBe(true);
        expect(settings.project_label).toBe(PROJECT_ID);
        expect(urlsMatch(settings.frontend_url, frontend.url)).toBe(true);

        const option = parseWpJson(await wp(["option", "get", "kiwipress_bridge", "--format=json"]));
        expect(option.paired).toBe(true);
        expect(urlsMatch(String(option.frontend_url), frontend.url)).toBe(true);

        const raw = readFileSync(storePath, "utf8");
        passwordAbsent(raw);
        const record = JSON.parse(raw) as { projects: Record<string, { applicationPassword: string }> };
        const stored = record.projects[PROJECT_ID]?.applicationPassword ?? "";
        expect(stored.startsWith("v1.")).toBe(true);
        expect(decryptApplicationPassword(stored, PROJECT_ID, resolveSecretKey())).toBe(adminPassword);
    });

    it("status is connected while the plugin is paired and the frontend answers", async () => {
        const status = await api(`/projects/${PROJECT_ID}/bridge/status`);
        expect(status.status, status.text).toBe(200);
        passwordAbsent(status.text);
        expect(status.body).toMatchObject({
            status: "connected",
            reasons: [],
            pluginPresent: true,
            pluginVersion: "0.1.0",
            pluginPaired: true,
            frontendReachable: true
        });
    });

    it("status is needs_attention when the frontend server stops", async () => {
        await frontend.stop();
        const status = await api(`/projects/${PROJECT_ID}/bridge/status`);
        expect(status.status, status.text).toBe(200);
        expect(status.body.status).toBe("needs_attention");
        expect(status.body.frontendReachable).toBe(false);
        expect(String((status.body.reasons as unknown[]).join(" "))).toMatch(/frontend/i);
    });

    it("status is needs_attention when WordPress paired is cleared with wp-cli", async () => {
        await frontend.start();
        const echoed = await wp([
            "eval",
            "$option = get_option('kiwipress_bridge'); $option['paired'] = false; update_option('kiwipress_bridge', $option); echo get_option('kiwipress_bridge')['paired'] ? 'yes' : 'no';"
        ]);
        expect(echoed).toMatch(/no/);

        const status = await api(`/projects/${PROJECT_ID}/bridge/status`);
        expect(status.status, status.text).toBe(200);
        expect(status.body.status).toBe("needs_attention");
        expect(status.body.pluginPaired).toBe(false);
        expect(status.body.frontendReachable).toBe(true);
        expect(String((status.body.reasons as unknown[]).join(" "))).toMatch(/not paired/i);
    });

    it("lockdown redirects anonymous front-end visitors and leaves login, REST, and cron alone", async () => {
        const home = await fetch(`${siteUrl}/`, { redirect: "manual" });
        const homeLocation = home.headers.get("location");
        expect(home.status, homeLocation ?? "").toBe(302);
        expect(homeLocation).toBeTruthy();
        expect(urlsMatch(new URL(homeLocation ?? "", siteUrl).toString(), frontend.url)).toBe(true);

        const login = await fetch(`${siteUrl}/wp-login.php`, { redirect: "manual" });
        const loginHtml = await login.text();
        expect(isFrontendRedirect(login.status, login.headers.get("location")), loginHtml.slice(0, 200)).toBe(false);
        expect(login.status, login.headers.get("location") ?? "").toBe(200);
        expect(loginHtml).toContain("wp-login");
        expect(loginHtml).not.toContain("Headless Mode Activated");

        const admin = await fetch(`${siteUrl}/wp-admin/`, { redirect: "manual" });
        expect(isFrontendRedirect(admin.status, admin.headers.get("location"))).toBe(false);
        if (admin.status >= 300 && admin.status < 400) {
            const redirected = new URL(admin.headers.get("location") ?? "", siteUrl);
            expect(redirected.origin).toBe(new URL(siteUrl).origin);
            expect(redirected.pathname).toContain("wp-login.php");
        }

        const restRoot = await fetch(`${siteUrl}/wp-json`, { redirect: "manual" });
        expect(isFrontendRedirect(restRoot.status, restRoot.headers.get("location"))).toBe(false);

        const restIndex = await fetch(`${siteUrl}/wp-json/`, { redirect: "manual" });
        expect(restIndex.status).toBe(200);
        const index = await restIndex.json() as { namespaces?: string[] };
        expect(index.namespaces).toContain("kiwipress/v1");

        const plain = await fetch(`${siteUrl}/?rest_route=/kiwipress/v1/health`, { redirect: "manual" });
        expect(isFrontendRedirect(plain.status, plain.headers.get("location"))).toBe(false);
        expect(plain.status).toBe(200);
        const plainHealth = await plain.json() as { plugin_version?: string };
        expect(plainHealth.plugin_version).toBe("0.1.0");

        const cron = await fetch(`${siteUrl}/wp-cron.php`, { redirect: "manual" });
        expect(isFrontendRedirect(cron.status, cron.headers.get("location"))).toBe(false);
        expect(cron.status).toBe(200);
    });

    it("unpair clears the WordPress paired flag and deletes the local record", async () => {
        const unpaired = await api(`/projects/${PROJECT_ID}/bridge/unpair`, { method: "POST" });
        expect(unpaired.status, unpaired.text).toBe(200);
        passwordAbsent(unpaired.text);
        expect(unpaired.body).toMatchObject({
            unpaired: true,
            remoteUpdated: true,
            projectId: PROJECT_ID
        });

        const settings = await adminBridge().getSettings();
        expect(settings.paired).toBe(false);

        const option = parseWpJson(await wp(["option", "get", "kiwipress_bridge", "--format=json"]));
        expect(option.paired).toBe(false);

        expect(await store.get(PROJECT_ID)).toBeNull();
        passwordAbsent(readFileSync(storePath, "utf8"));

        const status = await api(`/projects/${PROJECT_ID}/bridge/status`);
        expect(status.status, status.text).toBe(200);
        expect(status.body).toMatchObject({
            status: "disconnected",
            projectId: PROJECT_ID
        });
    });
});
