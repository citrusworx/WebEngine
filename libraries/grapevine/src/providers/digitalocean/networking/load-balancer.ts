import { parseYAML, client } from "../../../infrastructure/util/utilities.js";
import { cleanPayload } from "../utilities.js";

// Load Balancer Management
//
// 

interface LoadBalancer {
    droplet_ids: number[];
    region: string;
    created_at: string;
    disable_lets_encrypt_dns_records?: boolean;
    domains?: object[];
    enable_backend_keepalive?: boolean;
    forwarding_rules: object[];
    health_check: object;
    id?: string;
    name?: string;
    algorithm?: string;
    redirect_http_to_https?: boolean;
    tag?: string;
}

export async function listAllLoadBalancers(){
    const response = await client.get("/v2/load_balancers");
    return response.data.load_balancers;
}

export async function getLoadBalancer(id: string){
    const response = await client.get(`/v2/load_balancers/${id}`);
    return response.data.load_balancer;
}

export async function createLoadBalancer(blueprint: LoadBalancer){
    const response = await client.post("/v2/load_balancers", blueprint);
    return response.data.load_balancer;
}

export async function listLoadBalancer(id: string){
    const response = await client.get(`/v2/load_balancers/${id}`);
    return response.data.load_balancer;
}

export async function updateLoadBalancer(id: string, blueprint: LoadBalancer){
    const response = await client.put(`/v2/load_balancers/${id}`, blueprint);
    return response.data.load_balancer;
}

export async function deleteLoadBalancer(id: string){
    const response = await client.delete(`/v2/load_balancers/${id}`);
    return response.data;
}

export async function addDropletsToLoadBalancer(droplet_ids: number[], id: string){
    const response = await client.post(`/v2/load_balancers/${id}/droplets`, { droplet_ids });
    return response.data;
}

export async function addForwardingRulesToLoadBalancer(rules: object[], id: string){
    const response = await client.post(`/v2/load_balancers/${id}/forwarding_rules`, { forwarding_rules: rules });
    return response.data;
}

export async function removeDropletsFromLoadBalancer(droplet_ids: number[], id: string){
    const response = await client.delete(`/v2/load_balancers/${id}/droplets`, { data: { droplet_ids } });
    return response.data;
}

export async function removeForwardingRulesFromLoadBalancer(rules: object[], id: string){
    const response = await client.delete(`/v2/load_balancers/${id}/forwarding_rules`, { data: { forwarding_rules: rules } });
    return response.data;
}