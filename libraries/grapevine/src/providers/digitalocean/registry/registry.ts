import { DigitalOceanError, doList, doRequest } from "../client.js";

/** One container registry per DigitalOcean team. */
export interface ContainerRegistry {
    name: string;
    created_at?: string;
    region?: string;
    storage_usage_bytes?: number;
    storage_usage_bytes_updated_at?: string;
}

export interface RegistryRepository {
    registry_name?: string;
    name: string;
    latest_tag?: { tag?: string; compressed_size_bytes?: number };
    tag_count?: number;
}

export async function getContainerRegistry(): Promise<ContainerRegistry | null> {
    try {
        const response = await doRequest<{ registry: ContainerRegistry }>({
            method: "GET",
            url: "/registry"
        });
        return response.registry ?? null;
    } catch (error) {
        if (error instanceof DigitalOceanError && error.status === 404) {
            return null;
        }
        throw error;
    }
}

export async function listRegistryRepositories(registryName: string): Promise<RegistryRepository[]> {
    return doList<RegistryRepository>(`/registry/${encodeURIComponent(registryName)}/repositories`, "repositories");
}
