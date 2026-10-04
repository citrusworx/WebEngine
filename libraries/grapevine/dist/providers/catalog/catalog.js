export const CATALOG_SCHEMA_VERSION = 1;
export const CATALOG_OPERATIONS = ["list", "get", "create", "update", "delete"];
const DO_TOKEN = ["DO_TOKEN"];
const SPACES_KEYS = ["DO_SPACES_ACCESS_KEY_ID", "DO_SPACES_SECRET_ACCESS_KEY"];
export const digitalOceanCatalog = {
    schema_version: CATALOG_SCHEMA_VERSION,
    provider_id: "digitalocean",
    name: "DigitalOcean",
    implemented: true,
    api_base: "https://api.digitalocean.com/v2",
    auth: {
        token_env: "DO_TOKEN",
        spaces_access_key_env: "DO_SPACES_ACCESS_KEY_ID",
        spaces_secret_key_env: "DO_SPACES_SECRET_ACCESS_KEY"
    },
    extension_point: "Add another ProviderCatalog with schema_version 1. No second provider is implemented. AWS and GCP are not represented here.",
    products: [
        {
            id: "droplets",
            name: "Droplets",
            maturity: "implemented",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Create, list, get, and delete. Unique-name adopt on apply. No resize, rename, or rebuild. Droplet snapshot creation (actions) is not wrapped; listBackups and listSnapshots exist."
        },
        {
            id: "volumes",
            name: "Volumes",
            maturity: "partial",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Unattached volume create/list/get/delete. Apply adopts a unique name in the target region and does not resize or attach. Attach, detach, and resize actions are not wrapped."
        },
        {
            id: "volume_snapshots",
            name: "Volume snapshots",
            maturity: "partial",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "listVolumeSnapshots, createVolumeSnapshot, getVolumeSnapshot, and deleteVolumeSnapshot. Not a grape YAML resource."
        },
        {
            id: "kubernetes",
            name: "Kubernetes (DOKS)",
            maturity: "partial",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Cluster list/get/create/delete plus node pool list/get/create/delete. Apply creates a cluster with its initial node pools, or adopts a unique name and does not reconcile pools. No kubeconfig download, upgrade, recycle, or autoscale."
        },
        {
            id: "databases",
            name: "Managed databases",
            maturity: "partial",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Cluster create/list/get/delete and apply (no unique-name adopt; a second apply creates another cluster). Users, pools, replicas, topics, and firewall rules are not wrapped. Engines and versions are read via database_options."
        },
        {
            id: "spaces",
            name: "Spaces",
            maturity: "partial",
            operations: ["list", "create", "delete"],
            grape_yaml_apply: true,
            auth_env: SPACES_KEYS,
            notes: "Bucket create, list, and delete via the S3 API. No object upload, no GetBucket, no ACL update on re-apply. Does not use DO_TOKEN."
        },
        {
            id: "cdn",
            name: "CDN",
            maturity: "implemented",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Spaces CDN endpoints. Unique-origin adopt. No purge and no update of TTL or custom domain after create."
        },
        {
            id: "certificates",
            name: "Certificates",
            maturity: "implemented",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Custom and Let's Encrypt certificates. Unique-name adopt. Let's Encrypt is polled only when a same-apply CDN entry references the certificate."
        },
        {
            id: "load_balancers",
            name: "Load balancers",
            maturity: "partial",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "HTTP helpers include update and droplet/rule add/remove. YAML apply always POSTs and does not adopt an existing balancer."
        },
        {
            id: "firewalls",
            name: "Firewalls",
            maturity: "implemented",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Full firewall CRUD plus droplet/tag/rule helpers. Apply adopts a unique name and does not update rules."
        },
        {
            id: "vpcs",
            name: "VPCs",
            maturity: "implemented",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "VPC create/list/get/update/delete and member list. Apply adopts a unique name in the region. Peering helpers exist and are not applied from YAML."
        },
        {
            id: "domains",
            name: "Domains",
            maturity: "partial",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Domains and records. Update applies to records, not the domain object. YAML apply always creates and does not adopt an existing domain."
        },
        {
            id: "apps",
            name: "App Platform",
            maturity: "partial",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "App spec CRUD plus deployment list/get/create. YAML apply is create-only. Logs, rollback, and per-component APIs are not wrapped."
        },
        {
            id: "monitoring",
            name: "Alert policies",
            maturity: "implemented",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Monitoring alert policies. YAML apply is create-only (matched on description at destroy). Droplet metrics are the separate metrics product."
        },
        {
            id: "metrics",
            name: "Droplet metrics",
            maturity: "partial",
            operations: ["list"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Read-only bandwidth (public in/out), CPU, and memory (available and total) via the monitoring metrics API. Bandwidth does not need the agent. CPU and memory are empty without monitoring: true on the droplet. No other metric families."
        },
        {
            id: "uptime",
            name: "Uptime checks",
            maturity: "partial",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Uptime check CRUD. Listed by grape telemetry. Not a grape YAML resource. Per-check alert policies are not wrapped."
        },
        {
            id: "projects",
            name: "Projects",
            maturity: "partial",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Project CRUD, including the default project read. Apply adopts a unique name and skips the default project on destroy. Assigning resources to a project is not wrapped."
        },
        {
            id: "reserved_ips",
            name: "Reserved IPs",
            maturity: "partial",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Reserved IPs (the current API for floating IPs) at /reserved_ips. No name field, so they are not in grape YAML. Assign and unassign actions are not wrapped. Create takes a region or a droplet id, not both."
        },
        {
            id: "images",
            name: "Images",
            maturity: "partial",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Custom image CRUD and image list/get. Public distribution images are what grape offerings lists. Not created from grape YAML."
        },
        {
            id: "snapshots",
            name: "Snapshots",
            maturity: "partial",
            operations: ["list", "get", "delete"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Account snapshot list/get/delete (droplet and volume). Droplet-scoped listSnapshots remains on the droplet helpers. Creating a droplet snapshot is not implemented. Volume snapshot create is volume_snapshots."
        },
        {
            id: "account",
            name: "Account",
            maturity: "implemented",
            operations: ["get"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "GET /account summarized to droplet limit, email, uuid, status, and team name. The token is not copied into the summary or logs."
        },
        {
            id: "regions",
            name: "Regions",
            maturity: "implemented",
            operations: ["list"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Read-only region catalog from GET /regions. grape offerings prints it."
        },
        {
            id: "sizes",
            name: "Sizes",
            maturity: "implemented",
            operations: ["list"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Read-only droplet size catalog from GET /sizes. grape offerings prints it."
        },
        {
            id: "database_options",
            name: "Database options",
            maturity: "implemented",
            operations: ["list"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "GET /databases/options (engines, versions, regions, layouts). Read-only."
        },
        {
            id: "kubernetes_options",
            name: "Kubernetes options",
            maturity: "implemented",
            operations: ["list"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "GET /kubernetes/options (versions, regions, sizes). Read-only."
        },
        {
            id: "billing",
            name: "Billing",
            maturity: "partial",
            operations: ["list", "get"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Balance (get) and invoice list, including invoice preview when DigitalOcean returns it. A token without billing scope returns an error on the inventory instead of failing the rest of the account read. Payment methods and invoice PDF download are not wrapped."
        },
        {
            id: "registry",
            name: "Container registry",
            maturity: "partial",
            operations: ["list", "get"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "GET /registry (one registry per team; 404 is an empty account) and repository list. Create, delete, and garbage collection are not wrapped."
        },
        {
            id: "ssh_keys",
            name: "SSH keys",
            maturity: "implemented",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Account key CRUD. Apply can generate a private key on disk or upload a public key, and adopts a unique name or fingerprint."
        },
        {
            id: "tags",
            name: "Tags",
            maturity: "implemented",
            operations: ["list", "get", "create", "delete"],
            grape_yaml_apply: true,
            auth_env: DO_TOKEN,
            notes: "Tag create/list/get/delete plus tag and untag resource calls. Apply creates tags. Re-apply does not adopt them."
        },
        {
            id: "security",
            name: "Insight security",
            maturity: "partial",
            operations: ["list", "get", "create", "update", "delete"],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "Insight scan, settings, and suppression helpers. Not a grape YAML resource and not part of apply."
        },
        {
            id: "functions",
            name: "Functions",
            maturity: "missing",
            operations: [],
            grape_yaml_apply: false,
            auth_env: DO_TOKEN,
            notes: "DigitalOcean Functions are not wrapped."
        }
    ]
};
/** Every implemented provider. Today this is only DigitalOcean. */
export function listProviderCatalogs() {
    return [digitalOceanCatalog];
}
export function formatProviderCatalog(catalog = digitalOceanCatalog) {
    const lines = [
        `${catalog.name}  (${catalog.provider_id})`,
        `API ${catalog.api_base}`,
        `Auth ${catalog.auth.token_env}`,
        catalog.extension_point,
        "",
        "Product                  Maturity      YAML apply  Operations",
        "-----------------------  ------------  ----------  ---------------------------"
    ];
    for (const product of catalog.products) {
        const ops = product.operations.length > 0 ? product.operations.join(", ") : "—";
        const apply = product.grape_yaml_apply ? "yes" : "no";
        lines.push(`${product.name.padEnd(23)}  ${product.maturity.padEnd(12)}  ${apply.padEnd(10)}  ${ops}`);
    }
    lines.push("", "Notes", ...catalog.products.map((product) => `  ${product.id}: ${product.notes}`));
    return lines.join("\n");
}
//# sourceMappingURL=catalog.js.map