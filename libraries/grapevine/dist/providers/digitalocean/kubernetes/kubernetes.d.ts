export interface KubernetesNodePoolBlueprint {
    name: string;
    size: string;
    count: number;
    tags?: string[];
}
export interface KubernetesNodePool extends KubernetesNodePoolBlueprint {
    id?: string;
}
export interface KubernetesClusterBlueprint {
    name: string;
    region: string;
    version: string;
    vpc_uuid?: string;
    tags?: string[];
    node_pools: KubernetesNodePoolBlueprint[];
}
export interface KubernetesCluster {
    id: string;
    name: string;
    region: string;
    version: string;
    vpc_uuid?: string;
    tags?: string[];
    status?: {
        state?: string;
        message?: string;
    };
    node_pools?: KubernetesNodePool[];
    created_at?: string;
    updated_at?: string;
}
export interface KubernetesVersionOption {
    slug: string;
    kubernetes_version?: string;
}
export interface KubernetesOptions {
    versions: KubernetesVersionOption[];
    regions: Array<{
        name?: string;
        slug: string;
    }>;
    sizes: Array<{
        name?: string;
        slug: string;
    }>;
}
export declare function listKubernetesClusters(): Promise<KubernetesCluster[]>;
export declare function getKubernetesCluster(id: string): Promise<KubernetesCluster>;
export declare function createKubernetesCluster(blueprint: KubernetesClusterBlueprint): Promise<KubernetesCluster>;
export declare function deleteKubernetesCluster(id: string): Promise<void>;
export declare function listNodePools(clusterId: string): Promise<KubernetesNodePool[]>;
export declare function getNodePool(clusterId: string, poolId: string): Promise<KubernetesNodePool>;
export declare function createNodePool(clusterId: string, pool: KubernetesNodePoolBlueprint): Promise<KubernetesNodePool>;
export declare function deleteNodePool(clusterId: string, poolId: string): Promise<void>;
export declare function listKubernetesOptions(): Promise<KubernetesOptions>;
