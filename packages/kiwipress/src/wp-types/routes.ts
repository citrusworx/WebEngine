import { createWordPressRoute } from "../core/route-utils.js";
import type { ApiDefinition } from "../types/api.js";

type CleanTypeRoutes = {
    allTypes: ApiDefinition;
    typeBySlug: ApiDefinition;
};

const routes: CleanTypeRoutes = {
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
