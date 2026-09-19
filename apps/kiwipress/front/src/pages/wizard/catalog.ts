import type {
    BlueprintId,
    DatabaseType,
    DeploymentMode,
    DropletSize,
    ExperienceProfile,
    RenderingStrategy,
    WizardData
} from "./state";

export const DROPLET_PRICING: Record<DropletSize, number> = {
    starter: 29,
    growth: 59,
    scale: 119,
    pro: 249,
    enterprise: 0
};

export const DATABASE_PRICING: Record<DatabaseType, number> = {
    shared: 0,
    dedicated: 25,
    "self-hosted": 0
};

export const CDN_COST = 15;
export const LOAD_BALANCER_COST = 35;
export const REPLICA_COST = 15;

export type DropletSpec = {
    id: DropletSize;
    title: string;
    price: number | "custom";
    cpu: string;
    ram: string;
    storage: string;
    recommended?: string;
};

export const DROPLET_SPECS: DropletSpec[] = [
    { id: "starter", title: "Starter", price: 29, cpu: "1 vCPU", ram: "2 GB RAM", storage: "50 GB SSD" },
    { id: "growth", title: "Growth", price: 59, cpu: "2 vCPU", ram: "4 GB RAM", storage: "100 GB SSD", recommended: "Recommended" },
    { id: "scale", title: "Scale", price: 119, cpu: "4 vCPU", ram: "8 GB RAM", storage: "200 GB SSD" },
    { id: "pro", title: "Pro", price: 249, cpu: "8 vCPU", ram: "16 GB RAM", storage: "400 GB SSD" },
    { id: "enterprise", title: "Enterprise", price: "custom", cpu: "Custom vCPU", ram: "Custom RAM", storage: "Custom SSD" }
];

export const DROPLET_BASELINE: Record<DropletSize, { ram: number; storage: number; cpu: number }> = {
    starter: { ram: 2, storage: 50, cpu: 1 },
    growth: { ram: 4, storage: 100, cpu: 2 },
    scale: { ram: 8, storage: 200, cpu: 4 },
    pro: { ram: 16, storage: 400, cpu: 8 },
    enterprise: { ram: 16, storage: 500, cpu: 8 }
};

export const REGIONS = [
    { value: "nyc3", label: "New York" },
    { value: "sfo3", label: "San Francisco" },
    { value: "ams3", label: "Amsterdam" },
    { value: "sgp1", label: "Singapore" },
    { value: "lon1", label: "London" },
    { value: "fra1", label: "Frankfurt" }
] as const;

export const REGION_LABELS: Record<string, string> = Object.fromEntries(
    REGIONS.map(region => [region.value, region.label])
);

export type ExperienceDef = {
    id: ExperienceProfile;
    name: string;
    icon: string;
    description: string;
    features: string[];
    technical: {
        renderingStrategy: RenderingStrategy;
        staticGeneration: boolean;
        edgeRendering: boolean;
        cachingStrategy: string;
    };
};

export const EXPERIENCE_PROFILES: ExperienceDef[] = [
    {
        id: "speed",
        name: "Speed",
        icon: "bolt",
        description: "Maximum performance optimization with edge caching and pre-rendering",
        features: ["Static generation where possible", "Edge CDN delivery", "Aggressive caching"],
        technical: { renderingStrategy: "ssg", staticGeneration: true, edgeRendering: true, cachingStrategy: "aggressive" }
    },
    {
        id: "fresh",
        name: "Fresh",
        icon: "wand-magic-sparkles",
        description: "Always up-to-date content delivery with server-side rendering",
        features: ["Real-time content updates", "Server-side rendering", "Smart cache invalidation"],
        technical: { renderingStrategy: "ssr", staticGeneration: false, edgeRendering: false, cachingStrategy: "adaptive" }
    },
    {
        id: "interactive",
        name: "Interactive",
        icon: "chart-line",
        description: "Dynamic application-style experience with client-side interactivity",
        features: ["Rich client interactions", "Hybrid rendering", "App-like experience"],
        technical: { renderingStrategy: "hybrid", staticGeneration: true, edgeRendering: true, cachingStrategy: "selective" }
    }
];

