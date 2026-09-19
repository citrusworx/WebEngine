import type { ApplyResult, DestroyResult, DestroyTarget } from "@citrusworx/grapevine";
import type {
    AppliedDatabaseSummary,
    AppliedDropletSummary,
    ApplySummary,
    BlueprintPackId,
    DestroySummary,
    DestroyTargetSummary
} from "./types.js";

export const LOCAL_SSH_KEY_WARNING =
    "DigitalOcean destroy does not remove local .grape/ssh private key files. Delete the pack key under that path yourself if you no longer need SSH access.";

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

function summarizeTarget(target: DestroyTarget & { error?: string }): DestroyTargetSummary {
    return {
        kind: target.kind,
        name: target.name,
        ...(target.id !== undefined ? { id: target.id } : {}),
        ...(target.reason ? { reason: target.reason } : {}),
        ...(target.error ? { error: target.error } : {})
    };
}

export function summarizeDestroyResult(
    packId: BlueprintPackId,
    result: DestroyResult,
    extras: { region?: string; warnings?: string[] } = {}
): DestroySummary {
    return {
        packId,
        region: extras.region,
        dryRun: Boolean(result.dry_run),
        deleted: result.deleted.map((target) => summarizeTarget(target)),
        skipped: result.skipped.map((target) => summarizeTarget(target)),
        failed: result.failed.map((target) => summarizeTarget(target)),
        warnings: unique([
            ...(result.warnings ?? []),
            ...(extras.warnings ?? []),
            LOCAL_SSH_KEY_WARNING
        ])
    };
}

function unique(values: string[]): string[] {
    return [...new Set(values)];
}
