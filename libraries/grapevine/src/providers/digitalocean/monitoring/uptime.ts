import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export type UptimeCheckType = "ping" | "http" | "https" | (string & {});

export interface UptimeCheckBlueprint {
    name: string;
    type: UptimeCheckType;
    target: string;
    regions: string[];
    enabled?: boolean;
}

export interface UptimeCheck extends UptimeCheckBlueprint {
    id: string;
    enabled: boolean;
}

export async function listUptimeChecks(): Promise<UptimeCheck[]> {
    return doList<UptimeCheck>("/uptime/checks", "checks");
}

export async function getUptimeCheck(id: string): Promise<UptimeCheck> {
    const response = await doRequest<{ check: UptimeCheck }>({
        method: "GET",
        url: `/uptime/checks/${id}`
    });
    return response.check;
}

export async function createUptimeCheck(blueprint: UptimeCheckBlueprint): Promise<UptimeCheck> {
    const response = await doRequest<{ check: UptimeCheck }>({
        method: "POST",
        url: "/uptime/checks",
        data: cleanPayload({
            name: blueprint.name,
            type: blueprint.type,
            target: blueprint.target,
            regions: blueprint.regions,
            enabled: blueprint.enabled ?? true
        })
    });
    return response.check;
}

export async function updateUptimeCheck(id: string, blueprint: UptimeCheckBlueprint): Promise<UptimeCheck> {
    const response = await doRequest<{ check: UptimeCheck }>({
        method: "PUT",
        url: `/uptime/checks/${id}`,
        data: cleanPayload({
            name: blueprint.name,
            type: blueprint.type,
            target: blueprint.target,
            regions: blueprint.regions,
            enabled: blueprint.enabled ?? true
        })
    });
    return response.check;
}

export async function deleteUptimeCheck(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/uptime/checks/${id}`
    });
}
