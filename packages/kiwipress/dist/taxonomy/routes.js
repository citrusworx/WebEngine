import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";
function collectionRoutes(restBase) {
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
export function createTaxonomyRoutes(restBase) {
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
//# sourceMappingURL=routes.js.map