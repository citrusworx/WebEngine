#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { CommanderError } from "commander";
import { CliError, formatCliError } from "../cli/errors.js";
import { printErr } from "../cli/format.js";
import { createProgram } from "../cli/program.js";

export async function runCli(argv: string[]): Promise<number> {
    const program = createProgram();
    try {
        if (argv.length === 0) {
            program.outputHelp();
            return 0;
        }
        await program.parseAsync(argv, { from: "user" });
        return 0;
    } catch (error) {
        if (error instanceof CommanderError) {
            if (
                error.code === "commander.helpDisplayed" ||
                error.code === "commander.help" ||
                error.code === "commander.version"
            ) {
                return 0;
            }
            return error.exitCode || 1;
        }

        if (error instanceof CliError) {
            printErr(error.message);
            return error.exitCode;
        }

        printErr(formatCliError(error));
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
