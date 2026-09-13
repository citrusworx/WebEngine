import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export interface LoadBalancer {
    droplet_ids?: number[];
    region?: string;
    created_at?: string;
    disable_lets_encrypt_dns_records?: boolean;
    domains?: object[];
    enable_backend_keepalive?: boolean;
    forwarding_rules?: object[];
    health_check?: object;
    id?: string;
    name?: string;
    algorithm?: string;
    redirect_http_to_https?: boolean;
    tag?: string;
    vpc_uuid?: string;
    size?: string;
    size_unit?: number;
    type?: string;
    project_id?: string;
}

export type LoadBalancerBlueprint = LoadBalancer;

export interface LoadBalancerResource extends LoadBalancer {
    id: string;
    status?: string;
    ip?: string;
}

export async function listAllLoadBalancers(): Promise<LoadBalancerResource[]> {
    const response = await doRequest<{ load_balancers: LoadBalancerResource[] }>({
        method: "GET",
        url: "/load_balancers"
    });
    return response.load_balancers;
}

export async function getLoadBalancer(id: string): Promise<LoadBalancerResource> {
    const response = await doRequest<{ load_balancer: LoadBalancerResource }>({
        method: "GET",
        url: `/load_balancers/${id}`
    });
    return response.load_balancer;
}

export async function createLoadBalancer(blueprint: LoadBalancer): Promise<LoadBalancerResource> {
    const response = await doRequest<{ load_balancer: LoadBalancerResource }>({
        method: "POST",
        url: "/load_balancers",
        data: cleanPayload(blueprint)
    });
    return response.load_balancer;
}

export async function listLoadBalancer(id: string): Promise<LoadBalancerResource> {
    return getLoadBalancer(id);
}

export async function updateLoadBalancer(id: string, blueprint: LoadBalancer): Promise<LoadBalancerResource> {
    const response = await doRequest<{ load_balancer: LoadBalancerResource }>({
        method: "PUT",
        url: `/load_balancers/${id}`,
        data: cleanPayload(blueprint)
    });
    return response.load_balancer;
}

export async function deleteLoadBalancer(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/load_balancers/${id}`
    });
}

export async function addDropletsToLoadBalancer(droplet_ids: number[], id: string): Promise<void> {
    await doRequest<void>({
        method: "POST",
        url: `/load_balancers/${id}/droplets`,
        data: { droplet_ids }
    });
}

export async function addForwardingRulesToLoadBalancer(rules: object[], id: string): Promise<void> {
    await doRequest<void>({
        method: "POST",
        url: `/load_balancers/${id}/forwarding_rules`,
        data: { forwarding_rules: rules }
    });
}

export async function removeDropletsFromLoadBalancer(droplet_ids: number[], id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/load_balancers/${id}/droplets`,
        data: { droplet_ids }
    });
}

export async function removeForwardingRulesFromLoadBalancer(rules: object[], id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/load_balancers/${id}/forwarding_rules`,
        data: { forwarding_rules: rules }
    });
}
