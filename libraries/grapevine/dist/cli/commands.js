import { digitalOceanCatalog, formatProviderCatalog } from "../providers/catalog/catalog.js";
import { fetchDigitalOceanOfferings, formatOfferings } from "../providers/digitalocean/offerings/offerings.js";
import { fetchTelemetry } from "../providers/digitalocean/monitoring/telemetry.js";
import { applyGrapeConfig } from "../config/apply.js";
import { DESTROY_V1_NOTES, destroyGrapeResources, planDestroy } from "../config/destroy.js";
import { loadGrapeConfig } from "../config/load.js";
import { fetchLiveInventory, tokenIsSet } from "../config/live.js";
import { planGrapeConfig } from "../config/plan.js";
import { CliError } from "./errors.js";
import { confirmDestroy } from "./confirm.js";
import { printJson, println } from "./format.js";
import { copyBlueprint, DEFAULT_INIT_OUT, listBlueprints, resolveBlueprintsDir } from "./init.js";
import { destroySummary, overlapWithConfig, renderApply, renderDestroy, renderLiveStatus, renderOverlap, renderPlan, renderValidate } from "./render.js";
function requireConfig(config) {
    if (!config) {
        throw new CliError("Missing required -c/--config <path|url>");
    }
    return config;
}
export async function handleValidate(options) {
    const source = requireConfig(options.config);
    const config = await loadGrapeConfig(source);
    const plan = planGrapeConfig(config);
    if (options.json) {
        printJson({
            valid: true,
            source,
            provider: plan.provider,
            region: plan.region ?? null,
            counts: plan.counts,
            resources: plan.resources,
            warnings: plan.warnings
        });
        return;
    }
    renderValidate(plan, source);
}
export async function handlePlan(options, heading) {
    const source = requireConfig(options.config);
    const config = await loadGrapeConfig(source);
    const plan = planGrapeConfig(config);
    if (options.json) {
        printJson({ ...plan, source });
        return;
    }
    renderPlan(plan, heading);
}
export async function handleApply(options) {
    if (options.dryRun) {
        await handlePlan(options, "Apply dry-run  (no DigitalOcean mutations)");
        return;
    }
    const source = requireConfig(options.config);
    const config = await loadGrapeConfig(source);
    const result = await applyGrapeConfig(config);
    if (options.json) {
        printJson(result);
        return;
    }
    renderApply(result);
}
export async function handleDestroy(options) {
    if (!options.config && !options.tag) {
        throw new CliError("Destroy requires -c/--config <path|url> and/or --tag <tag>");
    }
    const config = options.config ? await loadGrapeConfig(options.config) : undefined;
    if (config) {
        const envName = config.credentials?.env ?? "DO_TOKEN";
        if (!tokenIsSet(envName)) {
            throw new CliError(`${envName} is not set. Export a DigitalOcean personal access token.`);
        }
    }
    else if (!tokenIsSet()) {
        throw new CliError("DO_TOKEN is not set. Export a DigitalOcean personal access token.");
    }
    const dryRun = Boolean(options.dryRun);
    if (!dryRun) {
        const inventory = await fetchLiveInventory();
        const plan = planDestroy(inventory, { config, tag: options.tag });
        if (!options.json) {
            println(DESTROY_V1_NOTES);
            println();
        }
        if (plan.targets.length > 0) {
            await confirmDestroy({
                yes: Boolean(options.yes),
                stdinIsTTY: Boolean(process.stdin.isTTY),
                summary: destroySummary(plan.targets)
            });
        }
        const result = await destroyGrapeResources({
            config,
            tag: options.tag,
            dryRun: false,
            inventory
        });
        if (options.json) {
            printJson(result);
            return;
        }
        renderDestroy(result);
        return;
    }
    const result = await destroyGrapeResources({
        config,
        tag: options.tag,
        dryRun: true
    });
    if (options.json) {
        printJson(result);
        return;
    }
    println(DESTROY_V1_NOTES);
    println();
    renderDestroy(result);
}
export async function handleStatus(options) {
    const config = options.config ? await loadGrapeConfig(options.config) : undefined;
    const envName = config?.credentials?.env ?? "DO_TOKEN";
    const tokenSet = tokenIsSet(envName);
    const plan = config ? planGrapeConfig(config) : undefined;
    let inventory = null;
    let liveError;
    if (tokenSet) {
        try {
            inventory = await fetchLiveInventory();
        }
        catch (error) {
            liveError = error instanceof Error ? error.message : String(error);
        }
    }
    if (options.json) {
        printJson({
            token: { env: envName, set: tokenSet },
            config: plan
                ? {
                    source: options.config,
                    provider: plan.provider,
                    region: plan.region ?? null,
                    counts: plan.counts,
                    resources: plan.resources
                }
                : null,
            live: inventory,
            overlap: plan && inventory ? overlapWithConfig(plan, inventory) : [],
            live_error: liveError ?? null
        });
        return;
    }
    println(tokenSet ? `${envName} is set` : `${envName} is not set`);
    println();
    if (plan && options.config) {
        renderValidate(plan, options.config, "Config");
        println();
    }
    if (!tokenSet && !plan) {
        throw new CliError(`${envName} is not set. Export a DigitalOcean personal access token to view live resources.`);
    }
    if (!tokenSet) {
        println("Live account skipped (token not set).");
        return;
    }
    if (!inventory) {
        println(`Live status unavailable: ${liveError}`);
        return;
    }
    renderLiveStatus(inventory);
    if (plan) {
        println();
        renderOverlap(overlapWithConfig(plan, inventory));
    }
}
function requireToken() {
    if (!tokenIsSet()) {
        throw new CliError("DO_TOKEN is not set. Export a DigitalOcean personal access token.");
    }
}
export async function handleCatalog(options) {
    if (options.offerings) {
        await handleOfferings(options);
        return;
    }
    if (options.json) {
        printJson(digitalOceanCatalog);
        return;
    }
    println(formatProviderCatalog());
}
export async function handleOfferings(options) {
    requireToken();
    const offerings = await fetchDigitalOceanOfferings();
    if (options.json) {
        printJson(offerings);
        return;
    }
    println(formatOfferings(offerings));
}
export async function handleTelemetry(options) {
    requireToken();
    const start = options.start !== undefined ? Number(options.start) : undefined;
    const end = options.end !== undefined ? Number(options.end) : undefined;
    if ((options.start !== undefined && !Number.isFinite(start)) || (options.end !== undefined && !Number.isFinite(end))) {
        throw new CliError("--start and --end must be unix timestamps in seconds");
    }
    const report = await fetchTelemetry({
        dropletId: options.droplet,
        start,
        end
    });
    if (options.json) {
        printJson(report);
        return;
    }
    println(`Alert policies (${report.alert_policies.length})`);
    if (report.alert_policies.length === 0) {
        println("  (none)");
    }
    else {
        for (const policy of report.alert_policies) {
            println(`  ${policy.description}  uuid=${policy.uuid}  type=${policy.type}  enabled=${policy.enabled}`);
        }
    }
    println();
    println(`Uptime checks (${report.uptime_checks.length})`);
    if (report.uptime_checks.length === 0) {
        println("  (none)");
    }
    else {
        for (const check of report.uptime_checks) {
            println(`  ${check.name}  id=${check.id}  ${check.type} ${check.target}  enabled=${check.enabled}`);
        }
    }
    println();
    if (!report.droplet) {
        println("Droplet metrics  (pass --droplet <id> to read bandwidth, CPU, and memory)");
    }
    else {
        const series = [
            ["bandwidth public inbound", report.droplet.bandwidth_public_inbound],
            ["bandwidth public outbound", report.droplet.bandwidth_public_outbound],
            ["cpu", report.droplet.cpu],
            ["memory available", report.droplet.memory_available],
            ["memory total", report.droplet.memory_total]
        ];
        println(`Droplet ${report.droplet.host_id}  ${report.droplet.start}..${report.droplet.end}`);
        for (const [label, metric] of series) {
            const points = metric.result.reduce((sum, sample) => sum + sample.values.length, 0);
            const agent = metric.agent_required ? "  agent required" : "";
            println(`  ${label}  samples=${points}${agent}`);
        }
    }
    println();
    println("Notes");
    for (const note of report.notes) {
        println(`  - ${note}`);
    }
}
export async function handleInit(options) {
    const listOnly = Boolean(options.list) || !options.blueprint;
    if (listOnly && !options.blueprint) {
        const blueprints = await listBlueprints();
        if (options.json) {
            printJson({
                blueprints,
                directory: resolveBlueprintsDir(),
                default_out: DEFAULT_INIT_OUT
            });
            return;
        }
        println("Available blueprints");
        println();
        for (const blueprint of blueprints) {
            const aliases = blueprint.aliases.length ? `  aliases: ${blueprint.aliases.join(", ")}` : "";
            println(`  ${blueprint.id.padEnd(22)}  ${blueprint.summary}${aliases}`);
        }
        println();
        println(`Copy one with: grape init <blueprint>`);
        println(`Writes ${DEFAULT_INIT_OUT} in the current directory (pass --force to overwrite).`);
        return;
    }
    if (!options.blueprint) {
        throw new CliError("Missing blueprint id. Try grape init --list");
    }
    const copied = await copyBlueprint({
        query: options.blueprint,
        force: options.force
    });
    if (options.json) {
        printJson({
            copied: copied.blueprint,
            dest: copied.dest,
            config: copied.configPath
        });
        return;
    }
    println(`Wrote ${copied.blueprint.id} → ${copied.dest}`);
    println(`Next: grape validate -c ${copied.configPath}`);
    println("      grape plan -c " + copied.configPath);
}
//# sourceMappingURL=commands.js.map