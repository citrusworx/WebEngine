import { DigitalOceanError, doList, doRequest } from "../client.js";
export async function getContainerRegistry() {
    try {
        const response = await doRequest({
            method: "GET",
            url: "/registry"
        });
        return response.registry ?? null;
    }
    catch (error) {
        if (error instanceof DigitalOceanError && error.status === 404) {
            return null;
        }
        throw error;
    }
}
export async function listRegistryRepositories(registryName) {
    return doList(`/registry/${encodeURIComponent(registryName)}/repositories`, "repositories");
}
//# sourceMappingURL=registry.js.map