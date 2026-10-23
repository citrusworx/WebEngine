import http from "node:http";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Bridge, PREVIEW_QUERY_PARAM } from "@citrusworx/kiwipress";
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

    constructor(private readonly wordpressUrl: () => string) {}

    async start(): Promise<void> {
        if (this.server) {
            return;
        }

        const server = http.createServer((req, res) => {
            const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
            if (req.method === "GET" && requestUrl.pathname === "/preview") {
                const token = requestUrl.searchParams.get(PREVIEW_QUERY_PARAM) ?? "";
                const bridge = new Bridge({
                    url: this.wordpressUrl(),
                    username: "not-sent",
                    appPassword: "not-sent-either"
                });
                void bridge.preview(token).then((document) => {
                    const title = renderedText(document.post.title);
                    const body = `<!doctype html><html><head><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1></body></html>`;
                    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                    res.end(body);
                }).catch((error: unknown) => {
                    const message = error instanceof Error ? error.message : "preview failed";
                    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
                    res.end(message);
                });
                return;
            }

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

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function renderedText(value: unknown): string {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return "";
    }
    const field = value as { rendered?: unknown; raw?: unknown };
    if (typeof field.rendered === "string" && field.rendered !== "") {
        return field.rendered.replace(/<[^>]*>/g, "");
    }
    return typeof field.raw === "string" ? field.raw : "";
}

const frontend = new FrontendServer(() => siteUrl);
const storeDir = mkdtempSync(path.join(tmpdir(), "kiwipress-bridge-e2e-"));
const storePath = path.join(storeDir, "kiwipress-bridges.json");
const store = new BridgeStore(storePath);

let siteUrl = "";
let adminUser = "";
let adminPassword = "";
let subscriberUser = "";
let subscriberPassword = "";
let editorUser = "";
let editorPassword = "";
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

function basicAuth(username: string, password: string): string {
    return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

type LoginCookie = {
    header: string;
    nonce: string;
};

async function loginCookie(login: string, previewPostId = 0): Promise<LoginCookie> {
    const safeLogin = login.replace(/[^a-z0-9_-]/gi, "");
    const output = await wp([
        "eval",
        `$user = get_user_by( 'login', '${safeLogin}' ); if ( ! $user ) { echo "NOUSER\\n"; return; } $expiration = time() + 3600; $manager = WP_Session_Tokens::get_instance( $user->ID ); $session = $manager->create( $expiration ); $logged_in = wp_generate_auth_cookie( $user->ID, $expiration, 'logged_in', $session ); $auth = wp_generate_auth_cookie( $user->ID, $expiration, 'auth', $session ); $_COOKIE[ LOGGED_IN_COOKIE ] = $logged_in; wp_set_current_user( $user->ID ); $nonce = ${previewPostId} > 0 ? wp_create_nonce( 'post_preview_${previewPostId}' ) : ''; echo "KPBEGIN\\n" . COOKIEHASH . "\\n" . $logged_in . "\\n" . $auth . "\\n" . $nonce . "\\nKPEND\\n";`
    ]);
    const begin = output.indexOf("KPBEGIN\n");
    const end = output.indexOf("\nKPEND");
    if (begin < 0 || end < begin) {
        throw new Error(`wp did not return a login cookie:\n${output}`);
    }
    const lines = output.slice(begin + "KPBEGIN\n".length, end).split("\n");
    const [hash, loggedIn, auth, nonce = ""] = lines;
    if (!hash || !loggedIn || !auth) {
        throw new Error(`wp cookie payload was incomplete:\n${output}`);
    }
    return {
        header: `wordpress_logged_in_${hash}=${loggedIn}; wordpress_${hash}=${auth}`,
        nonce
    };
}

async function previewSecret(): Promise<string> {
    const output = await wp(["option", "get", "kiwipress_bridge_preview_secret"]);
    const match = output.match(/[a-f0-9]{64}/);
    if (!match) {
        throw new Error(`preview secret was not a 64-character hex string:\n${output}`);
    }
    return match[0];
}

async function createWpPost(args: { type: string; status: string; title: string; content?: string }): Promise<number> {
    const output = await wp([
        "post",
        "create",
        `--post_type=${args.type}`,
        `--post_status=${args.status}`,
        `--post_title=${args.title}`,
        `--post_content=${args.content ?? args.title}`,
        "--porcelain"
    ]);
    const id = Number(output.trim().split(/\s+/).pop());
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`wp post create did not return an id:\n${output}`);
    }
    return id;
}

async function wpRest(pathname: string, init: RequestInit = {}): Promise<{ status: number; body: Record<string, unknown>; headers: Headers }> {
    const response = await fetch(`${siteUrl}${pathname}`, { redirect: "manual", ...init });
    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = null;
        }
    }
    const body = parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : { raw: text };
    return { status: response.status, body, headers: response.headers };
}

