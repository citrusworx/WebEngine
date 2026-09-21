import { createWordPressRoute } from "../core/route-utils.js";
import type { ApiDefinition } from "../types/api.js";

type CleanTaxonomyCatalogRoutes = {
    allTaxonomies: ApiDefinition;
    taxonomyBySlug: ApiDefinition;
};

const routes: CleanTaxonomyCatalogRoutes = {
    allTaxonomies: {
        method: "GET",
        endpoint: "/taxonomies"
    },
    taxonomyBySlug: {
        method: "GET",
        endpoint: "/taxonomies/:slug"
    }
};

export const getAllTaxonomies = createWordPressRoute(routes.allTaxonomies);

export const getTaxonomyBySlug = createWordPressRoute(routes.taxonomyBySlug);
