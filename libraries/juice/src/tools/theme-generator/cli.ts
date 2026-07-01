import { collectThemeEntries, generateExternalThemeArtifacts, generateThemeArtifacts } from "./index.ts";

type CliOptions = {
    configPath?: string;
    cssOutPath?: string;
    yamlOutPath?: string;
};

function parseArgs(argv: string[]): CliOptions {
    const options: CliOptions = {};

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        const next = argv[index + 1];

        if (arg === "--config" && next) {
            options.configPath = next;
            index += 1;
            continue;
        }

        if (arg === "--css-out" && next) {
            options.cssOutPath = next;
            index += 1;
            continue;
        }

        if (arg === "--yaml-out" && next) {
            options.yamlOutPath = next;
            index += 1;
            continue;
        }
    }

    return options;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.configPath || options.cssOutPath || options.yamlOutPath) {
        if (!options.configPath || !options.cssOutPath) {
            throw new Error("Theme generator requires both --config and --css-out when generating an external app theme.");
        }

        const config = await generateExternalThemeArtifacts({
            configPath: options.configPath,
            cssOutPath: options.cssOutPath,
            yamlOutPath: options.yamlOutPath,
        });

        console.log(`Generated external Juice theme "${config.id}" from ${options.configPath}`);
        console.log(`- css: ${options.cssOutPath}`);
        if (options.yamlOutPath) {
            console.log(`- yaml: ${options.yamlOutPath}`);
        }
        return;
    }

    await generateThemeArtifacts();
    const entries = await collectThemeEntries();

    console.log(`Generated/discovered ${entries.length} Juice theme entries:`);
    for (const entry of entries) {
        console.log(`- ${entry.id}: ${entry.src}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
