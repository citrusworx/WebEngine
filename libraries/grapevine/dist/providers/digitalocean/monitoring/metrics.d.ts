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
export declare const METRIC_AGENT_NOTES: {
    readonly bandwidth: "Droplet bandwidth is a hypervisor metric. It does not require the DigitalOcean monitoring agent.";
    readonly cpu: "Droplet CPU metrics are empty unless the droplet was created with the monitoring agent (monitoring: true).";
    readonly memory: "Droplet memory metrics are empty unless the droplet was created with the monitoring agent (monitoring: true).";
};
export declare function defaultMetricWindow(nowMs?: number): {
    start: number;
    end: number;
};
export declare function getDropletBandwidth(query: MetricWindow & {
    direction: "inbound" | "outbound";
    iface?: "public" | "private";
}): Promise<MetricSeries>;
export declare function getDropletCpu(query: MetricWindow): Promise<MetricSeries>;
export declare function getDropletMemoryAvailable(query: MetricWindow): Promise<MetricSeries>;
export declare function getDropletMemoryTotal(query: MetricWindow): Promise<MetricSeries>;
export declare function getDropletTelemetry(hostId: string | number, window?: {
    start?: number;
    end?: number;
    nowMs?: number;
}): Promise<DropletTelemetry>;
