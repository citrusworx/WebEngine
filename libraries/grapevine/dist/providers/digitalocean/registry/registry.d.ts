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
    latest_tag?: {
        tag?: string;
        compressed_size_bytes?: number;
    };
    tag_count?: number;
}
export declare function getContainerRegistry(): Promise<ContainerRegistry | null>;
export declare function listRegistryRepositories(registryName: string): Promise<RegistryRepository[]>;
