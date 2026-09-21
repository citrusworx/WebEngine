import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { contentTypeForKey } from "../providers/digitalocean/spaces/content-type.js";
import {
    findMonorepoRoot,
    listDistFiles,
    publishStaticSites,
    resolveStaticSiteBuild,
    resolveStaticSiteCwd,
    syncDistToSpace
} from "./static-publish.js";

describe("static site publish", () => {
    it("maps workspace to a yarn build and resolves cwd", async () => {
        expect(
            resolveStaticSiteBuild({
                name: "juice",
                workspace: "@citrusworx/juiceapp",
                dist: "apps/juice/dist",
                space: "juice-showcase"
            })
        ).toBe("yarn workspace @citrusworx/juiceapp build");
        expect(
            resolveStaticSiteBuild({
                name: "juice",
                build: "yarn workspace @citrusworx/juiceapp build",
                dist: "apps/juice/dist",
                space: "juice-showcase"
            })
        ).toBe("yarn workspace @citrusworx/juiceapp build");

        const root = await mkdtemp(path.join(tmpdir(), "grape-repo-"));
        const nested = path.join(root, "apps", "juice");
        await mkdir(nested, { recursive: true });
        await writeFile(path.join(root, "package.json"), JSON.stringify({ workspaces: ["apps/*"] }));
        expect(findMonorepoRoot(nested)).toBe(root);
        expect(resolveStaticSiteCwd({}, root)).toBe(findMonorepoRoot(process.cwd()) ?? process.cwd());
        expect(resolveStaticSiteCwd({ cwd: "apps/juice" }, root)).toBe(nested);
    });

    it("assigns content types and uploads dist keys", async () => {
        expect(contentTypeForKey("index.html")).toBe("text/html; charset=utf-8");
        expect(contentTypeForKey("assets/app.js")).toBe("text/javascript; charset=utf-8");
        expect(contentTypeForKey("favicon.ico")).toBe("image/x-icon");
        expect(contentTypeForKey("file")).toBe("application/octet-stream");

        const root = await mkdtemp(path.join(tmpdir(), "grape-dist-"));
        const dist = path.join(root, "dist");
        await mkdir(path.join(dist, "assets"), { recursive: true });
        await writeFile(path.join(dist, "index.html"), "<h1>juice</h1>");
        await writeFile(path.join(dist, "assets", "app.js"), "console.log(1)\n");
        const files = await listDistFiles(dist);
        expect(files.map((file) => file.relative)).toEqual(["assets/app.js", "index.html"]);

        const putObject = vi.fn(async () => undefined);
        const listObjects = vi.fn(async () => [
            { key: "index.html" },
            { key: "assets/app.js" },
            { key: "retired.css" }
        ]);
        const deleteObject = vi.fn(async () => undefined);
        const synced = await syncDistToSpace(
            { distDir: dist, bucket: "juice-showcase", region: "nyc3", acl: "public-read", deleteStale: true },
            { putObject, listObjects, deleteObject }
        );
        expect(putObject).toHaveBeenCalledTimes(2);
        expect(putObject).toHaveBeenCalledWith(
            expect.objectContaining({ key: "index.html", contentType: "text/html; charset=utf-8", acl: "public-read" }),
            expect.any(Object)
        );
        expect(deleteObject).toHaveBeenCalledWith("juice-showcase", "nyc3", "retired.css", expect.any(Object));
        expect(synced.uploaded).toEqual(["assets/app.js", "index.html"]);
        expect(synced.deleted).toEqual(["retired.css"]);
    });

    it("runs the injected build and refuses a missing dist or a Space that was not adopted", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "grape-publish-"));
        const runCommand = vi.fn(async () => undefined);
        await expect(
            publishStaticSites(
                [
                    {
                        name: "juice",
                        build: "yarn workspace @citrusworx/juiceapp build",
                        dist: "apps/juice/dist",
                        space: "juice-showcase"
                    }
                ],
                {
                    baseDir: root,
                    spaces: [],
                    requireAppliedSpace: true,
                    fallbackRegion: "nyc3"
                },
                { runCommand }
            )
        ).rejects.toThrow(/not created or adopted/);
        expect(runCommand).not.toHaveBeenCalled();

        const dist = path.join(root, "apps", "juice", "dist");
        await mkdir(dist, { recursive: true });
        await writeFile(path.join(dist, "index.html"), "ok");
        const putObject = vi.fn(async () => undefined);
        const published = await publishStaticSites(
            [
                {
                    name: "juice",
                    workspace: "@citrusworx/juiceapp",
                    dist: "missing-dist",
                    space: "juice-showcase",
                    cwd: root
                }
            ],
            {
                baseDir: root,
                spaces: [{ name: "juice-showcase", region: "nyc3", origin: "juice-showcase.nyc3.digitaloceanspaces.com" }],
                requireAppliedSpace: true
            },
            { runCommand, putObject }
        ).catch((error: unknown) => error);
        expect(runCommand).toHaveBeenCalledWith("yarn workspace @citrusworx/juiceapp build", root);
        expect(published).toBeInstanceOf(Error);
        expect(putObject).not.toHaveBeenCalled();
    });
});
