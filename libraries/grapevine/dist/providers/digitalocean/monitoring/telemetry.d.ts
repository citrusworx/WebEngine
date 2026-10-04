import { type AlertPolicy } from "./monitoring.js";
import { type DropletTelemetry } from "./metrics.js";
import { type UptimeCheck } from "./uptime.js";
export interface TelemetryReport {
    alert_policies: AlertPolicy[];
    uptime_checks: UptimeCheck[];
    droplet: DropletTelemetry | null;
    notes: string[];
}
export declare function fetchTelemetry(options?: {
    dropletId?: string | number;
    start?: number;
    end?: number;
    nowMs?: number;
}): Promise<TelemetryReport>;
