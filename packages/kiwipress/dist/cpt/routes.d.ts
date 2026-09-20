import type { Endpoint, Route } from "@citrusworx/seltzer";
export type CptRouteSet = {
    getAll: Route<Endpoint>;
    getById: Route<Endpoint>;
    getBySlug: Route<Endpoint>;
    create: Route<Endpoint>;
    update: Route<Endpoint>;
    delete: Route<Endpoint>;
};
export declare function createCptRoutes(restBase: string): CptRouteSet;
