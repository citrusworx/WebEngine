import { describe, expect, it } from "vitest";
import { loadNectarineApi } from "./api.js";

describe("loadNectarineApi", () => {
    it("walks nested Nectarine userAPI.yml shapes", () => {
        const routes = loadNectarineApi({
            user: {
                get: {
                    allUsers: {
                        api: { method: "GET", endpoint: "/users" }
                    },
                    usersByEmail: {
                        api: { method: "GET", endpoint: "/users/:email" }
                    }
                },
                create: {
                    user: {
                        api: { method: "POST", endpoint: "/users" }
                    }
                }
            },
            post: {
                get: {
                    allPosts: {
                        api: { method: "GET", endpoint: "/posts" }
                    }
                }
            }
        });

        expect(routes).toEqual(expect.arrayContaining([
            {
                resource: "user",
                operation: "get",
                name: "allUsers",
                method: "GET",
                endpoint: "/users"
            },
            {
                resource: "user",
                operation: "create",
                name: "user",
                method: "POST",
                endpoint: "/users"
            },
            {
                resource: "post",
                operation: "get",
                name: "allPosts",
                method: "GET",
                endpoint: "/posts"
            }
        ]));
    });

    it("accepts a flattened method/route document", () => {
        const routes = loadNectarineApi({
            get: {
                allPosts: {
                    api: { method: "GET", endpoint: "/posts" }
                }
            }
        });

        expect(routes).toEqual([
            {
                resource: "resource",
                operation: "get",
                name: "allPosts",
                method: "GET",
                endpoint: "/posts"
            }
        ]);
    });
});
