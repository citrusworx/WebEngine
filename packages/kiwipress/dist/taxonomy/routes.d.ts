import type { Endpoint, Route } from "@citrusworx/seltzer";
export type TaxonomyRouteSet = {
    getAll: Route<Endpoint>;
    getById: Route<Endpoint>;
    getBySlug: Route<Endpoint>;
    create: Route<Endpoint>;
    update: Route<Endpoint>;
    delete: Route<Endpoint>;
};
export declare function createTaxonomyRoutes(restBase: string): TaxonomyRouteSet;
