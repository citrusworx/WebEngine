import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "@citrusworx/seltzer";
import type { ApplyResult } from "@citrusworx/grapevine";
import { ProvisionJobStore } from "./jobs.js";
import { registerKiwiPressProvision } from "./register.js";

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

async function listen(app: Seltzer): Promise<string> {
    const server = app.listen(0, { onListening: () => undefined });
    servers.push(server);

    if (!server.listening) {
        await new Promise<void>((resolve, reject) => {
            server.once("listening", () => resolve());
            server.once("error", reject);
        });
    }

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Expected TCP address");
    }

    return `http://127.0.0.1:${address.port}`;
}

async function request(
    url: string,
    init: RequestInit = {}
): Promise<{ status: number; json: unknown }> {
    const res = await fetch(url, init);
    return { status: res.status, json: await res.json() };
}

function mockApplyResult(): ApplyResult {
    return {
        tags: ["kiwipress"],
        ssh_keys: [],
        vpcs: [],
        databases: [{ id: "db-1", name: "kiwipress-pg", engine: "pg", status: "online", host: "db.internal" }],
        droplets: [
            {
                id: 42,
                name: "kiwipress-01",
                memory: 2048,
                status: "active",
                image: {},
                size: {},
                networks: { v4: [{ ip_address: "203.0.113.10", type: "public" }] }
            }
        ],
        firewalls: [],
        domains: [{ name: "press.test", records: 0 }],
        load_balancers: [],
        alert_policies: [],
        apps: [],
        stacks: [
            {
                name: "kiwipress-compose",
                droplet: "kiwipress-01",
                workdir: "/opt/kiwipress",
                files: [],
                steps: ["install-docker", "compose-up"],
                user_data_generated: true
            }
        ],
        private_key_paths: [],
        warnings: []
    };
}

async function waitForJob(
    base: string,
    id: string,
    headers?: HeadersInit
): Promise<Record<string, unknown>> {
    for (let attempt = 0; attempt < 40; attempt += 1) {
        const res = await request(`${base}/provision/${id}`, { headers });
        const body = res.json as { status?: string };
        if (body.status === "succeeded" || body.status === "failed") {
            return res.json as Record<string, unknown>;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error("timed out waiting for provision job");
}

describe("registerKiwiPressProvision", () => {
    it("plans from a wizard snapshot without a DigitalOcean token", async () => {
        const app = registerKiwiPressProvision(Seltzer.init(), {
            hasDoToken: () => false
        });
        const base = await listen(app);
        const res = await request(`${base}/provision/plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                databaseType: "dedicated",
                dropletSize: "growth",
                region: "lon1",
                blueprintId: "blog",
                backupFrequency: "daily"
            })
        });

        expect(res.status).toBe(200);
        expect(res.json).toMatchObject({
            packId: "kiwipress-managed",
            region: "lon1",
            doSize: "s-2vcpu-4gb"
        });
        const body = res.json as { steps: Array<{ id: string }>; plan: { counts: { databases: number } } };
        expect(body.plan.counts.databases).toBe(2);
        expect(body.steps.map((step) => step.id)).toContain("droplet");
        expect(JSON.stringify(res.json)).not.toMatch(/dop_v1_|REPLACE_ME/);
    });

    it("fails apply closed when the server has no DO token", async () => {
        const app = registerKiwiPressProvision(Seltzer.init(), {
            hasDoToken: () => false
        });
        const base = await listen(app);
        const res = await request(`${base}/provision/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ databaseType: "shared", dropletSize: "starter" })
        });

        expect(res.status).toBe(503);
        expect(res.json).toMatchObject({
            error: expect.stringContaining("DO_TOKEN"),
            env: "DO_TOKEN"
        });
    });

    it("applies asynchronously and reports droplet IP without secrets", async () => {
        const jobs = new ProvisionJobStore();
        const app = registerKiwiPressProvision(Seltzer.init(), {
            jobs,
            hasDoToken: () => true,
            grapevine: {
                applyGrapeConfig: async () => mockApplyResult()
            }
        });
        const base = await listen(app);
        const started = await request(`${base}/provision/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                databaseType: "shared",
                dropletSize: "starter",
                domainName: "press.test",
                backupFrequency: "daily"
            })
        });

        expect(started.status).toBe(202);
        const created = started.json as { id: string; status: string };
        expect(created.status).toBe("running");

        const finished = await waitForJob(base, created.id);
        expect(finished.status).toBe("succeeded");
        expect(finished.result).toMatchObject({
            packId: "kiwipress-compose",
            domain: "press.test",
            droplets: [{ id: 42, ip: "203.0.113.10" }],
            databases: [{ id: "db-1", host: "db.internal", status: "online" }]
        });
        expect(JSON.stringify(finished)).not.toMatch(/dop_v1_|hunter2|password/i);
    });

    it("uses the same gateway token as the CMS routes", async () => {
        const app = registerKiwiPressProvision(Seltzer.init(), {
            token: "gateway-secret",
            hasDoToken: () => false
        });
        const base = await listen(app);
        const denied = await request(`${base}/provision/plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}"
        });
        expect(denied.status).toBe(401);

        const allowed = await request(`${base}/provision/plan`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer gateway-secret"
            },
            body: JSON.stringify({ databaseType: "shared" })
        });
        expect(allowed.status).toBe(200);
    });

    it("returns 404 for an unknown job id", async () => {
        const app = registerKiwiPressProvision(Seltzer.init());
        const base = await listen(app);
        const res = await request(`${base}/provision/missing-job`);
        expect(res.status).toBe(404);
    });
});
