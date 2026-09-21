import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { deleteSpaceObject, listSpaceObjects, normalizeObjectKey, putSpaceObject } from "../providers/digitalocean/spaces/spaces.js";
import { contentTypeForKey } from "../providers/digitalocean/spaces/content-type.js";
import { resolveAgainstBase } from "./source.js";
export function resolveStaticSiteBuild(site) {
    if (site.build?.trim()) {
        return site.build.trim();
    }
    if (site.workspace?.trim()) {
        return `yarn workspace ${shellWord(site.workspace.trim())} build`;
    }
    throw new Error(`static site "${site.name}" requires build or workspace`);
}
function shellWord(value) {
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
export function resolveStaticSiteCwd(site, baseDir) {
    if (site.cwd) {
        return resolveAgainstBase(baseDir, site.cwd);
    }
    return findMonorepoRoot(process.cwd()) ?? process.cwd();
}
export function findMonorepoRoot(start) {
    let dir = path.resolve(start);
    for (let depth = 0; depth < 8; depth += 1) {
        const pkgPath = path.join(dir, "package.json");
        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
                if (pkg.workspaces) {
                    return dir;
                }
            }
            catch {
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
export function resolveDistDir(dist, cwd) {
    return path.isAbsolute(dist) ? dist : path.resolve(cwd, dist);
}
export function normalizeKeyPrefix(prefix) {
    if (!prefix?.trim()) {
        return "";
    }
    const trimmed = prefix.trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) {
        return "";
    }
    return normalizeObjectKey(trimmed);
}
export function runBuildCommand(command, cwd) {
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
            reject(new Error(`Build command failed (exit ${code ?? "null"}${signalNote}): ${command}`));
        });
    });
}
async function walkFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
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
export async function listDistFiles(distDir) {
    if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
        throw new Error(`Static site dist directory does not exist: ${distDir}`);
    }
    const absoluteFiles = await walkFiles(distDir);
    const files = [];
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
export async function syncDistToSpace(input, hooks = {}) {
    const putObject = hooks.putObject ?? putSpaceObject;
    const listObjects = hooks.listObjects ?? listSpaceObjects;
    const deleteObject = hooks.deleteObject ?? deleteSpaceObject;
    const prefix = normalizeKeyPrefix(input.prefix);
    const files = await listDistFiles(input.distDir);
    const uploaded = [];
    for (const file of files) {
        const key = prefix ? `${prefix}/${file.relative}` : file.relative;
        const body = await readFile(file.absolute);
        await putObject({
            bucket: input.bucket,
            region: input.region,
            key,
            body,
            contentType: contentTypeForKey(key),
            acl: input.acl
        }, {
            credentials: input.credentials,
            accessKeyEnv: input.accessKeyEnv,
            secretKeyEnv: input.secretKeyEnv
        });
        uploaded.push(key);
    }
    const deleted = [];
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
export async function publishStaticSites(sites, context, hooks = {}) {
    const runCommand = hooks.runCommand ?? runBuildCommand;
    const results = [];
    for (const site of sites) {
        const applied = context.spaces.find((space) => space.name === site.space);
        const region = applied?.region ?? site.region ?? context.fallbackRegion;
        if (context.requireAppliedSpace && !applied) {
            throw new Error(`static site "${site.name}" targets Space "${site.space}" which was not created or adopted in this apply`);
        }
        if (!region) {
            throw new Error(`static site "${site.name}" targets Space "${site.space}" which has no region. Declare the Space or set region.`);
        }
        const cwd = resolveStaticSiteCwd(site, context.baseDir);
        const build = resolveStaticSiteBuild(site);
        await runCommand(build, cwd);
        const distDir = resolveDistDir(site.dist, cwd);
        const acl = site.acl ?? applied?.acl ?? context.spaceAcls?.get(site.space);
        const objectAcl = acl === "public-read" || acl === "private" ? acl : undefined;
        const synced = await syncDistToSpace({
            distDir,
            bucket: site.space,
            region,
            prefix: site.prefix,
            acl: objectAcl,
            deleteStale: site.delete_stale === true,
            ...context.spaceOptions
        }, hooks);
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
export function declaredSpaceIndex(config) {
    const spaces = [];
    const acls = new Map();
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
//# sourceMappingURL=static-publish.js.map