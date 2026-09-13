import fs from "node:fs";
import path from "node:path";
import { doRequest } from "../client.js";

export interface DropletActionsQuery {
    droplet_id: number;
    per_page?: number;
    page?: number;
}

export interface DropletAction {
    id: number;
    status: string;
    type: string;
    started_at: string;
    completed_at: string;
    resource_id: number;
    region: Record<string, unknown>;
    region_slug: string;
}

export async function getDropletActions(
    droplet_id: number,
    query: { per_page?: number; page?: number } = {}
): Promise<DropletAction[]> {
    const response = await doRequest<{ actions: DropletAction[] }>({
        method: "GET",
        url: `/droplets/${droplet_id}/actions`,
        params: query
    });
    return response.actions;
}

export async function getAction(droplet_id: number, action_id: number): Promise<DropletAction> {
    const response = await doRequest<{ action: DropletAction }>({
        method: "GET",
        url: `/droplets/${droplet_id}/actions/${action_id}`
    });
    return response.action;
}

export async function logDropletActions(
    droplet_id: number,
    logPath = path.resolve("deployment-log.txt")
): Promise<DropletAction[]> {
    const actions = await getDropletActions(droplet_id);
    const lines = actions
        .map((action) => `${action.started_at} ${action.type} ${action.status} (${action.id})`)
        .join("\n");
    fs.appendFileSync(logPath, `${lines}\n`, "utf8");
    return actions;
}
