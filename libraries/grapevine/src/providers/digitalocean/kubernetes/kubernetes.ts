import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

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
    status?: { state?: string; message?: string };
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
    regions: Array<{ name?: string; slug: string }>;
    sizes: Array<{ name?: string; slug: string }>;
}

export async function listKubernetesClusters(): Promise<KubernetesCluster[]> {
    return doList<KubernetesCluster>("/kubernetes/clusters", "kubernetes_clusters");
}

export async function getKubernetesCluster(id: string): Promise<KubernetesCluster> {
    const response = await doRequest<{ kubernetes_cluster: KubernetesCluster }>({
        method: "GET",
        url: `/kubernetes/clusters/${id}`
    });
    return response.kubernetes_cluster;
}

export async function createKubernetesCluster(
    blueprint: KubernetesClusterBlueprint
): Promise<KubernetesCluster> {
    const response = await doRequest<{ kubernetes_cluster: KubernetesCluster }>({
        method: "POST",
        url: "/kubernetes/clusters",
        data: cleanPayload({
            name: blueprint.name,
            region: blueprint.region,
            version: blueprint.version,
            vpc_uuid: blueprint.vpc_uuid,
            tags: blueprint.tags,
            node_pools: blueprint.node_pools
        })
    });
    return response.kubernetes_cluster;
}

export async function deleteKubernetesCluster(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/kubernetes/clusters/${id}`
    });
}

export async function listNodePools(clusterId: string): Promise<KubernetesNodePool[]> {
    return doList<KubernetesNodePool>(`/kubernetes/clusters/${clusterId}/node_pools`, "node_pools");
}

export async function getNodePool(clusterId: string, poolId: string): Promise<KubernetesNodePool> {
    const response = await doRequest<{ node_pool: KubernetesNodePool }>({
        method: "GET",
        url: `/kubernetes/clusters/${clusterId}/node_pools/${poolId}`
    });
    return response.node_pool;
}

export async function createNodePool(
    clusterId: string,
    pool: KubernetesNodePoolBlueprint
): Promise<KubernetesNodePool> {
    const response = await doRequest<{ node_pool: KubernetesNodePool }>({
        method: "POST",
        url: `/kubernetes/clusters/${clusterId}/node_pools`,
        data: cleanPayload(pool)
    });
    return response.node_pool;
}

export async function deleteNodePool(clusterId: string, poolId: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/kubernetes/clusters/${clusterId}/node_pools/${poolId}`
    });
}

export async function listKubernetesOptions(): Promise<KubernetesOptions> {
    const response = await doRequest<{ options?: Partial<KubernetesOptions> }>({
        method: "GET",
        url: "/kubernetes/options"
    });
    return {
        versions: response.options?.versions ?? [],
        regions: response.options?.regions ?? [],
        sizes: response.options?.sizes ?? []
    };
}
