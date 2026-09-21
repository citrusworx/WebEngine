import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { copyBlueprint, listBlueprints, resolveBlueprint, resolveBlueprintsDir } from "./init.js";
import { CliError } from "./errors.js";

describe("grape init blueprints", () => {
    it("lists packaged 01–04 blueprints", async () => {
        const dir = resolveBlueprintsDir();
        const blueprints = await listBlueprints(dir);
        expect(blueprints.map((item) => item.id)).toEqual([
            "01-vpc-and-tag",
            "02-droplet-in-vpc",
            "03-web-firewall",
            "04-full-web-stack",
            "05-static-site-spaces",
            "kiwipress-compose",
            "kiwipress-managed"
        ]);
        expect(dir.replaceAll("\\", "/")).toMatch(/examples\/blueprints$/);
    });

    it("resolves numeric and alias ids", async () => {
        const blueprints = await listBlueprints();
        expect(resolveBlueprint("01", blueprints).id).toBe("01-vpc-and-tag");
        expect(resolveBlueprint("02-droplet-in-vpc.yaml", blueprints).id).toBe("02-droplet-in-vpc");
        expect(resolveBlueprint("full", blueprints).id).toBe("04-full-web-stack");
        expect(() => resolveBlueprint("nope", blueprints)).toThrow(CliError);
    });

    it("copies a blueprint and refuses overwrite without --force", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "grape-init-"));
        const dest = path.join(dir, "grape.config.yaml");
        const first = await copyBlueprint({ query: "01", out: dest });
        const body = await readFile(first.dest, "utf8");
        expect(body).toContain("provider: digitalocean");
        expect(body).toContain("name: grapevine");

        await expect(copyBlueprint({ query: "01", out: dest })).rejects.toThrow(/--force/);

        await writeFile(dest, "stale\n", "utf8");
        const second = await copyBlueprint({ query: "02", out: dest, force: true });
        expect(second.blueprint.id).toBe("02-droplet-in-vpc");
        expect(await readFile(dest, "utf8")).toContain("grapevine-web-01");
    });

    it("copies a kiwipress pack directory", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "grape-init-pack-"));
        const dest = path.join(dir, "kiwipress-compose");
        const copied = await copyBlueprint({ query: "kiwipress-compose", out: dest });
        expect(copied.blueprint.kind).toBe("pack");
        expect(copied.configPath).toBe(path.join(dest, "grape.config.yaml"));
        const body = await readFile(copied.configPath, "utf8");
        expect(body).toContain("stack:");
        expect(body).toContain("kiwipress-01");
        await expect(copyBlueprint({ query: "compose", out: dest })).rejects.toThrow(/--force/);
    });
});
