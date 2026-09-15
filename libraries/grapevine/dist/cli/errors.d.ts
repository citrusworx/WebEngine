export declare class CliError extends Error {
    readonly exitCode: number;
    constructor(message: string, exitCode?: number);
}
export declare function formatCliError(error: unknown): string;
