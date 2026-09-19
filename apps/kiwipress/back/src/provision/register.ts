import {
    applyGrapeConfig,
    loadGrapeConfig,
    type ApplyResult,
    type GrapeConfig,
    type GrapePlan,
    type GrapeRunOptions
} from "@citrusworx/grapevine";
import { authorizeKiwiPressGateway, type KiwiPressGatewayOptions } from "@citrusworx/kiwipress";
import type { RequestContext, ResponseData, Seltzer } from "@citrusworx/seltzer";
import { ProvisionJobStore } from "./jobs.js";
import {
    buildPlanSteps,
    mapDropletSize,
    patchGrapeConfig,
    publicPlan,
    selectBlueprintPack
} from "./map.js";
import { resolveBlueprintConfigPath, resolveBlueprintPackDir } from "./paths.js";
import { redactText, sanitizeForClient } from "./sanitize.js";
import { summarizeApplyResult } from "./summary.js";
import type { PlanResponse, ProvisionJob, TimelineStepId, WizardSnapshot } from "./types.js";

export type GrapevineFns = {
    loadGrapeConfig: (source: string) => Promise<GrapeConfig>;
    applyGrapeConfig: (config: GrapeConfig, options?: GrapeRunOptions) => Promise<ApplyResult>;
};

export type ProvisionOptions = KiwiPressGatewayOptions & {
    grapevine?: Partial<GrapevineFns>;
    jobs?: ProvisionJobStore;
    hasDoToken?: (envName: string) => boolean;
};

const MISSING_TOKEN_ERROR =
    "DigitalOcean token is not configured. Set DO_TOKEN (or the blueprint credentials.env name) on the KiwiPress API server. Apply does not run without it.";

export function tokenEnvName(config: GrapeConfig): string {
    return config.credentials?.env?.trim() || "DO_TOKEN";
}

export function envHasToken(envName: string): boolean {
    return Boolean(process.env[envName]?.trim());
}

function json(status: number, body: unknown): ResponseData {
    return { status, body: sanitizeForClient(body) };
}

function readSnapshot(body: unknown): WizardSnapshot {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return {};
    }
    return body as WizardSnapshot;
}

function asErrorMessage(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message : fallback;
    return redactText(message);
}

async function prepareConfig(
    snapshot: WizardSnapshot,
    grapevine: GrapevineFns
): Promise<{
    packId: ReturnType<typeof selectBlueprintPack>;
    packDir: string;
    config: GrapeConfig;
    plan: GrapePlan;
    steps: PlanResponse["steps"];
    warnings: string[];
    doSize: string;
}> {
    const packId = selectBlueprintPack(snapshot);
    const packDir = resolveBlueprintPackDir(packId);
    const source = resolveBlueprintConfigPath(packId);
    const loaded = await grapevine.loadGrapeConfig(source);
    const patched = patchGrapeConfig(loaded, snapshot);
    const planned = buildPlanSteps(patched.config, snapshot, packDir, patched.warnings);

    return {
        packId,
        packDir,
        config: patched.config,
        plan: planned.plan,
        steps: planned.steps,
        warnings: planned.warnings,
        doSize: mapDropletSize(snapshot.dropletSize)
    };
}

function firstRunningStep(job: ProvisionJob): TimelineStepId {
    return job.steps[0]?.id ?? "droplet";
}

