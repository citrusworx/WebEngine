import { applyGrapeConfig } from "../config/apply.js";
import { declaredSpaceIndex, publishStaticSites } from "../config/static-publish.js";
import { getConfigSourceDir } from "../config/source.js";
import { DESTROY_V1_NOTES, destroyGrapeResources, planDestroy } from "../config/destroy.js";
import { loadGrapeConfig } from "../config/load.js";
import { fetchLiveInventory, tokenIsSet } from "../config/live.js";
import { planGrapeConfig, resolveGrapePlan } from "../config/plan.js";
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
    const plan = await resolveGrapePlan(config);
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
export async function handlePublish(options) {
    const source = requireConfig(options.config);
    const config = await loadGrapeConfig(source);
    const sites = config.resources?.static_sites ?? [];
    if (sites.length === 0) {
        throw new CliError("No resources.static_sites in this config. Declare one to build and upload dist/.");
    }
    if (options.dryRun) {
        const preview = sites.map((site) => ({
            name: site.name,
            space: site.space,
            dist: site.dist,
            build: site.build ?? (site.workspace ? `yarn workspace ${site.workspace} build` : null),
            cwd: site.cwd ?? null
        }));
        if (options.json) {
            printJson({ dry_run: true, static_sites: preview });
            return;
        }
        println("Publish dry-run  (no build, no Spaces upload)");
        println();
        for (const site of preview) {
            println(`  ${site.name}`);
            println(`    build  ${site.build ?? "(missing)"}`);
            println(`    dist   ${site.dist}`);
            println(`    space  ${site.space}`);
            println(`    cwd    ${site.cwd ?? "monorepo root (package.json workspaces, else process cwd)"}`);
        }
        println();
        println("DNS CNAME to the CDN hostname is still operator-owned. grape publish does not create it.");
        return;
    }
    const declared = declaredSpaceIndex(config);
    const published = await publishStaticSites(sites, {
        baseDir: getConfigSourceDir(config),
        spaces: declared.spaces,
        spaceAcls: declared.acls,
        fallbackRegion: config.region,
        requireAppliedSpace: false,
        spaceOptions: {
            accessKeyEnv: config.credentials?.spaces_access_key_env,
            secretKeyEnv: config.credentials?.spaces_secret_key_env
        }
    });
    if (options.json) {
        printJson({ static_sites: published });
        return;
    }
    println("Published");
    for (const site of published) {
        println(`  static_site     ${site.name}  space=${site.space}  uploaded=${site.uploaded}  deleted=${site.deleted}`);
        println(`    cwd ${site.cwd}`);
        println(`    dist ${site.dist}`);
    }
    println();
    println("DNS CNAME to the CDN hostname is still operator-owned. grape publish does not create it.");
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