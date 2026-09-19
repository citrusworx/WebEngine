export const INSTANCE = {
    name: "my-wordpress-app",
    region: "NYC3",
    size: "2GB / 1 vCPU",
    droplet: "Basic 2GB",
    provider: "DigitalOcean",
    domain: "myapp.kiwipress.cloud",
    sslExpires: "Mar 14, 2026",
    uptime: "99.97%",
    response: "42ms avg response",
    health: "Healthy"
};

export const FEATURES = [
    { label: "Blog Enabled", icon: "file-lines", description: "Content publishing" },
    { label: "Commerce Enabled", icon: "cart-shopping", description: "Online store" },
    { label: "Authentication Enabled", icon: "key", description: "User accounts" },
    { label: "Global CDN Enabled", icon: "globe", description: "Fast worldwide delivery" }
];

export const MODULES = [
    { name: "API", enabled: true, version: "2.1.4", description: "RESTful and GraphQL endpoints for data access and integrations" },
    { name: "Auth", enabled: true, version: "1.8.2", description: "User authentication, sessions, and role-based access control" },
    { name: "Events", enabled: true, version: "1.3.1", description: "Real-time event streaming and webhook management" },
    { name: "Commerce", enabled: true, version: "3.0.0", description: "Shopping cart, checkout flows, and order management" },
    { name: "Analytics", enabled: false, version: "—", description: "User tracking, conversion metrics, and behavioral insights" },
    { name: "Email", enabled: false, version: "—", description: "Transactional email sending and template management" }
];

export const ADAPTERS = [
    { name: "CMS Adapter", type: "WordPress", version: "2.3.1", description: "Connects WordPress as a structured content source with REST API" },
    { name: "Commerce Adapter", type: "Shopify", version: "1.9.0", description: "Syncs products, inventory, and orders from Shopify storefront" },
    { name: "Storage Adapter", type: "PostgreSQL", version: "14.2", description: "Relational database for structured application data and queries" },
    { name: "Payment Adapter", type: "Stripe", version: "3.1.4", description: "Secure payment processing, subscriptions, and billing management" }
];

export const DEPLOYMENT_CONFIG = [
    { label: "Render Mode", value: "SSR + Edge" },
    { label: "Data Store", value: "PostgreSQL" },
    { label: "Cache Layer", value: "Redis" },
    { label: "Build Mode", value: "Production" }
];

export const COST_LINES = [
    { label: "Infrastructure", value: "$30.00" },
    { label: "Edge + CDN", value: "$8.00" },
    { label: "Data Transfer", value: "$4.50" }
];

export const METRICS = [
    { icon: "server", label: "Hosting Provider", value: "DigitalOcean" },
    { icon: "location-dot", label: "Region", value: "NYC3" },
    { icon: "hard-drive", label: "Droplet Type", value: "Basic 2GB" },
    { icon: "clock", label: "Uptime", value: "99.97%", subtitle: "Last 30 days" }
];

export const USAGE = [
    { icon: "hard-drive", label: "Storage", used: "14.2 GB", total: "25 GB", percent: 56.8, tone: "ok" },
    { icon: "memory", label: "Memory", used: "1.4 GB", total: "2 GB", percent: 70, tone: "info" },
    { icon: "microchip", label: "CPU", used: "0.23 vCPU", total: "1 vCPU", percent: 23, tone: "warm" }
];

export const DEPLOYMENTS = [
    { id: "dep_8x2k9p", date: "Feb 14, 2026 10:32 AM", status: "Success", duration: "2m 14s" },
    { id: "dep_7w1j8n", date: "Feb 13, 2026 3:15 PM", status: "Success", duration: "1m 58s" },
    { id: "dep_6v0h7m", date: "Feb 12, 2026 11:47 AM", status: "Failed", duration: "45s" },
    { id: "dep_5u9g6l", date: "Feb 11, 2026 9:22 AM", status: "Success", duration: "2m 31s" }
];

export const SNAPSHOTS = [
    { date: "Feb 14, 2026 2:07 AM", size: "2.4 GB" },
    { date: "Feb 13, 2026 2:05 AM", size: "2.3 GB" },
    { date: "Feb 12, 2026 2:03 AM", size: "2.3 GB" }
];

