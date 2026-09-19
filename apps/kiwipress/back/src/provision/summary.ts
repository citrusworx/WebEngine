import type { ApplyResult } from "@citrusworx/grapevine";
import type { AppliedDatabaseSummary, AppliedDropletSummary, ApplySummary, BlueprintPackId } from "./types.js";

type NetworkV4 = {
    ip_address?: string;
    type?: string;
};

export function dropletPublicIp(droplet: ApplyResult["droplets"][number]): string | undefined {
    const networks = droplet.networks as { v4?: NetworkV4[] } | undefined;
    const v4 = Array.isArray(networks?.v4) ? networks.v4 : [];
    const pub = v4.find((entry) => entry.type === "public") ?? v4[0];
    return pub?.ip_address;
}

export function summarizeApplyResult(
    packId: BlueprintPackId,
    result: ApplyResult,
    extras: { region?: string; domain?: string; warnings?: string[] } = {}
): ApplySummary {
    const droplets: AppliedDropletSummary[] = result.droplets.map((droplet) => ({
        id: droplet.id,
        name: droplet.name,
        ip: dropletPublicIp(droplet),
        status: droplet.status
    }));

    const databases: AppliedDatabaseSummary[] = result.databases.map((database) => ({
        id: database.id,
        name: database.name,
        host: database.host,
        status: database.status
    }));

    return {
        packId,
        region: extras.region,
        domain: extras.domain ?? result.domains[0]?.name,
        droplets,
        databases,
        warnings: [...(result.warnings ?? []), ...(extras.warnings ?? [])]
    };
}
