import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
    CATALOG_OPERATIONS,
    digitalOceanCatalog,
    formatProviderCatalog,
    listProviderCatalogs
} from "./catalog.js";

const catalogPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../catalog/digitalocean.json"
);

const YAML_APPLY = [
    "droplets",
    "volumes",
    "kubernetes",
    "databases",
    "spaces",
    "cdn",
    "certificates",
    "load_balancers",
    "firewalls",
    "vpcs",
    "domains",
    "apps",
    "monitoring",
    "projects",
    "ssh_keys",
    "tags"
];

describe("provider catalog", () => {
    it("ships only the DigitalOcean catalog", () => {
        expect(listProviderCatalogs()).toEqual([digitalOceanCatalog]);
        expect(digitalOceanCatalog.provider_id).toBe("digitalocean");
        expect(digitalOceanCatalog.schema_version).toBe(1);
        expect(digitalOceanCatalog.implemented).toBe(true);
        expect(JSON.stringify(digitalOceanCatalog)).not.toMatch(/"provider_id":"(aws|gcp|azure)"/);
    });

    it("keeps maturity, operations, and YAML apply honest", () => {
        const ids = digitalOceanCatalog.products.map((product) => product.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain("functions");
        expect(ids).toContain("reserved_ips");
        expect(ids).toContain("metrics");

        for (const product of digitalOceanCatalog.products) {
            expect(["implemented", "partial", "missing"]).toContain(product.maturity);
            for (const operation of product.operations) {
                expect(CATALOG_OPERATIONS).toContain(operation);
            }
            if (product.maturity === "missing") {
                expect(product.operations).toEqual([]);
                expect(product.grape_yaml_apply).toBe(false);
            }
            if (product.maturity === "implemented") {
                expect(product.operations.length).toBeGreaterThan(0);
            }
        }

        expect(
            digitalOceanCatalog.products.filter((product) => product.grape_yaml_apply).map((product) => product.id)
        ).toEqual(YAML_APPLY);

        const byId = Object.fromEntries(digitalOceanCatalog.products.map((product) => [product.id, product]));
        expect(byId.functions).toMatchObject({ maturity: "missing", grape_yaml_apply: false });
        expect(byId.droplets?.operations).not.toContain("update");
        expect(byId.spaces?.auth_env).toEqual(["DO_SPACES_ACCESS_KEY_ID", "DO_SPACES_SECRET_ACCESS_KEY"]);
        expect(byId.reserved_ips?.grape_yaml_apply).toBe(false);
        expect(byId.metrics?.operations).toEqual(["list"]);
        expect(byId.kubernetes?.maturity).toBe("partial");
        expect(byId.billing?.maturity).toBe("partial");
    });

    it("matches the committed JSON the dashboard imports", () => {
        const committed = JSON.parse(readFileSync(catalogPath, "utf8"));
        expect(committed).toEqual(digitalOceanCatalog);
    });

    it("prints a human catalog that names the extension point", () => {
        const text = formatProviderCatalog();
        expect(text).toContain("digitalocean");
        expect(text).toContain("No second provider");
        expect(text).toContain("Functions");
        expect(text).toContain("missing");
    });
});
