import { createWordPressRoute } from "../core/route-utils.js";
const routes = {
    allTypes: {
        method: "GET",
        endpoint: "/types"
    },
    typeBySlug: {
        method: "GET",
        endpoint: "/types/:slug"
    }
};
export const getAllTypes = createWordPressRoute(routes.allTypes);
export const getTypeBySlug = createWordPressRoute(routes.typeBySlug);
//# sourceMappingURL=routes.js.map