import { type DatabaseOptions } from "../databases/databases.js";
import { type ImageResource } from "../images/images.js";
import { type KubernetesOptions } from "../kubernetes/kubernetes.js";
export interface RegionOffering {
    slug: string;
    name: string;
    sizes?: string[];
    available?: boolean;
    features?: string[];
}
export interface SizeOffering {
    slug: string;
    available?: boolean;
    memory?: number;
    vcpus?: number;
    disk?: number;
    transfer?: number;
    price_monthly?: number;
    price_hourly?: number;
    regions?: string[];
    description?: string;
}
export interface DigitalOceanOfferings {
    regions: RegionOffering[];
    sizes: SizeOffering[];
    images: ImageResource[];
    database_options: DatabaseOptions;
    kubernetes_options: KubernetesOptions;
}
export declare function listRegions(): Promise<RegionOffering[]>;
export declare function listSizes(): Promise<SizeOffering[]>;
export declare function fetchDigitalOceanOfferings(): Promise<DigitalOceanOfferings>;
export declare function formatOfferings(offerings: DigitalOceanOfferings): string;
