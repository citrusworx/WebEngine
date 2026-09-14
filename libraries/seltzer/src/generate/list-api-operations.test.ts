import { describe, expect, it } from "vitest";
import { listApiOperations } from "./list-api-operations.js";

const productApi = {
    product: {
        read: {
            allProducts: {
                api: {
                    method: "GET",
                    endpoint: "/api/products",
                    query: "allProducts",
                },
            },
            productsByCatalog: {
                api: {
                    method: "get",
                    endpoint: "/api/products/catalog/:catalog",
                    query: "productsByCatalog",
                },
            },
            productById: {
                api: {
                    method: "GET",
                    endpoint: "/api/products/:id",
                    query: "productById",
                },
            },
            productBySlug: {
                api: {
                    method: "GET",
                    endpoint: "/api/products/slug/:slug",
                    query: "productBySlug",
                },
            },
        },
        create: {
            newProduct: {
                api: {
                    method: "POST",
                    endpoint: "/api/products",
                    query: "newProduct",
                    body: {
                        name: "string",
                        email: "string.required",
                    },
                },
            },
        },
        update: {
            updateProduct: {
                api: {
                    method: "PUT",
                    endpoint: "/api/products/:id",
                    query: "updateProduct",
                },
            },
        },
        delete: {
            deleteProduct: {
                api: {
                    method: "DELETE",
                    endpoint: "/api/products/:id",
                    query: "deleteProduct",
                },
            },
        },
    },
};

describe("listApiOperations", () => {
    it("flattens resource → crud → operation → api", () => {
        const operations = listApiOperations(productApi);

        expect(operations).toEqual([
            {
                resource: "product",
                crud: "read",
                name: "allProducts",
                method: "GET",
                path: "/api/products",
                query: "allProducts",
            },
            {
                resource: "product",
                crud: "read",
                name: "productsByCatalog",
                method: "GET",
                path: "/api/products/catalog/:catalog",
                query: "productsByCatalog",
            },
            {
                resource: "product",
                crud: "read",
                name: "productById",
                method: "GET",
                path: "/api/products/:id",
                query: "productById",
            },
            {
                resource: "product",
                crud: "read",
                name: "productBySlug",
                method: "GET",
                path: "/api/products/slug/:slug",
                query: "productBySlug",
            },
            {
                resource: "product",
                crud: "create",
                name: "newProduct",
                method: "POST",
                path: "/api/products",
                query: "newProduct",
                body: {
                    name: "string",
                    email: "string.required",
                },
            },
            {
                resource: "product",
                crud: "update",
                name: "updateProduct",
                method: "PUT",
                path: "/api/products/:id",
                query: "updateProduct",
            },
            {
                resource: "product",
                crud: "delete",
                name: "deleteProduct",
                method: "DELETE",
                path: "/api/products/:id",
                query: "deleteProduct",
            },
        ]);
    });

    it("accepts method/endpoint on the operation when api: is omitted", () => {
        expect(
            listApiOperations({
                waitlist: {
                    create: {
                        joinWaitlist: {
                            method: "POST",
                            endpoint: "/api/waitlist",
                            query: "joinWaitlist",
                        },
                    },
                },
            }),
        ).toEqual([
            {
                resource: "waitlist",
                crud: "create",
                name: "joinWaitlist",
                method: "POST",
                path: "/api/waitlist",
                query: "joinWaitlist",
            },
        ]);
    });

    it("throws on an invalid HTTP method", () => {
        expect(() =>
            listApiOperations({
                product: {
                    read: {
                        allProducts: {
                            api: { method: "FETCH", endpoint: "/api/products" },
                        },
                    },
                },
            }),
        ).toThrowError(/Invalid HTTP method "FETCH" for product.read.allProducts/);
    });

    it("throws when endpoint is missing", () => {
        expect(() =>
            listApiOperations({
                product: {
                    read: {
                        allProducts: {
                            api: { method: "GET" },
                        },
                    },
                },
            }),
        ).toThrowError(/Missing api.endpoint for product.read.allProducts/);
    });
});
