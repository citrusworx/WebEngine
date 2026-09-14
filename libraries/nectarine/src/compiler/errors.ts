export class QueryCompileError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QueryCompileError";
    }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
