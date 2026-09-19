import { loadGrapeConfig } from "@citrusworx/grapevine";
import { describe, expect, it } from "vitest";
import {
    buildPlanSteps,
    mapDropletSize,
    patchGrapeConfig,
    selectBlueprintPack,
    stackEnvFromWizard,
    wizardTags
} from "./map.js";
import { resolveBlueprintConfigPath, resolveBlueprintPackDir } from "./paths.js";

describe("wizard → grapevine mapping", () => {
    it("selects managed pack only for dedicated databases", () => {
        expect(selectBlueprintPack({ databaseType: "dedicated" })).toBe("kiwipress-managed");
        expect(selectBlueprintPack({ databaseType: "shared" })).toBe("kiwipress-compose");
        expect(selectBlueprintPack({ databaseType: "self-hosted" })).toBe("kiwipress-compose");
        expect(selectBlueprintPack({})).toBe("kiwipress-compose");
    });

    it("maps wizard sizes onto DigitalOcean slugs", () => {
        expect(mapDropletSize("starter")).toBe("s-1vcpu-2gb");
        expect(mapDropletSize("growth")).toBe("s-2vcpu-4gb");
        expect(mapDropletSize("scale")).toBe("s-4vcpu-8gb");
        expect(mapDropletSize("pro")).toBe("s-8vcpu-16gb");
        expect(mapDropletSize("enterprise")).toBe("s-8vcpu-32gb");
        expect(mapDropletSize("unknown")).toBe("s-2vcpu-4gb");
    });

    it("encodes CDN, LB, and blueprint as tags and stack env", () => {
        const snapshot = {
            databaseType: "shared" as const,
            dropletSize: "growth",
            cdnEnabled: true,
            loadBalancer: true,
            sslEnabled: true,
            blueprintId: "blog",
            domainName: "example.com"
        };

        expect(wizardTags(snapshot)).toEqual(
            expect.arrayContaining(["kiwipress", "cdn", "lb", "ssl", "blueprint-blog", "db-shared", "size-growth"])
        );

        expect(stackEnvFromWizard(snapshot)).toMatchObject({
            DOMAIN: "example.com",
            WP_HOST: "wp.example.com",
            KIWIPRESS_CDN: "1",
            KIWIPRESS_LOAD_BALANCER: "1",
            KIWIPRESS_BLUEPRINT: "blog"
        });
    });

    it("patches a real compose pack without a DigitalOcean token", async () => {
        const snapshot = {
            databaseType: "shared",
            dropletSize: "scale",
            region: "sfo3",
            domainName: "press.test",
            cdnEnabled: true,
            loadBalancer: true,
            sslEnabled: true,
            blueprintId: "api",
            backupFrequency: "daily"
        };
        const packId = selectBlueprintPack(snapshot);
        const packDir = resolveBlueprintPackDir(packId);
        const loaded = await loadGrapeConfig(resolveBlueprintConfigPath(packId));
        const { config, warnings } = patchGrapeConfig(loaded, snapshot);
        const { plan, steps } = buildPlanSteps(config, snapshot, packDir, warnings);

        expect(packId).toBe("kiwipress-compose");
        expect(config.region).toBe("sfo3");
        expect(config.resources?.droplets?.[0]).toEqual(
            expect.objectContaining({ size: "s-4vcpu-8gb", region: "sfo3" })
        );
        expect(config.networking?.domain).toBe("press.test");
        expect(config.networking?.cdn).toBe(true);
        expect(warnings.some((warning) => warning.includes("SSH inbound"))).toBe(true);
        expect(plan.resources.some((resource) => resource.kind === "droplet")).toBe(true);
        expect(plan.resources.some((resource) => resource.kind === "stack_step")).toBe(true);
        expect(steps.map((step) => step.id)).toEqual([
            "droplet",
            "docker",
            "stack",
            "db",
            "backup",
            "health",
            "ssl",
            "complete"
        ]);
    });

    it("plans the managed pack when the wizard asks for a dedicated database", async () => {
        const snapshot = { databaseType: "dedicated", dropletSize: "starter", region: "ams3" };
        const packId = selectBlueprintPack(snapshot);
        const packDir = resolveBlueprintPackDir(packId);
        const loaded = await loadGrapeConfig(resolveBlueprintConfigPath(packId));
        const { config } = patchGrapeConfig(loaded, snapshot);
        const { plan, steps } = buildPlanSteps(config, snapshot, packDir);

        expect(packId).toBe("kiwipress-managed");
        expect(plan.counts.databases).toBe(2);
        expect(steps.map((step) => step.id)).toContain("db");
        expect(config.resources?.droplets?.[0]).toEqual(expect.objectContaining({ size: "s-1vcpu-2gb" }));
    });
});
