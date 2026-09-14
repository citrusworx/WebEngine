import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { Route } from "@citrusworx/seltzer";
import type { BlackwaterContext } from "../types/context.js";
import { healthRoute } from "./health.js";
import { createProductReadRoutes } from "./products.js";
import { createWaitlistReadRoutes, joinWaitlistRoute } from "./waitlist.js";
import { getPostBySlugRoute, getLessonRoute } from "./content.js";

/** Object-based Seltzer routes. Product and waitlist reads come from `*API.yml`. */
export function createRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  return [
    healthRoute,
    ...createProductReadRoutes(nectarine),
    ...createWaitlistReadRoutes(nectarine),
    joinWaitlistRoute,
    getPostBySlugRoute,
    getLessonRoute,
  ];
}