export type BlueprintDef = {
    id: Exclude<BlueprintId, "">;
    title: string;
    description: string;
    icon: string;
    modules: string[];
    recommendedTier: "Growth" | "Scale" | "Pro";
    dropletSize: DropletSize;
    price: number;
};

export const BLUEPRINTS: BlueprintDef[] = [
    {
        id: "blog",
        title: "Content Platform",
        description: "Modern publishing with structured content delivery",
        icon: "file-lines",
        modules: [
            "KiwiPress Performance Runtime",
            "WordPress Content Backend",
            "Structured Theme System",
            "REST & GraphQL APIs",
            "Media Management",
            "SEO Optimization"
        ],
        recommendedTier: "Growth",
        dropletSize: "growth",
        price: 59
    },
    {
        id: "commerce",
        title: "Commerce Platform",
        description: "High-performance e-commerce with content integration",
        icon: "cart-shopping",
        modules: [
            "WooCommerce Content Backend",
            "KiwiPress Frontend Runtime",
            "Product & Cart APIs",
            "Payment Gateway Integration",
            "Order Management",
            "Inventory Tracking"
        ],
        recommendedTier: "Scale",
        dropletSize: "scale",
        price: 119
    },
    {
        id: "api",
        title: "API Platform",
        description: "Pure API backend for custom applications",
        icon: "bolt",
        modules: [
            "Custom API Endpoints",
            "GraphQL Support",
            "Authentication & Authorization",
            "Rate Limiting",
            "Webhooks"
        ],
        recommendedTier: "Growth",
        dropletSize: "growth",
        price: 59
    },
    {
        id: "business",
        title: "Full Suite",
        description: "Complete platform with all performance features",
        icon: "building",
        modules: [
            "All Platform Features",
            "Full Commerce Suite",
            "Multi-Site Management",
            "Advanced Custom Fields",
            "Member Portal",
            "Analytics Integration",
            "CDN & Load Balancing"
        ],
        recommendedTier: "Pro",
        dropletSize: "pro",
        price: 249
    }
];

export const RENDERING_OPTIONS: { value: RenderingStrategy; label: string }[] = [
    { value: "ssr", label: "Server-Side Rendering (SSR)" },
    { value: "ssg", label: "Static Site Generation (SSG)" },
    { value: "csr", label: "Client-Side Rendering (CSR)" },
    { value: "edge", label: "Edge Rendering" },
    { value: "hybrid", label: "Hybrid (SSR + SSG)" }
];

export const CACHING_OPTIONS = [
    { value: "aggressive", label: "Aggressive (Max Performance)" },
    { value: "adaptive", label: "Adaptive (Balanced)" },
    { value: "selective", label: "Selective (Fresh Content)" },
    { value: "minimal", label: "Minimal (Always Fresh)" }
];

export const REBUILD_OPTIONS = [
    { value: "on-demand", label: "On-Demand (Manual)" },
    { value: "webhook", label: "Webhook (Content Update)" },
    { value: "scheduled", label: "Scheduled (Hourly/Daily)" },
    { value: "continuous", label: "Continuous (Real-time)" }
];

export const BACKUP_OPTIONS = [
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily (Recommended)" },
    { value: "weekly", label: "Weekly" }
];

export function modeLabel(mode: DeploymentMode): { title: string; detail: string } {
    return mode === "performance"
        ? { title: "Performance Mode", detail: "KiwiPress Runtime + WordPress Backend" }
        : { title: "Traditional Mode", detail: "Standard WordPress Deployment" };
}

export function titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function monthlyTotal(data: WizardData): number {
    const droplet = DROPLET_PRICING[data.dropletSize];
    const database = DATABASE_PRICING[data.databaseType];
    const cdn = data.cdnEnabled ? CDN_COST : 0;
    const loadBalancer = data.loadBalancer ? LOAD_BALANCER_COST : 0;
    const replicas = data.replicas * REPLICA_COST;
    return droplet + database + cdn + loadBalancer + replicas;
}

export function resolvedDomain(data: WizardData): string {
    if (data.domainName.trim()) return data.domainName.trim();
    return "your-instance.kiwipress.app";
}

export function publicInstanceName(): string {
    return "kiwipress-prod-01";
}
