import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export interface DropletBlueprint {
    name: string;
    region: string;
    size: string;
    image: string | number;
    ssh_keys?: Array<string | number>;
    backups?: boolean;
    backup_policy?: {
        name?: string;
        plan?: string;
        weekday?: string;
        hour?: number;
    };
    ipv6?: boolean;
    monitoring?: boolean;
    tags?: string[];
    user_data?: string;
    volumes?: string[];
    vpc_uuid?: string;
    with_droplet_agent?: boolean;
}

/** YAML document: `{ blueprint: { name, droplet } }` */
export interface DropletBlueprintDocument {
    grapevine?: string;
    provider?: string;
    blueprint: {
        name: string;
        droplet: DropletBlueprint;
    };
}

export interface Droplet {
    name: string;
    droplet: DropletBlueprint;
}

export type DropletBlueprintInput = DropletBlueprint | Droplet | DropletBlueprintDocument;

export function isDropletBlueprintDocument(value: unknown): value is DropletBlueprintDocument {
    if (!value || typeof value !== "object" || !("blueprint" in value)) {
        return false;
    }
    const blueprint = (value as DropletBlueprintDocument).blueprint;
    return Boolean(blueprint && typeof blueprint === "object" && blueprint.droplet);
}

function isDropletWrap(value: DropletBlueprintInput): value is Droplet {
    if (!("droplet" in value) || !value.droplet || typeof value.droplet !== "object") {
        return false;
    }
    return "region" in value.droplet && "size" in value.droplet && "image" in value.droplet;
}

export function resolveDropletBlueprint(input: DropletBlueprintInput): DropletBlueprint {
    if (isDropletBlueprintDocument(input)) {
        return input.blueprint.droplet;
    }
    if (isDropletWrap(input)) {
        return input.droplet;
    }
    return input;
}

export interface DropletResource {
    id: number | undefined;
    name: string;
    memory: number;
    vcpus?: number;
    disk?: number;
    disk_info?: object[];
    locked?: boolean;
    status: string;
    kernel?: object | null;
    created_at?: string;
    features?: string[];
    backup_ids?: number[];
    next_backup_window?: object | null;
    snapshot_ids?: number[];
    image: Record<string, unknown>;
    volume_ids?: string[];
    size: Record<string, unknown>;
    size_slug?: string;
    networks?: Record<string, unknown>;
    region?: Record<string, unknown>;
    tags?: string[];
}

export interface DropletCreateResponse {
    droplet: DropletResource;
    links: {
        actions: object[];
    };
}

export interface AllDroplets {
    per_page?: number;
    page?: number;
    tag_name?: string;
    name?: string;
    type?: string;
}

function dropletPayload(blueprint: DropletBlueprint): Record<string, unknown> {
    return cleanPayload(blueprint);
}

export async function deployByBlueprint(blueprint: string): Promise<DropletResource> {
    const manifest = parseYAML<DropletBlueprintDocument>(blueprint);
    const response = await doRequest<DropletCreateResponse>({
        method: "POST",
        url: "/droplets",
        data: dropletPayload(resolveDropletBlueprint(manifest))
    });
    return response.droplet;
}

export async function getDropletStatus(id: number): Promise<string> {
    const droplet = await getDroplet(id);
    return droplet.status;
}

export async function listAllDroplets(query: AllDroplets = {}): Promise<DropletResource[]> {
    const response = await doRequest<{ droplets: DropletResource[] }>({
        method: "GET",
        url: "/droplets",
        params: cleanPayload(query)
    });
    return response.droplets;
}

export async function getDroplet(id: number): Promise<DropletResource> {
    const response = await doRequest<{ droplet: DropletResource }>({
        method: "GET",
        url: `/droplets/${id}`
    });
    return response.droplet;
}

export async function createDroplet(droplet: DropletBlueprintInput): Promise<DropletResource> {
    const response = await doRequest<DropletCreateResponse>({
        method: "POST",
        url: "/droplets",
        data: dropletPayload(resolveDropletBlueprint(droplet))
    });
    return response.droplet;
}

export async function createDroplets(droplets: DropletBlueprintInput[]): Promise<DropletResource[]> {
    return Promise.all(droplets.map(createDroplet));
}

export async function deleteDropletsByTag(tag: string): Promise<{ message?: string }> {
    return doRequest<{ message?: string }>({
        method: "DELETE",
        url: "/droplets",
        params: { tag_name: tag }
    });
}

export async function NukeDroplet(id: number): Promise<{ message?: string }> {
    return doRequest<{ message?: string }>({
        method: "DELETE",
        url: `/droplets/${id}/destroy_with_associated_resources/dangerous`,
        headers: { "X-Dangerous": "true" }
    });
}

export async function NukeDropletLite(
    id: number,
    resources: {
        reserved_ips?: string[];
        volumes?: string[];
        snapshots?: string[];
        volume_snapshots?: string[];
    }
): Promise<{ message?: string }> {
    return doRequest<{ message?: string }>({
        method: "DELETE",
        url: `/droplets/${id}/destroy_with_associated_resources/selective`,
        data: resources
    });
}

export async function deleteDroplet(id: number): Promise<{ message?: string }> {
    return doRequest<{ message?: string }>({
        method: "DELETE",
        url: `/droplets/${id}`
    });
}

export async function listBackups(id: number): Promise<object[]> {
    const response = await doRequest<{ backups: object[] }>({
        method: "GET",
        url: `/droplets/${id}/backups`
    });
    return response.backups;
}

export async function listBackupPolicy(id: number): Promise<object> {
    const response = await doRequest<{ policy?: object; backup_policy?: object }>({
        method: "GET",
        url: `/droplets/${id}/backups/policy`
    });
    return response.policy ?? response.backup_policy ?? {};
}

export async function listFirewalls(id: number): Promise<object[]> {
    const response = await doRequest<{ firewalls: object[] }>({
        method: "GET",
        url: `/droplets/${id}/firewalls`
    });
    return response.firewalls;
}

export async function listSnapshots(id: number): Promise<object[]> {
    const response = await doRequest<{ snapshots: object[] }>({
        method: "GET",
        url: `/droplets/${id}/snapshots`
    });
    return response.snapshots;
}