export function registerKiwiPressProvision(app: Seltzer, options: ProvisionOptions = {}): Seltzer {
    const jobs = options.jobs ?? new ProvisionJobStore();
    const grapevine: GrapevineFns = {
        loadGrapeConfig: options.grapevine?.loadGrapeConfig ?? loadGrapeConfig,
        applyGrapeConfig: options.grapevine?.applyGrapeConfig ?? applyGrapeConfig
    };
    const hasDoToken = options.hasDoToken ?? envHasToken;

    const guard = (handler: (ctx: RequestContext) => Promise<ResponseData> | ResponseData) => {
        return (ctx: RequestContext): Promise<ResponseData> | ResponseData => {
            if (!authorizeKiwiPressGateway(ctx.req, options)) {
                return json(401, { error: "Unauthorized" });
            }
            return handler(ctx);
        };
    };

    app.route({
        method: "POST",
        path: "/provision/plan",
        handler: guard(async (ctx) => {
            try {
                const snapshot = readSnapshot(ctx.body);
                const prepared = await prepareConfig(snapshot, grapevine);
                const body: PlanResponse = {
                    packId: prepared.packId,
                    region: snapshot.region?.trim() || prepared.plan.region,
                    dropletSize: snapshot.dropletSize,
                    doSize: prepared.doSize,
                    steps: prepared.steps,
                    plan: publicPlan(prepared.plan),
                    warnings: prepared.warnings
                };
                return json(200, body);
            } catch (error) {
                return json(500, { error: asErrorMessage(error, "Failed to plan KiwiPress provision.") });
            }
        })
    });

    app.route({
        method: "POST",
        path: "/provision/apply",
        handler: guard(async (ctx) => {
            try {
                const snapshot = readSnapshot(ctx.body);
                const prepared = await prepareConfig(snapshot, grapevine);
                const envName = tokenEnvName(prepared.config);

                if (!hasDoToken(envName)) {
                    return json(503, {
                        error: MISSING_TOKEN_ERROR,
                        env: envName,
                        packId: prepared.packId
                    });
                }

                const job = jobs.create({ packId: prepared.packId, steps: prepared.steps });
                jobs.markRunning(job.id);
                const opening = firstRunningStep(job);
                jobs.emit(job.id, opening, "running", `Applying ${prepared.packId} in ${prepared.config.region ?? "the selected region"}…`);

                void (async () => {
                    try {
                        const result = await grapevine.applyGrapeConfig(prepared.config, { baseDir: prepared.packDir });
                        const domain = snapshot.domainName?.trim() || result.domains[0]?.name;
                        const summary = summarizeApplyResult(prepared.packId, result, {
                            region: prepared.config.region,
                            domain,
                            warnings: prepared.warnings
                        });

                        const droplet = summary.droplets[0];
                        const database = summary.databases[0];
                        const logs: Partial<Record<TimelineStepId, string>> = {
                            droplet: droplet
                                ? `Created droplet ${droplet.name}${droplet.id ? ` (${droplet.id})` : ""}${droplet.ip ? ` at ${droplet.ip}` : ""}.`
                                : "Droplet apply finished.",
                            docker: "Docker install is part of the stack bootstrap on the droplet.",
                            stack: result.stacks[0]
                                ? `Stack ${result.stacks[0].name} written to ${result.stacks[0].workdir}.`
                                : "Stack apply finished.",
                            db: database
                                ? `Database ${database.name} is ${database.status}${database.host ? ` at ${database.host}` : ""}.`
                                : "Database init is handled by the compose stack.",
                            backup: snapshot.backupFrequency
                                ? `Backup cadence requested: ${snapshot.backupFrequency}.`
                                : "Backup setup recorded.",
                            health: "Stack health wait is included in droplet user-data.",
                            ssl: snapshot.sslEnabled === false
                                ? "SSL skipped by wizard."
                                : "TLS is requested via the stack / Traefik route templates.",
                            complete: droplet?.ip
                                ? `Instance is reachable at ${droplet.ip}${domain ? ` (${domain})` : ""}.`
                                : `Apply finished${domain ? ` for ${domain}` : ""}.`
                        };

                        for (const step of job.steps) {
                            jobs.emit(job.id, step.id, "completed", logs[step.id]);
                        }
                        jobs.markSucceeded(job.id, summary);
                    } catch (error) {
                        const message = asErrorMessage(error, "GrapeVine apply failed.");
                        const running = job.steps.find((step) => step.status === "running")?.id ?? opening;
                        jobs.emit(job.id, running, "failed", message);
                        jobs.markFailed(job.id, message);
                    }
                })();

                return json(202, sanitizeForClient(jobs.snapshot(job.id)));
            } catch (error) {
                return json(500, { error: asErrorMessage(error, "Failed to start KiwiPress provision.") });
            }
        })
    });

    app.route({
        method: "GET",
        path: "/provision/:id",
        handler: guard((ctx) => {
            const job = jobs.snapshot(ctx.params.id);
            if (!job) {
                return json(404, { error: "Provision job not found." });
            }
            return json(200, job);
        })
    });

    return app;
}