export const BLUEPRINTS = [
    {
        name: "Blog Platform",
        description: "High-performance content publishing with WordPress CMS integration",
        icon: "file-lines",
        modules: ["API", "Auth", "Events", "Analytics"],
        deployment: "SSR + Edge CDN",
        resources: "1GB RAM / 1 vCPU",
        estimate: "$15/mo"
    },
    {
        name: "Headless Commerce",
        description: "Full-featured e-commerce with Shopify integration and payment processing",
        icon: "cart-shopping",
        modules: ["API", "Auth", "Commerce", "Payment", "Events"],
        deployment: "SSR + Edge + CDN",
        resources: "2GB RAM / 1 vCPU",
        estimate: "$30/mo"
    },
    {
        name: "SaaS Starter",
        description: "Complete SaaS foundation with authentication, billing, and user management",
        icon: "layer-group",
        modules: ["API", "Auth", "Billing", "Email", "Analytics"],
        deployment: "SSR + Edge",
        resources: "2GB RAM / 2 vCPU",
        estimate: "$30/mo"
    },
    {
        name: "Content + Commerce Hybrid",
        description: "Editorial content with integrated shopping experiences",
        icon: "box",
        modules: ["API", "Auth", "Commerce", "Events", "Analytics", "Payment"],
        deployment: "SSR + Edge + CDN",
        resources: "4GB RAM / 2 vCPU",
        estimate: "$60/mo"
    }
];

export const PLANS = [
    { id: "starter" as const, name: "Starter", price: 15, features: ["1 GB RAM", "1 vCPU", "25 GB SSD", "1 TB Transfer", "Daily Backups"] },
    { id: "pro" as const, name: "Pro", price: 30, features: ["2 GB RAM", "1 vCPU", "50 GB SSD", "2 TB Transfer", "Daily Backups", "Priority Support"] },
    { id: "scale" as const, name: "Scale", price: 60, features: ["4 GB RAM", "2 vCPU", "100 GB SSD", "4 TB Transfer", "Hourly Backups", "Priority Support", "Custom Domain"] }
];

export const INVOICES = [
    { id: "INV-2026-002", date: "Feb 1, 2026", amount: "$30.00", status: "Paid" },
    { id: "INV-2026-001", date: "Jan 1, 2026", amount: "$30.00", status: "Paid" },
    { id: "INV-2025-012", date: "Dec 1, 2025", amount: "$30.00", status: "Paid" },
    { id: "INV-2025-011", date: "Nov 1, 2025", amount: "$15.00", status: "Paid" }
];

export type ActivityTone = "success" | "error" | "warning" | "info";

export const ACTIVITIES: Array<{
    id: number;
    message: string;
    time: string;
    status: ActivityTone;
    icon: string;
}> = [
    { id: 1, message: "Deployment dep_8x2k9p completed successfully", time: "2 hours ago", status: "success", icon: "circle-check" },
    { id: 2, message: "Application restarted", time: "5 hours ago", status: "info", icon: "rotate" },
    { id: 3, message: "New version deployed", time: "1 day ago", status: "success", icon: "upload" },
    { id: 4, message: "Deployment dep_6v0h7m failed", time: "2 days ago", status: "error", icon: "circle-xmark" },
    { id: 5, message: "SSL certificate renewed automatically", time: "3 days ago", status: "success", icon: "circle-check" },
    { id: 6, message: "Deployment dep_5u9g6l completed successfully", time: "3 days ago", status: "success", icon: "circle-check" },
    { id: 7, message: "High memory usage detected (85%)", time: "4 days ago", status: "warning", icon: "circle-exclamation" },
    { id: 8, message: "Scheduled maintenance completed", time: "5 days ago", status: "info", icon: "power-off" }
];

export const YAML_VERSIONS = [
    { version: "2.1.0", date: "Feb 14, 2026 10:32 AM", author: "John Doe", current: true },
    { version: "2.0.8", date: "Feb 10, 2026 3:15 PM", author: "John Doe", current: false },
    { version: "2.0.7", date: "Feb 5, 2026 9:22 AM", author: "John Doe", current: false }
];

export const YAML_CONTENT = `# KiwiPress Cloud Configuration
# Version: 2.1.0 | Last modified: Feb 14, 2026 10:32 AM
name: my-wordpress-app
version: 2.1.0

infrastructure:
  provider: digitalocean
  region: nyc3
  droplet:
    size: basic-2gb
    vcpus: 1
    memory: 2048
    disk: 50

modules:
  - name: api
    version: 2.1.4
    enabled: true
  - name: auth
    version: 1.8.2
    enabled: true
  - name: events
    version: 1.3.1
    enabled: true
  - name: commerce
    version: 3.0.0
    enabled: true

adapters:
  cms:
    type: wordpress
    version: 2.3.1
  commerce:
    type: shopify
    version: 1.9.0
  storage:
    type: postgresql
    version: 14.2
  payment:
    type: stripe
    version: 3.1.4

deployment:
  render_mode: ssr
  edge_enabled: true
  cache_layer: redis
  auto_deploy: true
  ssl_enabled: true

environment:
  NODE_ENV: production
  API_TIMEOUT: 30000
  MAX_UPLOAD_SIZE: 10485760`;
