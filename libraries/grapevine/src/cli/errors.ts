import { ZodError } from "zod";
import { DigitalOceanError } from "../providers/digitalocean/client.js";

export class CliError extends Error {
    readonly exitCode: number;

    constructor(message: string, exitCode = 1) {
        super(message);
        this.name = "CliError";
        this.exitCode = exitCode;
    }
}

export function formatCliError(error: unknown): string {
    if (error instanceof CliError) {
        return error.message;
    }

    if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => {
            const path = issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
            return `  - ${path}: ${issue.message}`;
        });
        return `Invalid grape config:\n${issues.join("\n")}`;
    }

    if (error instanceof DigitalOceanError) {
        const status = error.status ? ` (HTTP ${error.status})` : "";
        return `DigitalOcean error${status}: ${error.message}`;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}
