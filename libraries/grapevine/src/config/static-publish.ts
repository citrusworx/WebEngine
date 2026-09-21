import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
    deleteSpaceObject,
    listSpaceObjects,
    normalizeObjectKey,
    putSpaceObject,
    type SpaceAcl,
    type SpaceCallOptions
} from "../providers/digitalocean/spaces/spaces.js";
import { contentTypeForKey } from "../providers/digitalocean/spaces/content-type.js";
import type { AppliedSpace } from "./apply.js";
import type { GrapeConfig, StaticSiteResourceConfig } from "./schema.js";
import { resolveAgainstBase } from "./source.js";

export interface StaticSitePublishResult {
    name: string;
    space: string;
    region: string;
    dist: string;
    cwd: string;
    build: string;
    uploaded: number;
    deleted: number;
    prefix?: string;
    keys: string[];
}

export interface StaticSiteHooks {
    runCommand?: (command: string, cwd: string) => Promise<void>;
    putObject?: typeof putSpaceObject;
    listObjects?: typeof listSpaceObjects;
    deleteObject?: typeof deleteSpaceObject;
}

export function resolveStaticSiteBuild(site: Pick<StaticSiteResourceConfig, "build" | "workspace" | "name">): string {
    if (site.build?.trim()) {
        return site.build.trim();
    }
    if (site.workspace?.trim()) {
        return `yarn workspace ${shellWord(site.workspace.trim())} build`;
    }
    throw new Error(`static site "${site.name}" requires build or workspace`);
}

function shellWord(value: string): string {
    if (/^[A-Za-z0-9_@./:-]+$/.test(value)) {
        return value;
    }
    return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

/**
 * Default build directory: nearest parent of `process.cwd()` with a package.json
 * `workspaces` field (the monorepo root), otherwise `process.cwd()`.
 * `site.cwd` overrides that and is resolved against the grape config directory.
 */
export function resolveStaticSiteCwd(site: Pick<StaticSiteResourceConfig, "cwd">, baseDir: string): string {
    if (site.cwd) {
        return resolveAgainstBase(baseDir, site.cwd);
    }
    return findMonorepoRoot(process.cwd()) ?? process.cwd();
}

export function findMonorepoRoot(start: string): string | undefined {
    let dir = path.resolve(start);
    for (let depth = 0; depth < 8; depth += 1) {
        const pkgPath = path.join(dir, "package.json");
        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { workspaces?: unknown };
                if (pkg.workspaces) {
                    return dir;
                }
            } catch {
                // Keep walking. A broken package.json is not a root.
            }
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    return undefined;
}

export function resolveDistDir(dist: string, cwd: string): string {
    return path.isAbsolute(dist) ? dist : path.resolve(cwd, dist);
}

export function normalizeKeyPrefix(prefix?: string): string {
    if (!prefix?.trim()) {
        return "";
    }
    const trimmed = prefix.trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) {
        return "";
    }
    return normalizeObjectKey(trimmed);
}

export function runBuildCommand(command: string, cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, {
            cwd,
            shell: true,
            stdio: "inherit",
            env: process.env
        });
        child.on("error", (error) => {
            reject(error);
        });
        child.on("close", (code, signal) => {
            if (code === 0) {
                resolve();
                return;
            }
            const signalNote = signal ? `, signal ${signal}` : "";
            reject(
                new Error(
                    `Build command failed (exit ${code ?? "null"}${signalNote}): ${command}`
                )
            );
        });
    });
}

export interface DistFile {
    absolute: string;
    relative: string;
}

async function walkFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const absolute = path.join(dir, entry.name);
        if (entry.isSymbolicLink()) {
            continue;
        }
        if (entry.isDirectory()) {
            files.push(...(await walkFiles(absolute)));
            continue;
        }
        if (entry.isFile()) {
            files.push(absolute);
        }
    }
    return files;
}

export async function listDistFiles(distDir: string): Promise<DistFile[]> {
    if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
        throw new Error(`Static site dist directory does not exist: ${distDir}`);
    }
    const absoluteFiles = await walkFiles(distDir);
    const files: DistFile[] = [];
    for (const absolute of absoluteFiles) {
        const relative = path.relative(distDir, absolute).split(path.sep).join("/");
        if (!relative || relative.split("/").some((part) => part === ".." || part === "")) {
            continue;
        }
        files.push({ absolute, relative });
    }
    files.sort((left, right) => (left.relative < right.relative ? -1 : left.relative > right.relative ? 1 : 0));
    return files;
}

export interface SyncDistInput extends SpaceCallOptions {
    distDir: string;
    bucket: string;
    region: string;
    prefix?: string;
    acl?: SpaceAcl;
    deleteStale?: boolean;
}

