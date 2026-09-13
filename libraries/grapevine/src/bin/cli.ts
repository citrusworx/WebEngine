#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { applyGrapeConfig, normalizeResources } from "../config/apply.js";
import { loadGrapeConfig } from "../config/load.js";
import { getDoToken, DigitalOceanError } from "../providers/digitalocean/client.js";
import { listAllDroplets } from "../providers/digitalocean/droplet/droplet.js";
import { listAllVPCs } from "../providers/digitalocean/vpc/vpc.js";
import { listAllFirewalls } from "../providers/digitalocean/firewall/firewall.js";
import { listAllDomains } from "../providers/digitalocean/networking/domains.js";

const HELP = `grape — Grapevine DigitalOcean CLI

Usage:
  grape apply    -c <path|url>   Load a grape config and create the declared resources
  grape validate -c <path|url>   Schema-validate a grape config without calling DigitalOcean
  grape status   [-c <path|url>] Show token status and optionally summarize a config
  grape help                     Show this help

Options:
  -c, --config <path|url>        Local YAML/JSON file or HTTP(S) URL

Credentials:
  Set DO_TOKEN (or the env name in config.credentials.env) before apply/status.

Examples:
  grape validate -c ./grape.config.yaml
  grape apply -c https://example.com/grape.config.yaml
  kiwi --grape -c ./grape.config.yaml
`;

export interface CliArgs {
    command: "apply" | "validate" | "status" | "help";
    config?: string;
}

export function parseCliArgs(argv: string[]): CliArgs {
    const args = argv.filter((arg) => arg !== "--");
    let command: CliArgs["command"] | undefined;
    let config: string | undefined;

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === "-h" || arg === "--help" || arg === "help") {
            return { command: "help" };
        }
        if (arg === "-c" || arg === "--config") {
            const value = args[i + 1];
            if (!value || value.startsWith("-")) {
                throw new Error("Missing value for -c/--config");
            }
            config = value;
            i += 1;
            continue;
        }
        if (arg === "apply" || arg === "validate" || arg === "status") {
            command = arg;
            continue;
        }
        if (arg.startsWith("-")) {
            throw new Error(`Unknown option: ${arg}`);
        }
        throw new Error(`Unknown argument: ${arg}`);
    }

    return { command: command ?? "help", config };
}

function print(message: string): void {
    process.stdout.write(`${message}\n`);
}

function countResources(config: Awaited<ReturnType<typeof loadGrapeConfig>>): Record<string, number> {
    const resources = normalizeResources(config);
    return {
        tags: resources.tags?.length ?? 0,
        ssh_keys: resources.ssh_keys?.length ?? 0,
        vpcs: resources.vpcs?.length ?? 0,
        droplets: resources.droplets?.length ?? 0,
        firewalls: resources.firewalls?.length ?? 0,
        domains: resources.domains?.length ?? 0,
        load_balancers: resources.load_balancers?.length ?? 0,
        alert_policies: resources.alert_policies?.length ?? 0,
        apps: resources.apps?.length ?? 0
    };
}

export async function runCli(argv: string[]): Promise<number> {
    try {
        const parsed = parseCliArgs(argv);

        if (parsed.command === "help") {
            print(HELP);
            return 0;
        }

        if ((parsed.command === "apply" || parsed.command === "validate") && !parsed.config) {
            print("Missing required -c/--config <path|url>");
            print(HELP);
            return 1;
        }

        if (parsed.command === "validate" && parsed.config) {
            const config = await loadGrapeConfig(parsed.config);
            print(`Valid grape config for provider ${config.provider}`);
            print(JSON.stringify(countResources(config), null, 2));
            return 0;
        }

        if (parsed.command === "apply" && parsed.config) {
            const config = await loadGrapeConfig(parsed.config);
            const result = await applyGrapeConfig(config);
            print("Applied grape config");
            print(JSON.stringify(result, null, 2));
            return 0;
        }

        if (parsed.command === "status") {
            const envName = "DO_TOKEN";
            try {
                getDoToken(envName);
                print(`${envName} is set`);
            } catch {
                print(`${envName} is not set`);
            }

            if (parsed.config) {
                const config = await loadGrapeConfig(parsed.config);
                print(`Config: provider=${config.provider} region=${config.region ?? "(none)"}`);
                print(JSON.stringify(countResources(config), null, 2));
            } else {
                try {
                    getDoToken();
                    const [droplets, vpcs, firewalls, domains] = await Promise.all([
                        listAllDroplets(),
                        listAllVPCs(),
                        listAllFirewalls(),
                        listAllDomains()
                    ]);
                    print(
                        JSON.stringify(
                            {
                                droplets: droplets.length,
                                vpcs: vpcs.length,
                                firewalls: firewalls.length,
                                domains: domains.length
                            },
                            null,
                            2
                        )
                    );
                } catch (error) {
                    if (error instanceof DigitalOceanError) {
                        print(`Live status unavailable: ${error.message}`);
                    } else {
                        throw error;
                    }
                }
            }
            return 0;
        }

        print(HELP);
        return 1;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
        return 1;
    }
}

function isMainModule(): boolean {
    const entry = process.argv[1];
    return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
    const code = await runCli(process.argv.slice(2));
    process.exit(code);
}
