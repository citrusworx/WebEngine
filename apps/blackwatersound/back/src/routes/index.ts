import type { Route } from "@citrusworx/seltzer";
import type { BlackwaterContext } from "../types/context.js";
import { healthRoute } from "./health.js";
import { listProductsRoute, getProductRoute } from "./products.js";
import { joinWaitlistRoute } from "./waitlist.js";
import { getPostBySlugRoute, getLessonRoute } from "./content.js";

/** Object-based Seltzer routes for Phase 0. */
export const routes: Route<BlackwaterContext>[] = [
  healthRoute,
  listProductsRoute,
  getProductRoute,
  joinWaitlistRoute,
  getPostBySlugRoute,
  getLessonRoute,
];
