import { doRequest } from "../client.js";

export interface MetricSample {
    metric: Record<string, string>;
    values: Array<[number, string]>;
}

export interface MetricSeries {
    metric: string;
    /** True when DigitalOcean documents that the monitoring agent must be installed. */
    agent_required: boolean;
    result: MetricSample[];
}

export interface MetricWindow {
    hostId: string | number;
    start: number;
    end: number;
}

export interface DropletTelemetry {
    host_id: string;
    start: number;
    end: number;
    bandwidth_public_inbound: MetricSeries;
    bandwidth_public_outbound: MetricSeries;
    cpu: MetricSeries;
    memory_available: MetricSeries;
    memory_total: MetricSeries;
}

export const METRIC_AGENT_NOTES = {
    bandwidth:
        "Droplet bandwidth is a hypervisor metric. It does not require the DigitalOcean monitoring agent.",
    cpu: "Droplet CPU metrics are empty unless the droplet was created with the monitoring agent (monitoring: true).",
    memory:
        "Droplet memory metrics are empty unless the droplet was created with the monitoring agent (monitoring: true)."
} as const;

interface MetricResponse {
    status?: string;
    data?: { resultType?: string; result?: MetricSample[] };
}

export function defaultMetricWindow(nowMs = Date.now()): { start: number; end: number } {
    const end = Math.floor(nowMs / 1000);
    return { start: end - 3600, end };
}

async function readMetric(url: string, params: Record<string, string | number>): Promise<MetricSample[]> {
    const response = await doRequest<MetricResponse>({
        method: "GET",
        url,
        params
    });
    return response.data?.result ?? [];
}

export async function getDropletBandwidth(
    query: MetricWindow & { direction: "inbound" | "outbound"; iface?: "public" | "private" }
): Promise<MetricSeries> {
    const result = await readMetric("/monitoring/metrics/droplet/bandwidth", {
        host_id: query.hostId,
        interface: query.iface ?? "public",
        direction: query.direction,
        start: query.start,
        end: query.end
    });
    return { metric: "bandwidth", agent_required: false, result };
}

export async function getDropletCpu(query: MetricWindow): Promise<MetricSeries> {
    const result = await readMetric("/monitoring/metrics/droplet/cpu", {
        host_id: query.hostId,
        start: query.start,
        end: query.end
    });
    return { metric: "cpu", agent_required: true, result };
}

export async function getDropletMemoryAvailable(query: MetricWindow): Promise<MetricSeries> {
    const result = await readMetric("/monitoring/metrics/droplet/memory_available", {
        host_id: query.hostId,
        start: query.start,
        end: query.end
    });
    return { metric: "memory_available", agent_required: true, result };
}

export async function getDropletMemoryTotal(query: MetricWindow): Promise<MetricSeries> {
    const result = await readMetric("/monitoring/metrics/droplet/memory_total", {
        host_id: query.hostId,
        start: query.start,
        end: query.end
    });
    return { metric: "memory_total", agent_required: true, result };
}

export async function getDropletTelemetry(
    hostId: string | number,
    window: { start?: number; end?: number; nowMs?: number } = {}
): Promise<DropletTelemetry> {
    const defaults = defaultMetricWindow(window.nowMs);
    const start = window.start ?? defaults.start;
    const end = window.end ?? defaults.end;
    const query = { hostId, start, end };
    const [inbound, outbound, cpu, memoryAvailable, memoryTotal] = await Promise.all([
        getDropletBandwidth({ ...query, direction: "inbound", iface: "public" }),
        getDropletBandwidth({ ...query, direction: "outbound", iface: "public" }),
        getDropletCpu(query),
        getDropletMemoryAvailable(query),
        getDropletMemoryTotal(query)
    ]);
    return {
        host_id: String(hostId),
        start,
        end,
        bandwidth_public_inbound: inbound,
        bandwidth_public_outbound: outbound,
        cpu,
        memory_available: memoryAvailable,
        memory_total: memoryTotal
    };
}