export async function syncDistToSpace(
    input: SyncDistInput,
    hooks: Pick<StaticSiteHooks, "putObject" | "listObjects" | "deleteObject"> = {}
): Promise<{ uploaded: string[]; deleted: string[] }> {
    const putObject = hooks.putObject ?? putSpaceObject;
    const listObjects = hooks.listObjects ?? listSpaceObjects;
    const deleteObject = hooks.deleteObject ?? deleteSpaceObject;
    const prefix = normalizeKeyPrefix(input.prefix);
    const files = await listDistFiles(input.distDir);
    const uploaded: string[] = [];
    for (const file of files) {
        const key = prefix ? `${prefix}/${file.relative}` : file.relative;
        const body = await readFile(file.absolute);
        await putObject(
            {
                bucket: input.bucket,
                region: input.region,
                key,
                body,
                contentType: contentTypeForKey(key),
                acl: input.acl
            },
            {
                credentials: input.credentials,
                accessKeyEnv: input.accessKeyEnv,
                secretKeyEnv: input.secretKeyEnv
            }
        );
        uploaded.push(key);
    }

    const deleted: string[] = [];
    if (input.deleteStale) {
        const listPrefix = prefix ? `${prefix}/` : undefined;
        const existing = await listObjects(input.bucket, input.region, {
            prefix: listPrefix,
            credentials: input.credentials,
            accessKeyEnv: input.accessKeyEnv,
            secretKeyEnv: input.secretKeyEnv
        });
        const keep = new Set(uploaded);
        for (const object of existing) {
            if (prefix && object.key !== prefix && !object.key.startsWith(`${prefix}/`)) {
                continue;
            }
            if (keep.has(object.key)) {
                continue;
            }
            await deleteObject(input.bucket, input.region, object.key, {
                credentials: input.credentials,
                accessKeyEnv: input.accessKeyEnv,
                secretKeyEnv: input.secretKeyEnv
            });
            deleted.push(object.key);
        }
    }
    return { uploaded, deleted };
}

export interface PublishContext {
    baseDir: string;
    /** Spaces created or adopted in this apply. `grape publish` may pass declared spaces instead. */
    spaces: AppliedSpace[];
    spaceOptions?: SpaceCallOptions;
    /**
     * When true (apply), the named Space must be in `spaces`.
     * `grape publish` leaves this false and uploads to the named bucket.
     */
    requireAppliedSpace?: boolean;
    /** Region from the grape config, used when a site names a Space that is not in `spaces`. */
    fallbackRegion?: string;
    /** Declared Space ACL by name, so object ACL can follow the config when apply did not run. */
    spaceAcls?: Map<string, SpaceAcl | undefined>;
}

export async function publishStaticSites(
    sites: StaticSiteResourceConfig[],
    context: PublishContext,
    hooks: StaticSiteHooks = {}
): Promise<StaticSitePublishResult[]> {
    const runCommand = hooks.runCommand ?? runBuildCommand;
    const results: StaticSitePublishResult[] = [];
    for (const site of sites) {
        const applied = context.spaces.find((space) => space.name === site.space);
        const region = applied?.region ?? site.region ?? context.fallbackRegion;
        if (context.requireAppliedSpace && !applied) {
            throw new Error(
                `static site "${site.name}" targets Space "${site.space}" which was not created or adopted in this apply`
            );
        }
        if (!region) {
            throw new Error(
                `static site "${site.name}" targets Space "${site.space}" which has no region. Declare the Space or set region.`
            );
        }
        const cwd = resolveStaticSiteCwd(site, context.baseDir);
        const build = resolveStaticSiteBuild(site);
        await runCommand(build, cwd);
        const distDir = resolveDistDir(site.dist, cwd);
        const acl = site.acl ?? applied?.acl ?? context.spaceAcls?.get(site.space);
        const objectAcl = acl === "public-read" || acl === "private" ? acl : undefined;
        const synced = await syncDistToSpace(
            {
                distDir,
                bucket: site.space,
                region,
                prefix: site.prefix,
                acl: objectAcl,
                deleteStale: site.delete_stale === true,
                ...context.spaceOptions
            },
            hooks
        );
        results.push({
            name: site.name,
            space: site.space,
            region,
            dist: distDir,
            cwd,
            build,
            uploaded: synced.uploaded.length,
            deleted: synced.deleted.length,
            prefix: normalizeKeyPrefix(site.prefix) || undefined,
            keys: synced.uploaded
        });
    }
    return results;
}

export function declaredSpaceIndex(config: GrapeConfig): {
    spaces: AppliedSpace[];
    acls: Map<string, SpaceAcl | undefined>;
} {
    const spaces: AppliedSpace[] = [];
    const acls = new Map<string, SpaceAcl | undefined>();
    for (const space of config.resources?.spaces ?? []) {
        const region = space.region ?? config.region ?? "";
        acls.set(space.name, space.acl);
        if (!region) {
            continue;
        }
        spaces.push({
            name: space.name,
            region,
            origin: `${space.name}.${region}.digitaloceanspaces.com`,
            acl: space.acl
        });
    }
    return { spaces, acls };
}
