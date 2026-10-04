import { listAlertPolicies, type AlertPolicy } from "./monitoring.js";
import { getDropletTelemetry, METRIC_AGENT_NOTES, type DropletTelemetry } from "./metrics.js";
import { listUptimeChecks, type UptimeCheck } from "./uptime.js";

export interface TelemetryReport {
    alert_policies: AlertPolicy[];
    uptime_checks: UptimeCheck[];
    droplet: DropletTelemetry | null;
    notes: string[];
}

export async function fetchTelemetry(options: {
    dropletId?: string | number;
    start?: number;
    end?: number;
    nowMs?: number;
} = {}): Promise<TelemetryReport> {
    const [alert_policies, uptime_checks, droplet] = await Promise.all([
        listAlertPolicies(),
        listUptimeChecks(),
        options.dropletId !== undefined
            ? getDropletTelemetry(options.dropletId, {
                  start: options.start,
                  end: options.end,
                  nowMs: options.nowMs
              })
            : Promise.resolve(null)
    ]);

    const notes = [
        "Auth: export DO_TOKEN. The token is sent as a Bearer header and is not part of this report.",
        METRIC_AGENT_NOTES.bandwidth,
        METRIC_AGENT_NOTES.cpu,
        METRIC_AGENT_NOTES.memory,
        "Uptime check state alerts are a separate API and are not listed here.",
        "Pass a droplet id to include bandwidth, CPU, and memory for the last hour (or --start/--end)."
    ];

    return { alert_policies, uptime_checks, droplet, notes };
}
