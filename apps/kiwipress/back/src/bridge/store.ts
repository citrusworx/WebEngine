import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type BridgeConnectionStatus = "connected" | "disconnected" | "needs_attention";

export type BridgeHealthResult = {
    status: BridgeConnectionStatus;
    reasons: string[];
    pluginPresent: boolean;
    pluginVersion?: string;
    pluginPaired?: boolean;
    lockdown?: boolean;
    wpVersion?: string;
    frontendReachable: boolean;
    siteUrl?: string;
};

export type BridgeLastHealth = {
    at: string;
    result: BridgeHealthResult;
};

/** Application password is AES-256-GCM ciphertext, never the plaintext. */
export type BridgeRecord = {
    siteUrl: string;
    username: string;
    applicationPassword: string;
    frontendUrl: string;
    pairedAt: string;
    lastHealth: BridgeLastHealth | null;
};

type BridgeFile = {
    version: 1;
    projects: Record<string, BridgeRecord>;
};

export function defaultBridgeFilePath(cwd = process.cwd()): string {
    return path.join(cwd, "data", "kiwipress-bridges.json");
}

function emptyFile(): BridgeFile {
    return { version: 1, projects: {} };
}

function cloneFile(file: BridgeFile): BridgeFile {
    return JSON.parse(JSON.stringify(file)) as BridgeFile;
}

function parseBridgeFile(raw: string): BridgeFile {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("KiwiPress bridge store is not valid JSON.");
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("KiwiPress bridge store is not a JSON object.");
    }

    const projects = (parsed as { projects?: unknown }).projects;
    if (!projects || typeof projects !== "object" || Array.isArray(projects)) {
        throw new Error("KiwiPress bridge store is missing projects.");
    }

    return { version: 1, projects: projects as Record<string, BridgeRecord> };
}

/**
 * Per-project WordPress bridge records.
 * The dashboard has one project today; records are keyed by that project id
 * in `data/kiwipress-bridges.json` next to the CMS file.
 */
export class BridgeStore {
    private queue: Promise<void> = Promise.resolve();
    private memory: BridgeFile | null;

    constructor(private readonly filePath: string | null, memory?: BridgeFile) {
        this.memory = memory ?? (filePath === null ? emptyFile() : null);
    }

    static memory(): BridgeStore {
        return new BridgeStore(null, emptyFile());
    }

    async get(projectId: string): Promise<BridgeRecord | null> {
        const file = await this.read();
        const record = file.projects[projectId];
        return record ? { ...record } : null;
    }

    async save(projectId: string, record: BridgeRecord): Promise<void> {
        await this.enqueue(async () => {
            const file = await this.read();
            file.projects[projectId] = record;
            await this.write(file);
        });
    }

    async delete(projectId: string): Promise<void> {
        await this.enqueue(async () => {
            const file = await this.read();
            delete file.projects[projectId];
            await this.write(file);
        });
    }

    async updateLastHealth(projectId: string, lastHealth: BridgeLastHealth): Promise<BridgeRecord | null> {
        let updated: BridgeRecord | null = null;
        await this.enqueue(async () => {
            const file = await this.read();
            const current = file.projects[projectId];
            if (!current) {
                return;
            }
            updated = { ...current, lastHealth };
            file.projects[projectId] = updated;
            await this.write(file);
        });
        return updated;
    }

    private enqueue(task: () => Promise<void>): Promise<void> {
        const run = this.queue.then(task, task);
        this.queue = run.then(
            () => undefined,
            () => undefined
        );
        return run;
    }

    private async read(): Promise<BridgeFile> {
        if (this.filePath === null) {
            return cloneFile(this.memory ?? emptyFile());
        }

        try {
            const raw = await readFile(this.filePath, "utf8");
            return parseBridgeFile(raw);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return emptyFile();
            }
            throw error;
        }
    }

    private async write(file: BridgeFile): Promise<void> {
        const snapshot = cloneFile(file);
        if (this.filePath === null) {
            this.memory = snapshot;
            return;
        }

        await mkdir(path.dirname(this.filePath), { recursive: true });
        const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        await writeFile(tmp, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
        await rename(tmp, this.filePath);
        this.memory = snapshot;
    }
}
