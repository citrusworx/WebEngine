import { doList } from "../client.js";
import { listDatabaseOptions, type DatabaseOptions } from "../databases/databases.js";
import { listPublicImages, type ImageResource } from "../images/images.js";
import { listKubernetesOptions, type KubernetesOptions } from "../kubernetes/kubernetes.js";

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

export async function listRegions(): Promise<RegionOffering[]> {
    return doList<RegionOffering>("/regions", "regions");
}

export async function listSizes(): Promise<SizeOffering[]> {
    return doList<SizeOffering>("/sizes", "sizes");
}

export async function fetchDigitalOceanOfferings(): Promise<DigitalOceanOfferings> {
    const [regions, sizes, images, database_options, kubernetes_options] = await Promise.all([
        listRegions(),
        listSizes(),
        listPublicImages(),
        listDatabaseOptions(),
        listKubernetesOptions()
    ]);
    return { regions, sizes, images, database_options, kubernetes_options };
}

export function formatOfferings(offerings: DigitalOceanOfferings): string {
    const lines: string[] = [
        "DigitalOcean offerings  (live API, read-only)",
        "",
        `Regions (${offerings.regions.length})`
    ];
    if (offerings.regions.length === 0) {
        lines.push("  (none)");
    } else {
        for (const region of offerings.regions) {
            const available = region.available === false ? "  unavailable" : "";
            lines.push(`  ${region.slug.padEnd(8)}  ${region.name}${available}`);
        }
    }

    lines.push("", `Sizes (${offerings.sizes.length})`);
    if (offerings.sizes.length === 0) {
        lines.push("  (none)");
    } else {
        for (const size of offerings.sizes) {
            const memory = size.memory !== undefined ? `${size.memory} MB` : "";
            const price = size.price_monthly !== undefined ? `$${size.price_monthly}/mo` : "";
            lines.push(`  ${size.slug.padEnd(22)}  ${memory.padEnd(10)}  ${price}`);
        }
    }

    lines.push("", `Public images (${offerings.images.length})`);
    if (offerings.images.length === 0) {
        lines.push("  (none)");
    } else {
        for (const image of offerings.images) {
            const slug = image.slug ?? image.name;
            lines.push(`  ${slug.padEnd(28)}  ${image.distribution ?? ""}`);
        }
    }

    const engines = Object.keys(offerings.database_options);
    lines.push("", `Database engines (${engines.length})`);
    if (engines.length === 0) {
        lines.push("  (none)");
    } else {
        for (const engine of engines) {
            const versions = offerings.database_options[engine]?.versions?.join(", ") ?? "";
            lines.push(`  ${engine.padEnd(12)}  ${versions}`);
        }
    }

    const versions = offerings.kubernetes_options.versions.map((version) => version.slug);
    lines.push("", `Kubernetes versions (${versions.length})`);
    if (versions.length === 0) {
        lines.push("  (none)");
    } else {
        for (const version of versions) {
            lines.push(`  ${version}`);
        }
    }

    lines.push("", "Full payloads: grape offerings --json");
    return lines.join("\n");
}
