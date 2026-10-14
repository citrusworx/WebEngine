import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { Route } from "@citrusworx/seltzer";
import type { MiaContext } from "../types/context.js";
import { healthRoute } from "./health.js";
import { createRecipeRoutes } from "./recipes.js";

export function createRoutes(nectarine: NectarineConfig): Route<MiaContext>[] {
  return [healthRoute, ...createRecipeRoutes(nectarine)];
}