function tokenFromPreviewUrl(value: string): string {
    const url = new URL(value, frontend.url);
    const token = url.searchParams.get(PREVIEW_QUERY_PARAM);
    if (!token) {
        throw new Error(`preview URL did not include ${PREVIEW_QUERY_PARAM}: ${value}`);
    }
    return token;
}

async function mintPreview(username: string, password: string, postId: number, source = "auto"): Promise<{ status: number; body: Record<string, unknown> }> {
    return wpRest("/wp-json/kiwipress/v1/preview/token", {
        method: "POST",
        headers: {
            authorization: basicAuth(username, password),
            "content-type": "application/json"
        },
        body: JSON.stringify({ post_id: postId, source })
    });
}

async function readPreview(token: string): Promise<{ status: number; body: Record<string, unknown>; headers: Headers }> {
    return wpRest("/wp-json/kiwipress/v1/preview", {
        headers: { "X-KiwiPress-Preview": token }
    });
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

    editorUser = requiredEnv("KIWIPRESS_E2E_EDITOR_USER");
    editorPassword = requiredEnv("KIWIPRESS_E2E_EDITOR_APP_PASSWORD");

    const app = registerKiwiPressBridge(Seltzer.init(), {
        store,
        contentGateway: () => ({ mode: "wordpress", siteUrl })
    });
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
    it("health() without credentials returns plugin 0.2.0, lockdown, and paired false", async () => {
        const bridge = new Bridge({
            url: siteUrl,
            username: adminUser,
            appPassword: "wrong wrong wrong wrong wrong wrong"
        });
        const health = await bridge.health();

        expect(health.plugin_version).toBe("0.2.0");
        expect(health.features).toContain("preview");
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
        expect(health.plugin_version).toBe("0.2.0");
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
            pluginVersion: "0.2.0",
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
            pluginVersion: "0.2.0",
            pluginPaired: true,
            frontendReachable: true,
            previewReady: true,
            previewPath: "/preview",
            previewReason: null
        });
    });

    it("health, settings, and wp-admin never expose the preview secret", async () => {
        const secret = await previewSecret();
        expect(secret).toMatch(/^[a-f0-9]{64}$/);

        const health = await wpRest("/wp-json/kiwipress/v1/health");
        expect(health.status).toBe(200);
        expect(JSON.stringify(health.body)).not.toContain(secret);
        expect(health.body).not.toHaveProperty("preview_secret");

        const settings = await wpRest("/wp-json/kiwipress/v1/settings", {
            headers: { authorization: basicAuth(adminUser, adminPassword) }
        });
        expect(settings.status).toBe(200);
        expect(settings.body.preview_path).toBe("/preview");
        expect(JSON.stringify(settings.body)).not.toContain(secret);

        const session = await loginCookie(adminUser);
        const admin = await fetch(`${siteUrl}/wp-admin/admin.php?page=kiwipress-bridge`, {
            headers: { cookie: session.header },
            redirect: "manual"
        });
        const html = await admin.text();
        expect(admin.status, html.slice(0, 300)).toBe(200);
        expect(html).toContain("Preview path");
        expect(html).toContain("Revoke preview links");
        expect(html).toContain("preview");
        expect(html).not.toContain(secret);
    });

    it("sends a logged-in Gutenberg draft preview to the frontend and keeps the draft private", async () => {
        const title = "KiwiDraftPreviewTitle";
        const postId = await createWpPost({ type: "post", status: "draft", title });
        const session = await loginCookie(editorUser);
        const preview = await fetch(`${siteUrl}/?p=${postId}&preview=true`, {
            headers: { cookie: session.header },
            redirect: "manual"
        });
        const location = preview.headers.get("location");
        expect(preview.status, location ?? "").toBe(302);
        expect(location).toContain("/preview");
        expect(location).toContain(`${PREVIEW_QUERY_PARAM}=`);
        expect(preview.headers.get("referrer-policy")).toBe("no-referrer");
        expect(preview.headers.get("cache-control") ?? "").toMatch(/no-store|no-cache/);

        const token = tokenFromPreviewUrl(location ?? "");
        const page = await fetch(location ?? "", { redirect: "manual" });
        const html = await page.text();
        expect(page.status, html.slice(0, 300)).toBe(200);
        expect(html).toContain(title);

        const anonymousPost = await wpRest(`/wp-json/wp/v2/posts/${postId}`);
        expect(anonymousPost.status).toBe(401);

        const anonymousPreview = await fetch(`${siteUrl}/?p=${postId}&preview=true`, { redirect: "manual" });
        const loginLocation = anonymousPreview.headers.get("location") ?? "";
        expect(anonymousPreview.status).toBe(302);
        expect(loginLocation).toContain("wp-login.php");
        expect(loginLocation).not.toContain(PREVIEW_QUERY_PARAM);

        const document = await readPreview(token);
        expect(document.status).toBe(200);
        expect(document.headers.get("cache-control")).toContain("no-store");
        expect(document.headers.get("x-robots-tag")).toBe("noindex");
        expect(document.body).toMatchObject({ preview: true, source: "post", post_id: postId, post_type: "post" });
        expect(renderedText((document.body.post as { title?: unknown }).title)).toContain(title);
    });

    it("previews an autosave of a published post without changing the public post", async () => {
        const publishedTitle = "KiwiPublishedTitle";
        const autosaveTitle = "KiwiAutosaveTitle";
        const postId = await createWpPost({ type: "post", status: "publish", title: publishedTitle, content: "published body" });
        const saved = await wpRest(`/wp-json/wp/v2/posts/${postId}/autosaves`, {
            method: "POST",
            headers: {
                authorization: basicAuth(editorUser, editorPassword),
                "content-type": "application/json"
            },
            body: JSON.stringify({ title: autosaveTitle, content: "autosave body" })
        });
        expect(saved.status, JSON.stringify(saved.body)).toBeGreaterThanOrEqual(200);
        expect(saved.status).toBeLessThan(300);

        const minted = await mintPreview(editorUser, editorPassword, postId, "autosave");
        expect(minted.status, JSON.stringify(minted.body)).toBe(200);
        const token = String(minted.body.token);
        const document = await readPreview(token);
        expect(document.status, JSON.stringify(document.body)).toBe(200);
        expect(document.body.source).toBe("autosave");
        expect(renderedText((document.body.post as { title?: unknown }).title)).toContain(autosaveTitle);

        const session = await loginCookie(editorUser, postId);
        expect(session.nonce).not.toBe("");
        const handoff = await fetch(`${siteUrl}/?preview_id=${postId}&preview_nonce=${session.nonce}&preview=true`, {
            headers: { cookie: session.header },
            redirect: "manual"
        });
        const location = handoff.headers.get("location") ?? "";
        expect(handoff.status, location).toBe(302);
        const handoffToken = tokenFromPreviewUrl(location);
        const handoffDoc = await readPreview(handoffToken);
        expect(handoffDoc.body.source).toBe("autosave");
        expect(renderedText((handoffDoc.body.post as { title?: unknown }).title)).toContain(autosaveTitle);

        const pub = await wpRest(`/wp-json/wp/v2/posts/${postId}`);
        expect(pub.status).toBe(200);
        expect(pub.body.status).toBe("publish");
        expect(renderedText((pub.body as { title?: unknown }).title)).toContain(publishedTitle);
        expect(renderedText((pub.body as { title?: unknown }).title)).not.toContain(autosaveTitle);
    });

    it("previews pages and a REST custom post type", async () => {
        const pageTitle = "KiwiPagePreviewTitle";
        const pageId = await createWpPost({ type: "page", status: "draft", title: pageTitle });
        const pageLink = await mintPreview(editorUser, editorPassword, pageId, "post");
        expect(pageLink.status, JSON.stringify(pageLink.body)).toBe(200);
        const pageDoc = await readPreview(String(pageLink.body.token));
        expect(pageDoc.status, JSON.stringify(pageDoc.body)).toBe(200);
        expect(pageDoc.body.post_type).toBe("page");
        expect(renderedText((pageDoc.body.post as { title?: unknown }).title)).toContain(pageTitle);

        const fruitTitle = "KiwiFruitPreviewTitle";
        const fruitId = await createWpPost({ type: "kiwi_fruit", status: "draft", title: fruitTitle });
        const listed = await wpRest("/wp-json/wp/v2/kiwi-fruit", {
            headers: { authorization: basicAuth(editorUser, editorPassword) }
        });
        expect(listed.status, JSON.stringify(listed.body)).toBe(200);
        const fruitLink = await mintPreview(editorUser, editorPassword, fruitId, "post");
        expect(fruitLink.status, JSON.stringify(fruitLink.body)).toBe(200);
        const fruitDoc = await readPreview(String(fruitLink.body.token));
        expect(fruitDoc.status, JSON.stringify(fruitDoc.body)).toBe(200);
        expect(fruitDoc.body.post_type).toBe("kiwi_fruit");
        expect(renderedText((fruitDoc.body.post as { title?: unknown }).title)).toContain(fruitTitle);
    });

    it("rejects a tampered token and an expired token", async () => {
        const postId = await createWpPost({ type: "post", status: "draft", title: "KiwiTamperTitle" });
        const minted = await mintPreview(editorUser, editorPassword, postId, "post");
        expect(minted.status).toBe(200);
        const token = String(minted.body.token);
        const parts = token.split(".");
        const signature = parts[2] ?? "";
        const flipped = signature.slice(0, -1) + (signature.endsWith("a") ? "b" : "a");
        const tampered = await readPreview(`${parts[0]}.${parts[1]}.${flipped}`);
        expect(tampered.status).toBe(401);
        expect(tampered.body.code).toBe("kiwipress_bridge_preview_invalid");

        await wp(["option", "update", "kiwipress_e2e_preview_ttl", "-120"]);
        try {
            const expiredMint = await mintPreview(editorUser, editorPassword, postId, "post");
            expect(expiredMint.status, JSON.stringify(expiredMint.body)).toBe(200);
            const expired = await readPreview(String(expiredMint.body.token));
            expect(expired.status).toBe(401);
            expect(expired.body.code).toBe("kiwipress_bridge_preview_expired");
            await expect(new Bridge({
                url: siteUrl,
                username: adminUser,
                appPassword: adminPassword
            }).preview(String(expiredMint.body.token))).rejects.toMatchObject({ code: "preview_expired" });
        } finally {
            await wp(["option", "delete", "kiwipress_e2e_preview_ttl"]);
        }
    });

    it("forbids a demoted editor and returns 404 for a trashed post", async () => {
        const postId = await createWpPost({ type: "post", status: "draft", title: "KiwiDemoteTitle" });
        const minted = await mintPreview(editorUser, editorPassword, postId, "post");
        expect(minted.status).toBe(200);
        const token = String(minted.body.token);

        await wp(["user", "set-role", editorUser, "subscriber"]);
        try {
            const forbidden = await readPreview(token);
            expect(forbidden.status).toBe(403);
            expect(forbidden.body.code).toBe("kiwipress_bridge_preview_forbidden");
        } finally {
            await wp(["user", "set-role", editorUser, "editor"]);
        }

        const restored = await readPreview(token);
        expect(restored.status, JSON.stringify(restored.body)).toBe(200);

        const trashId = await createWpPost({ type: "post", status: "draft", title: "KiwiTrashTitle" });
        const trashMint = await mintPreview(editorUser, editorPassword, trashId, "post");
        expect(trashMint.status).toBe(200);
        await wp(["post", "update", String(trashId), "--post_status=trash"]);
        const missing = await readPreview(String(trashMint.body.token));
        expect(missing.status).toBe(404);
        expect(missing.body.code).toBe("kiwipress_bridge_preview_not_found");
    });

    it("revokes preview links from wp-admin and rotates the secret", async () => {
        const postId = await createWpPost({ type: "post", status: "draft", title: "KiwiRevokeTitle" });
        const before = await mintPreview(adminUser, adminPassword, postId, "post");
        expect(before.status, JSON.stringify(before.body)).toBe(200);
        const secretBefore = await previewSecret();
        const session = await loginCookie(adminUser);
        const admin = await fetch(`${siteUrl}/wp-admin/admin.php?page=kiwipress-bridge`, {
            headers: { cookie: session.header },
            redirect: "manual"
        });
        const html = await admin.text();
        expect(admin.status, html.slice(0, 400)).toBe(200);
        const nonce = html.match(/name="kiwipress_bridge_revoke_nonce" value="([^"]+)"/)?.[1];
        expect(nonce).toBeTruthy();

        const revoked = await fetch(`${siteUrl}/wp-admin/admin-post.php`, {
            method: "POST",
            headers: {
                cookie: session.header,
                "content-type": "application/x-www-form-urlencoded",
                referer: `${siteUrl}/wp-admin/admin.php?page=kiwipress-bridge`
            },
            body: new URLSearchParams({
                action: "kiwipress_bridge_revoke_preview",
                kiwipress_bridge_revoke_nonce: nonce ?? ""
            }),
            redirect: "manual"
        });
        const location = revoked.headers.get("location") ?? "";
        expect(revoked.status, location).toBeGreaterThanOrEqual(300);
        expect(revoked.status).toBeLessThan(400);
        expect(location).toContain("preview-revoked=1");

        const secretAfter = await previewSecret();
        expect(secretAfter).not.toBe(secretBefore);
        const old = await readPreview(String(before.body.token));
        expect(old.status).toBe(401);
        expect(old.body.code).toBe("kiwipress_bridge_preview_invalid");

        const again = await mintPreview(adminUser, adminPassword, postId, "post");
        expect(again.status).toBe(200);
        const fresh = await readPreview(String(again.body.token));
        expect(fresh.status).toBe(200);
        const settings = await adminBridge().getSettings();
        expect(settings.paired).toBe(true);
    });

    it("mints a back preview link with and without a draft autosave", async () => {
        const publishedTitle = "KiwiBackPublishedTitle";
        const autosaveTitle = "KiwiBackAutosaveTitle";
        const postId = await createWpPost({
            type: "post",
            status: "publish",
            title: publishedTitle,
            content: "back published body"
        });

        const plain = await api(`/projects/${PROJECT_ID}/bridge/preview`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ postId, postType: "post", draft: false })
        });
        expect(plain.status, plain.text).toBe(200);
        passwordAbsent(plain.text);
        const plainToken = tokenFromPreviewUrl(String(plain.body.url));
        const plainDoc = await api(`/projects/${PROJECT_ID}/bridge/preview/content?token=${encodeURIComponent(plainToken)}`);
        expect(plainDoc.status, plainDoc.text).toBe(200);
        passwordAbsent(plainDoc.text);
        expect(plainDoc.body.source).toBe("post");
        expect(renderedText((plainDoc.body.post as { title?: unknown }).title)).toContain(publishedTitle);

        const drafted = await api(`/projects/${PROJECT_ID}/bridge/preview`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                postId,
                postType: "post",
                draft: true,
                title: autosaveTitle,
                content: "back autosave body"
            })
        });
        expect(drafted.status, drafted.text).toBe(200);
        passwordAbsent(drafted.text);
        const draftToken = tokenFromPreviewUrl(String(drafted.body.url));
        const draftDoc = await api(`/projects/${PROJECT_ID}/bridge/preview/content?token=${encodeURIComponent(draftToken)}`);
        expect(draftDoc.status, draftDoc.text).toBe(200);
        expect(draftDoc.body.source).toBe("autosave");
        expect(renderedText((draftDoc.body.post as { title?: unknown }).title)).toContain(autosaveTitle);

        const pub = await wpRest(`/wp-json/wp/v2/posts/${postId}`);
        expect(pub.status).toBe(200);
        expect(pub.body.status).toBe("publish");
        expect(renderedText((pub.body as { title?: unknown }).title)).toContain(publishedTitle);
        expect(renderedText((pub.body as { title?: unknown }).title)).not.toContain(autosaveTitle);
    });

    it("refuses a preview token for a subscriber", async () => {
        const postId = await createWpPost({ type: "post", status: "draft", title: "KiwiSubscriberTitle" });
        const minted = await mintPreview(subscriberUser, subscriberPassword, postId, "post");
        expect(minted.status).toBe(403);
    });

    it("regenerates a preview secret that was deleted", async () => {
        const postId = await createWpPost({ type: "post", status: "draft", title: "KiwiMigrateTitle" });
        const beforeMint = await mintPreview(editorUser, editorPassword, postId, "post");
        expect(beforeMint.status).toBe(200);
        const before = await previewSecret();
        await wp(["option", "delete", "kiwipress_bridge_preview_secret"]);
        const afterMint = await mintPreview(editorUser, editorPassword, postId, "post");
        expect(afterMint.status, JSON.stringify(afterMint.body)).toBe(200);
        const after = await previewSecret();
        expect(after).toMatch(/^[a-f0-9]{64}$/);
        expect(after).not.toBe(before);
        const stale = await readPreview(String(beforeMint.body.token));
        expect(stale.status).toBe(401);
        const fresh = await readPreview(String(afterMint.body.token));
        expect(fresh.status, JSON.stringify(fresh.body)).toBe(200);
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
        expect(plainHealth.plugin_version).toBe("0.2.0");

        const cron = await fetch(`${siteUrl}/wp-cron.php`, { redirect: "manual" });
        expect(isFrontendRedirect(cron.status, cron.headers.get("location"))).toBe(false);
        expect(cron.status).toBe(200);
    });

    it("unpair clears the WordPress paired flag, rotates the preview secret, and deletes the local record", async () => {
        const postId = await createWpPost({ type: "post", status: "draft", title: "KiwiUnpairTitle" });
        await wp([
            "eval",
            "$option = get_option('kiwipress_bridge'); $option['paired'] = true; update_option('kiwipress_bridge', $option); echo get_option('kiwipress_bridge')['paired'] ? 'yes' : 'no';"
        ]);
        const secretBefore = await previewSecret();
        const minted = await mintPreview(editorUser, editorPassword, postId, "post");
        expect(minted.status, JSON.stringify(minted.body)).toBe(200);

        const unpaired = await api(`/projects/${PROJECT_ID}/bridge/unpair`, { method: "POST" });
        expect(unpaired.status, unpaired.text).toBe(200);
        passwordAbsent(unpaired.text);
        expect(unpaired.body).toMatchObject({
            unpaired: true,
            remoteUpdated: true,
            projectId: PROJECT_ID
        });

        const secretAfter = await previewSecret();
        expect(secretAfter).not.toBe(secretBefore);
        const stale = await readPreview(String(minted.body.token));
        expect(stale.status).toBe(401);
        expect(stale.body.code).toBe("kiwipress_bridge_preview_invalid");

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

    it("keeps the WordPress theme preview when the site is not paired", async () => {
        const title = "KiwiThemePreviewTitle";
        const postId = await createWpPost({ type: "post", status: "draft", title, content: title });
        const session = await loginCookie(editorUser);
        const preview = await fetch(`${siteUrl}/?p=${postId}&preview=true`, {
            headers: { cookie: session.header },
            redirect: "manual"
        });
        const location = preview.headers.get("location") ?? "";
        expect(location).not.toContain(PREVIEW_QUERY_PARAM);
        if (preview.status >= 300 && preview.status < 400) {
            const redirected = new URL(location, siteUrl);
            expect(redirected.origin).toBe(new URL(siteUrl).origin);
            const followed = await fetch(redirected, {
                headers: { cookie: session.header },
                redirect: "manual"
            });
            const html = await followed.text();
            expect(html).toContain(title);
            expect(html).not.toContain(PREVIEW_QUERY_PARAM);
            return;
        }
        const html = await preview.text();
        expect(preview.status, html.slice(0, 300)).toBe(200);
        expect(html).toContain(title);
        expect(html).not.toContain(PREVIEW_QUERY_PARAM);
    });
});
