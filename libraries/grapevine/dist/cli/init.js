import { copyFile, readdir } from "node:fs/promises";
import { constants as fsConstants, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "./errors.js";
const CATALOG = [
    {
        id: "01-vpc-and-tag",
        file: "01-vpc-and-tag.yaml",
        summary: "Tag + VPC (no droplet cost)",
        aliases: ["01", "vpc-and-tag", "vpc"]
    },
    {
        id: "02-droplet-in-vpc",
        file: "02-droplet-in-vpc.yaml",
        summary: "Tag, generated SSH key, VPC, and a droplet",
        aliases: ["02", "droplet-in-vpc", "droplet"]
    },
    {
        id: "03-web-firewall",
        file: "03-web-firewall.yaml",
        summary: "Firewall for an existing droplet (replace placeholders first)",
        aliases: ["03", "web-firewall", "firewall"]
    },
    {
        id: "04-full-web-stack",
        file: "04-full-web-stack.yaml",
        summary: "One-shot tag + SSH + VPC + droplet + firewall",
        aliases: ["04", "full-web-stack", "full", "web-stack"]
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
    const files = (await readdir(dir))
        .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
        .sort();
    return files.map((file) => {
        const known = CATALOG.find((item) => item.file === file);
        const id = file.replace(/\.ya?ml$/i, "");
        return {
            id: known?.id ?? id,
            file,
            summary: known?.summary ?? id,
            aliases: known?.aliases ?? []
        };
    });
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
    const dest = path.resolve(options.out ?? DEFAULT_INIT_OUT);
    const src = path.join(dir, blueprint.file);
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
    return { blueprint, dest };
}
//# sourceMappingURL=init.js.map