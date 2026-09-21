import { copyFile, cp, readdir, rm } from "node:fs/promises";
import { constants as fsConstants, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "./errors.js";
const CATALOG = [
    {
        id: "01-vpc-and-tag",
        file: "01-vpc-and-tag.yaml",
        summary: "Tag + VPC (no droplet cost)",
        aliases: ["01", "vpc-and-tag", "vpc"],
        kind: "file"
    },
    {
        id: "02-droplet-in-vpc",
        file: "02-droplet-in-vpc.yaml",
        summary: "Tag, generated SSH key, VPC, and a droplet",
        aliases: ["02", "droplet-in-vpc", "droplet"],
        kind: "file"
    },
    {
        id: "03-web-firewall",
        file: "03-web-firewall.yaml",
        summary: "Firewall for an existing droplet (replace placeholders first)",
        aliases: ["03", "web-firewall", "firewall"],
        kind: "file"
    },
    {
        id: "04-full-web-stack",
        file: "04-full-web-stack.yaml",
        summary: "One-shot tag + SSH + VPC + droplet + firewall",
        aliases: ["04", "full-web-stack", "full", "web-stack"],
        kind: "file"
    },
    {
        id: "05-static-site-spaces",
        file: "05-static-site-spaces.yaml",
        summary: "Space + Let's Encrypt certificate + CDN (no Vite build or upload)",
        aliases: ["05", "static-site", "spaces"],
        kind: "file"
    },
    {
        id: "06-juice-static",
        file: "06-juice-static.yaml",
        summary: "Juice template: Space + certificate + CDN + Vite build and dist upload",
        aliases: ["06", "juice", "juice-static"],
        kind: "file"
    },
    {
        id: "kiwipress-compose",
        file: "kiwipress-compose",
        summary: "KiwiPress compose: droplet + Docker (Traefik, MinIO, WordPress, MariaDB, Postgres)",
        aliases: ["compose", "kiwipress"],
        kind: "pack"
    },
    {
        id: "kiwipress-managed",
        file: "kiwipress-managed",
        summary: "KiwiPress managed: DigitalOcean managed DBs + droplet + compose app layer",
        aliases: ["managed", "kiwipress-classic"],
        kind: "pack"
    }
];
export const DEFAULT_INIT_OUT = "grape.config.yaml";
export function resolveBlueprintsDir(from = fileURLToPath(import.meta.url)) {
    const here = path.dirname(from);
    const candidates = [
        path.resolve(here, "../../examples/blueprints"),
        path.resolve(here, "../blueprints"),
        path.resolve(here, "../../dist/blueprints")
    ];
    for (const dir of candidates) {
        if (existsSync(path.join(dir, "01-vpc-and-tag.yaml"))) {
            return dir;
        }
    }
    throw new CliError("Could not find packaged blueprints. Reinstall @citrusworx/grapevine or run grape from the grapevine package.");
}
export async function listBlueprints(dir = resolveBlueprintsDir()) {
    const entries = await readdir(dir, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml"))) {
            const known = CATALOG.find((item) => item.file === entry.name);
            const id = entry.name.replace(/\.ya?ml$/i, "");
            items.push({
                id: known?.id ?? id,
                file: entry.name,
                summary: known?.summary ?? id,
                aliases: known?.aliases ?? [],
                kind: "file"
            });
        }
        if (entry.isDirectory() && existsSync(path.join(dir, entry.name, "grape.config.yaml"))) {
            const known = CATALOG.find((item) => item.file === entry.name);
            items.push({
                id: known?.id ?? entry.name,
                file: entry.name,
                summary: known?.summary ?? entry.name,
                aliases: known?.aliases ?? [],
                kind: "pack"
            });
        }
    }
    return items.sort((a, b) => a.id.localeCompare(b.id));
}
export function resolveBlueprint(query, blueprints) {
    const normalized = query.trim().replace(/\.ya?ml$/i, "").toLowerCase();
    const matches = blueprints.filter((item) => {
        const names = [item.id, item.file.replace(/\.ya?ml$/i, ""), ...item.aliases].map((name) => name.toLowerCase());
        return names.includes(normalized) || item.file.toLowerCase() === query.trim().toLowerCase();
    });
    if (matches.length === 1) {
        return matches[0];
    }
    if (matches.length > 1) {
        throw new CliError(`Ambiguous blueprint "${query}". Matches: ${matches.map((item) => item.id).join(", ")}`);
    }
    throw new CliError(`Unknown blueprint "${query}". Run grape init --list to see available starters.`);
}
export async function copyBlueprint(options) {
    const dir = options.blueprintsDir ?? resolveBlueprintsDir();
    const blueprints = await listBlueprints(dir);
    const blueprint = resolveBlueprint(options.query, blueprints);
    const src = path.join(dir, blueprint.file);
    if (blueprint.kind === "pack") {
        const dest = path.resolve(options.out ?? blueprint.id);
        if (existsSync(dest) && !options.force) {
            throw new CliError(`Refusing to overwrite ${dest} (pass --force)`);
        }
        if (existsSync(dest) && options.force) {
            await rm(dest, { recursive: true, force: true });
        }
        await cp(src, dest, { recursive: true });
        return {
            blueprint,
            dest,
            configPath: path.join(dest, "grape.config.yaml")
        };
    }
    const dest = path.resolve(options.out ?? DEFAULT_INIT_OUT);
    try {
        await copyFile(src, dest, options.force ? 0 : fsConstants.COPYFILE_EXCL);
    }
    catch (error) {
        const code = error && typeof error === "object" && "code" in error
            ? error.code
            : undefined;
        if (code === "EEXIST") {
            throw new CliError(`Refusing to overwrite ${dest} (pass --force)`);
        }
        throw error;
    }
    return { blueprint, dest, configPath: dest };
}
//# sourceMappingURL=init.js.map