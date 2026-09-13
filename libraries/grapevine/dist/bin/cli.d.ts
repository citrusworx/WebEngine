#!/usr/bin/env node
export interface CliArgs {
    command: "apply" | "validate" | "status" | "help";
    config?: string;
}
export declare function parseCliArgs(argv: string[]): CliArgs;
export declare function runCli(argv: string[]): Promise<number>;
