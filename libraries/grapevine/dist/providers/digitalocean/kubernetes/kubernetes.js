import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listKubernetesClusters() {
    return doList("/kubernetes/clusters", "kubernetes_clusters");
}
export async function getKubernetesCluster(id) {
    const response = await doRequest({
        method: "GET",
        url: `/kubernetes/clusters/${id}`
    });
    return response.kubernetes_cluster;
}
export async function createKubernetesCluster(blueprint) {
    const response = await doRequest({
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
export async function deleteKubernetesCluster(id) {
    await doRequest({
        method: "DELETE",
        url: `/kubernetes/clusters/${id}`
    });
}
export async function listNodePools(clusterId) {
    return doList(`/kubernetes/clusters/${clusterId}/node_pools`, "node_pools");
}
export async function getNodePool(clusterId, poolId) {
    const response = await doRequest({
        method: "GET",
        url: `/kubernetes/clusters/${clusterId}/node_pools/${poolId}`
    });
    return response.node_pool;
}
export async function createNodePool(clusterId, pool) {
    const response = await doRequest({
        method: "POST",
        url: `/kubernetes/clusters/${clusterId}/node_pools`,
        data: cleanPayload(pool)
    });
    return response.node_pool;
}
export async function deleteNodePool(clusterId, poolId) {
    await doRequest({
        method: "DELETE",
        url: `/kubernetes/clusters/${clusterId}/node_pools/${poolId}`
    });
}
export async function listKubernetesOptions() {
    const response = await doRequest({
        method: "GET",
        url: "/kubernetes/options"
    });
    return {
        versions: response.options?.versions ?? [],
        regions: response.options?.regions ?? [],
        sizes: response.options?.sizes ?? []
    };
}
//# sourceMappingURL=kubernetes.js.map