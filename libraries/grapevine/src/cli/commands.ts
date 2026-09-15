import { applyGrapeConfig } from "../config/apply.js";
import { DESTROY_V1_NOTES, destroyGrapeResources, planDestroy } from "../config/destroy.js";
import { loadGrapeConfig } from "../config/load.js";
import { fetchLiveInventory, tokenIsSet } from "../config/live.js";
import { planGrapeConfig } from "../config/plan.js";
import { CliError } from "./errors.js";
import { confirmDestroy } from "./confirm.js";
import { printJson, println } from "./format.js";
import {
    copyBlueprint,
    DEFAULT_INIT_OUT,
    listBlueprints,
    resolveBlueprintsDir
} from "./init.js";
import {
    destroySummary,
    overlapWithConfig,
    renderApply,
    renderDestroy,
    renderLiveStatus,
    renderOverlap,
    renderPlan,
    renderValidate
} from "./render.js";

export interface CommandOptions {
    config?: string;
    json?: boolean;
    yes?: boolean;
    dryRun?: boolean;
    tag?: string;
    list?: boolean;
    force?: boolean;
    blueprint?: string;
}

function requireConfig(config: string | undefined): string {
    if (!config) {
        throw new CliError("Missing required -c/--config <path|url>");
    }
    return config;
}

export async function handleValidate(options: CommandOptions): Promise<void> {
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

export async function handlePlan(options: CommandOptions, heading?: string): Promise<void> {
    const source = requireConfig(options.config);
    const config = await loadGrapeConfig(source);
    const plan = planGrapeConfig(config);
    if (options.json) {
        printJson({ ...plan, source });
        return;
    }
    renderPlan(plan, heading);
}

export async function handleApply(options: CommandOptions): Promise<void> {
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

export async function handleDestroy(options: CommandOptions): Promise<void> {
    if (!options.config && !options.tag) {
        throw new CliError("Destroy requires -c/--config <path|url> and/or --tag <tag>");
    }

    const config = options.config ? await loadGrapeConfig(options.config) : undefined;
    if (config) {
        const envName = config.credentials?.env ?? "DO_TOKEN";
        if (!tokenIsSet(envName)) {
            throw new CliError(`${envName} is not set. Export a DigitalOcean personal access token.`);
        }
    } else if (!tokenIsSet()) {
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

export async function handleStatus(options: CommandOptions): Promise<void> {
    const config = options.config ? await loadGrapeConfig(options.config) : undefined;
    const envName = config?.credentials?.env ?? "DO_TOKEN";
    const tokenSet = tokenIsSet(envName);
    const plan = config ? planGrapeConfig(config) : undefined;

    let inventory = null;
    let liveError: string | undefined;
    if (tokenSet) {
        try {
            inventory = await fetchLiveInventory();
        } catch (error) {
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
        throw new CliError(
            `${envName} is not set. Export a DigitalOcean personal access token to view live resources.`
        );
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

export async function handleInit(options: CommandOptions): Promise<void> {
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
            dest: copied.dest
        });
        return;
    }

    println(`Wrote ${copied.blueprint.id} → ${copied.dest}`);
    println(`Next: grape validate -c ${copied.dest}`);
    println("      grape plan -c " + copied.dest);
}
