import { deleteSpaceObject, listSpaceObjects, putSpaceObject, type SpaceAcl, type SpaceCallOptions } from "../providers/digitalocean/spaces/spaces.js";
import type { AppliedSpace } from "./apply.js";
import type { GrapeConfig, StaticSiteResourceConfig } from "./schema.js";
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
export declare function resolveStaticSiteBuild(site: Pick<StaticSiteResourceConfig, "build" | "workspace" | "name">): string;
/**
 * Default build directory: nearest parent of `process.cwd()` with a package.json
 * `workspaces` field (the monorepo root), otherwise `process.cwd()`.
 * `site.cwd` overrides that and is resolved against the grape config directory.
 */
export declare function resolveStaticSiteCwd(site: Pick<StaticSiteResourceConfig, "cwd">, baseDir: string): string;
export declare function findMonorepoRoot(start: string): string | undefined;
export declare function resolveDistDir(dist: string, cwd: string): string;
export declare function normalizeKeyPrefix(prefix?: string): string;
export declare function runBuildCommand(command: string, cwd: string): Promise<void>;
export interface DistFile {
    absolute: string;
    relative: string;
}
export declare function listDistFiles(distDir: string): Promise<DistFile[]>;
export interface SyncDistInput extends SpaceCallOptions {
    distDir: string;
    bucket: string;
    region: string;
    prefix?: string;
    acl?: SpaceAcl;
    deleteStale?: boolean;
}
export declare function syncDistToSpace(input: SyncDistInput, hooks?: Pick<StaticSiteHooks, "putObject" | "listObjects" | "deleteObject">): Promise<{
    uploaded: string[];
    deleted: string[];
}>;
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
export declare function publishStaticSites(sites: StaticSiteResourceConfig[], context: PublishContext, hooks?: StaticSiteHooks): Promise<StaticSitePublishResult[]>;
export declare function declaredSpaceIndex(config: GrapeConfig): {
    spaces: AppliedSpace[];
    acls: Map<string, SpaceAcl | undefined>;
};
