import type { Endpoint, Route } from "@citrusworx/seltzer";
import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils.js";
import type { ApiDefinition } from "../types/api.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";

export type TaxonomyRouteSet = {
    getAll: Route<Endpoint>;
    getById: Route<Endpoint>;
    getBySlug: Route<Endpoint>;
    create: Route<Endpoint>;
    update: Route<Endpoint>;
    delete: Route<Endpoint>;
};

function collectionRoutes(restBase: string): Record<
    "all" | "byId" | "bySlug" | "create" | "update" | "delete",
    ApiDefinition
> {
    return {
        all: {
            method: "GET",
            endpoint: `/${restBase}`
        },
        byId: {
            method: "GET",
            endpoint: `/${restBase}/:id`
        },
        bySlug: {
            method: "GET",
            endpoint: `/${restBase}/:slug`
        },
        create: {
            method: "POST",
            endpoint: `/${restBase}`
        },
        update: {
            method: "PUT",
            endpoint: `/${restBase}/:id`
        },
        delete: {
            method: "DELETE",
            endpoint: `/${restBase}/:id`
        }
    };
}

export function createTaxonomyRoutes(restBase: string): TaxonomyRouteSet {
    const collection = sanitizeRestBase(restBase);
    const routes = collectionRoutes(collection);

    return {
        getAll: createWordPressRoute(routes.all),
        getById: createWordPressRoute(routes.byId),
        getBySlug: createAliasedQueryRoute(routes.bySlug, collection, "slug"),
        create: createWordPressRoute(routes.create, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }),
        update: createWordPressRoute(routes.update, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        }),
        delete: createWordPressRoute(routes.delete, {
            method: "DELETE"
        })
    };
}
