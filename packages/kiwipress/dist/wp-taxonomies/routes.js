import { createWordPressRoute } from "../core/route-utils.js";
const routes = {
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
//# sourceMappingURL=routes.js.map