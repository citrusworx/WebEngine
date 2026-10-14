import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { RequestContext } from "@citrusworx/seltzer";
import type { Recipe } from "../domain/recipe.js";

export type AppLocals = {
  recipes: Recipe[];
  nectarine: NectarineConfig;
};

export type MiaContext = RequestContext<AppLocals>;
