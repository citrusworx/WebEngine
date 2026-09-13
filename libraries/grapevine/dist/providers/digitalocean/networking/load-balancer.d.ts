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
export declare function listAllLoadBalancers(): Promise<LoadBalancerResource[]>;
export declare function getLoadBalancer(id: string): Promise<LoadBalancerResource>;
export declare function createLoadBalancer(blueprint: LoadBalancer): Promise<LoadBalancerResource>;
export declare function listLoadBalancer(id: string): Promise<LoadBalancerResource>;
export declare function updateLoadBalancer(id: string, blueprint: LoadBalancer): Promise<LoadBalancerResource>;
export declare function deleteLoadBalancer(id: string): Promise<void>;
export declare function addDropletsToLoadBalancer(droplet_ids: number[], id: string): Promise<void>;
export declare function addForwardingRulesToLoadBalancer(rules: object[], id: string): Promise<void>;
export declare function removeDropletsFromLoadBalancer(droplet_ids: number[], id: string): Promise<void>;
export declare function removeForwardingRulesFromLoadBalancer(rules: object[], id: string): Promise<void>;
