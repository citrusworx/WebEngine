import { createRequire } from "node:module";
import { Command } from "commander";
import { DESTROY_V1_NOTES } from "../config/destroy.js";
import { handleApply, handleDestroy, handleInit, handlePlan, handlePublish, handleStatus, handleValidate } from "./commands.js";
const require = createRequire(import.meta.url);
const pkg = require("../../package.json");
function addCommonOptions(command) {
    return command
        .option("-c, --config <path>", "Local YAML/JSON file or HTTP(S) URL")
        .option("--json", "Machine-readable JSON output")
        .option("-y, --yes", "Skip confirmation for destructive operations")
        .option("--dry-run", "Show what would happen without mutating DigitalOcean");
}
function mergedOptions(command, extra = {}) {
    const opts = command.optsWithGlobals();
    return { ...opts, ...extra };
}
export function createProgram() {
    const program = new Command();
    program
        .name("grape")
        .description("Grapevine DigitalOcean CLI. KiwiEngine is not required; kiwi --grape delegates to this binary when it is on PATH.")
        .version(pkg.version)
        .showHelpAfterError()
        .showSuggestionAfterError()
        .enablePositionalOptions()
        .exitOverride();
    addCommonOptions(program);
    addCommonOptions(program
        .command("validate")
        .description("Schema-validate a grape config without calling DigitalOcean")).action(async (_opts, command) => {
        await handleValidate(mergedOptions(command));
    });
    addCommonOptions(program
        .command("plan")
        .description("Print the resource graph that apply would create (no DigitalOcean mutations)")).action(async (_opts, command) => {
        await handlePlan(mergedOptions(command));
    });
    addCommonOptions(program
        .command("apply")
        .description("Create the resources declared in a grape config")).action(async (_opts, command) => {
        await handleApply(mergedOptions(command));
    });
    addCommonOptions(program
        .command("publish")
        .description("Build resources.static_sites and upload dist/ to Spaces (no other resources)")).action(async (_opts, command) => {
        await handlePublish(mergedOptions(command));
    });
    addCommonOptions(program
        .command("destroy")
        .alias("teardown")
        .description("Tear down matching DigitalOcean resources (requires --yes unless stdin is a TTY)")
        .option("--tag <tag>", "Delete droplets with this tag and clearly attached firewalls")
        .addHelpText("after", `\n${DESTROY_V1_NOTES}\n`)).action(async (_opts, command) => {
        await handleDestroy(mergedOptions(command));
    });
    addCommonOptions(program
        .command("status")
        .description("Show live DigitalOcean resources, and optionally compare them to a config")).action(async (_opts, command) => {
        await handleStatus(mergedOptions(command));
    });
    addCommonOptions(program
        .command("init")
        .description("Scaffold grape.config.yaml from a packaged blueprint")
        .argument("[blueprint]", "Blueprint id or alias (omit to list)")
        .option("--list", "List available blueprints")
        .option("-f, --force", "Overwrite grape.config.yaml if it exists")).action(async (blueprint, _opts, command) => {
        await handleInit(mergedOptions(command, { blueprint }));
    });
    program.addHelpText("after", `
Examples:
  grape validate -c ./grape.config.yaml
  grape plan -c ./grape.config.yaml
  grape apply --dry-run -c ./grape.config.yaml
  grape apply -c ./grape.config.yaml
  grape publish -c ./grape.config.yaml
  grape status
  grape status -c ./grape.config.yaml
  grape init --list
  grape init 02
  grape destroy -c ./grape.config.yaml --yes
  grape destroy --tag grapevine-smoke --yes
  kiwi --grape -c ./grape.config.yaml
`);
    return program;
}
//# sourceMappingURL=program.js.map