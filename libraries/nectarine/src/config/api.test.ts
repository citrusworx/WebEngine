import path from "node:path";
import { describe, expect, it } from "vitest";
import { listApiOperations, loadApiOperations } from "./api.js";
import { loadNectarineConfig } from "./loadConfig.js";
import type { ApiOperation } from "./api.js";

const fixtureConfig = path.resolve(
    import.meta.dirname,
    "__fixtures__/nectarine.config.yaml",
);

const blackwaterSchemas = path.resolve(
    import.meta.dirname,
    "../../../../apps/blackwatersound/back/src/schemas",
);

const userApiPath = path.resolve(import.meta.dirname, "../../models/user/userAPI.yml");

function op(
    partial: Omit<ApiOperation, "query" | "body"> & Pick<ApiOperation, "query" | "body">,
): ApiOperation {
    return partial;
}

describe("listApiOperations", () => {
    it("flattens LoadedResource.api from nectarine.config.yaml", () => {
        const config = loadNectarineConfig(fixtureConfig, {
            env: {},
            loadResources: true,
        });
        const product = config.getResource("product");

        expect(listApiOperations("product", product.api)).toEqual([
            op({
                resource: "product",
                crud: "read",
                name: "allProducts",
                method: "GET",
                path: "/api/products",
                query: "allProducts",
            }),
        ]);
    });

    it("maps Blackwater productAPI.yml endpoint → path across CRUD", () => {
        const operations = loadApiOperations(
            "product",
            path.join(blackwaterSchemas, "product/productAPI.yml"),
        );

        expect(operations).toEqual([
            op({
                resource: "product",
                crud: "read",
                name: "allProducts",
                method: "GET",
                path: "/api/products",
                query: "allProducts",
            }),
            op({
                resource: "product",
                crud: "read",
                name: "productsByCatalog",
                method: "GET",
                path: "/api/products/catalog/:catalog",
                query: "productsByCatalog",
            }),
            op({
                resource: "product",
                crud: "read",
                name: "productById",
                method: "GET",
                path: "/api/products/:id",
                query: "productById",
            }),
            op({
                resource: "product",
                crud: "read",
                name: "productBySlug",
                method: "GET",
                path: "/api/products/slug/:slug",
                query: "productBySlug",
            }),
            op({
                resource: "product",
                crud: "create",
                name: "newProduct",
                method: "POST",
                path: "/api/products",
                query: "newProduct",
            }),
            op({
                resource: "product",
                crud: "update",
                name: "updateProduct",
                method: "PUT",
                path: "/api/products/:id",
                query: "updateProduct",
            }),
            op({
                resource: "product",
                crud: "delete",
                name: "deleteProduct",
                method: "DELETE",
                path: "/api/products/:id",
                query: "deleteProduct",
            }),
        ]);
    });

    it("includes optional body field types from waitlistAPI.yml", () => {
        const operations = loadApiOperations(
            "waitlist",
            path.join(blackwaterSchemas, "waitlist/waitlistAPI.yml"),
        );
        const join = operations.find((entry) => entry.name === "joinWaitlist");

        expect(join).toEqual({
            resource: "waitlist",
            crud: "create",
            name: "joinWaitlist",
            method: "POST",
            path: "/api/waitlist",
            query: "joinWaitlist",
            body: {
                name: "string",
                email: "string.required",
                source_app: "string",
                interest: "string",
            },
        });
    });

    it("keeps sibling resources in one YAML file separate", () => {
        const apiPath = path.join(blackwaterSchemas, "order/orderAPI.yml");
        const orders = loadApiOperations("order", apiPath);
        const items = loadApiOperations("order_item", apiPath);

        expect(orders.map((entry) => entry.name)).toEqual([
            "byClient",
            "byId",
            "byCatalog",
            "newOrder",
            "updateOrderStatus",
        ]);
        expect(orders.find((entry) => entry.name === "updateOrderStatus")).toMatchObject({
            method: "PATCH",
            path: "/api/orders/:id/status",
            query: "updateOrderStatus",
        });
        expect(items).toEqual([
            op({
                resource: "order_item",
                crud: "read",
                name: "byOrder",
                method: "GET",
                path: "/api/orders/:orderId/items",
                query: "byOrder",
            }),
            op({
                resource: "order_item",
                crud: "create",
                name: "newItem",
                method: "POST",
                path: "/api/orders/:orderId/items",
                query: "newItem",
            }),
        ]);
        expect(orders.every((entry) => entry.resource === "order")).toBe(true);
        expect(items.every((entry) => entry.resource === "order_item")).toBe(true);
    });

    it("lists every Blackwater *API.yml resource without inventing routes", () => {
        const files: Array<{ resource: string; file: string }> = [
            { resource: "product", file: "product/productAPI.yml" },
            { resource: "waitlist", file: "waitlist/waitlistAPI.yml" },
            { resource: "course", file: "course/courseAPI.yml" },
            { resource: "booking", file: "booking/bookingAPI.yml" },
            { resource: "order", file: "order/orderAPI.yml" },
            { resource: "order_item", file: "order/orderAPI.yml" },
            { resource: "coach", file: "coach/coachAPI.yml" },
            { resource: "lesson", file: "lesson/lessonAPI.yml" },
            { resource: "session", file: "session/sessionAPI.yml" },
            { resource: "mix_review", file: "mix_review/mixReviewAPI.yml" },
            { resource: "enrollment", file: "enrollment/enrollmentAPI.yml" },
            { resource: "client", file: "client/clientAPI.yml" },
        ];

        for (const { resource, file } of files) {
            const operations = loadApiOperations(resource, path.join(blackwaterSchemas, file));
            expect(operations.length, resource).toBeGreaterThan(0);
            expect(operations.every((entry) => entry.resource === resource)).toBe(true);
            expect(operations.every((entry) => entry.path.startsWith("/api/"))).toBe(true);
            expect(
                operations.every((entry) => ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(entry.method)),
            ).toBe(true);
        }
    });

    it("preserves get vs read and ignores sibling resources in userAPI.yml", () => {
        const users = loadApiOperations("user", userApiPath);
        const posts = loadApiOperations("post", userApiPath);

        expect(users[0]).toMatchObject({
            resource: "user",
            crud: "get",
            name: "allUsers",
            method: "GET",
            path: "/users",
        });
        expect(users.some((entry) => entry.crud === "create" && entry.method === "POST")).toBe(true);
        expect(posts).toEqual([
            op({
                resource: "post",
                crud: "get",
                name: "allPosts",
                method: "GET",
                path: "/posts",
            }),
        ]);
    });

    it("accepts an already-unwrapped resource block and path as an endpoint alias", () => {
        const operations = listApiOperations("product", {
            read: {
                productById: {
                    api: {
                        method: "get",
                        path: "/api/products/:id",
                        query: "productById",
                    },
                },
            },
        });

        expect(operations).toEqual([
            op({
                resource: "product",
                crud: "read",
                name: "productById",
                method: "GET",
                path: "/api/products/:id",
                query: "productById",
            }),
        ]);
    });

    it("skips unknown methods and missing resource keys", () => {
        expect(listApiOperations("missing", { product: { read: {} } })).toEqual([]);
        expect(
            listApiOperations("product", {
                product: {
                    read: {
                        broken: {
                            api: { method: "OPTIONS", endpoint: "/api/products" },
                        },
                        ok: {
                            api: { method: "GET", endpoint: "/api/products" },
                        },
                    },
                },
            }),
        ).toEqual([
            op({
                resource: "product",
                crud: "read",
                name: "ok",
                method: "GET",
                path: "/api/products",
            }),
        ]);
    });
});
