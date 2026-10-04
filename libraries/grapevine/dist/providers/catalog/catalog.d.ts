export declare const CATALOG_SCHEMA_VERSION: 1;
export declare const CATALOG_OPERATIONS: readonly ["list", "get", "create", "update", "delete"];
export type CatalogOperation = (typeof CATALOG_OPERATIONS)[number];
export type ProductMaturity = "implemented" | "partial" | "missing";
/**
 * One product area inside a provider catalog.
 * `operations` lists HTTP helpers that exist and perform that call.
 * A stub or a missing function is omitted. `grape_yaml_apply` is true only
 * when `applyGrapeConfig` creates or adopts the resource from grape YAML.
 */
export interface CatalogProduct {
    id: string;
    name: string;
    maturity: ProductMaturity;
    operations: CatalogOperation[];
    grape_yaml_apply: boolean;
    auth_env: string[];
    notes: string;
}
/**
 * Dashboard contract for one cloud. A second provider is another object
 * with this shape. This package ships only DigitalOcean.
 */
export interface ProviderCatalog<Id extends string = string> {
    schema_version: typeof CATALOG_SCHEMA_VERSION;
    provider_id: Id;
    name: string;
    implemented: boolean;
    api_base: string;
    auth: {
        token_env: string;
        spaces_access_key_env?: string;
        spaces_secret_key_env?: string;
    };
    extension_point: string;
    products: CatalogProduct[];
}
export declare const digitalOceanCatalog: ProviderCatalog<"digitalocean">;
/** Every implemented provider. Today this is only DigitalOcean. */
export declare function listProviderCatalogs(): Array<ProviderCatalog>;
export declare function formatProviderCatalog(catalog?: ProviderCatalog): string;
