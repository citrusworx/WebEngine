import { randomUUID } from "node:crypto";
import type { NectarineConfig } from "@citrusworx/nectarine/config";
import { response, type ExecuteArgs, type Route } from "@citrusworx/seltzer";
import { createNectarineRoutes } from "@citrusworx/webengine";
import type { Recipe, RecipeWrite } from "../domain/recipe.js";
import { parseRecipeWrite, RecipeInputError, slugify } from "../domain/recipe.js";
import {
  deleteRecipeFromDb,
  insertRecipe,
  isDatabaseConnected,
  loadRecipeByIdFromDb,
  loadRecipeBySlugFromDb,
  loadRecipesFromDb,
  updateRecipe,
} from "../db/postgres.js";
import type { MiaContext } from "../types/context.js";

function newId(): string {
  return `rec_${randomUUID()}`;
}

function stamp(): string {
  return new Date().toISOString();
}

function sortNewest(recipes: Recipe[]): Recipe[] {
  return [...recipes].sort((left, right) => right.created_at.localeCompare(left.created_at));
}

function storedRecipes(ctx: MiaContext): Recipe[] {
  return ctx.locals.recipes;
}

async function listRecipes(ctx: MiaContext): Promise<Recipe[]> {
  if (isDatabaseConnected()) {
    return loadRecipesFromDb();
  }
  return sortNewest(storedRecipes(ctx));
}

async function findById(ctx: MiaContext, id: string | undefined): Promise<Recipe | null> {
  if (!id) {
    return null;
  }
  if (isDatabaseConnected()) {
    return loadRecipeByIdFromDb(id);
  }
  return storedRecipes(ctx).find((recipe) => recipe.id === id) ?? null;
}

async function findBySlug(ctx: MiaContext, slug: string | undefined): Promise<Recipe | null> {
  if (!slug) {
    return null;
  }
  if (isDatabaseConnected()) {
    return loadRecipeBySlugFromDb(slug);
  }
  return storedRecipes(ctx).find((recipe) => recipe.slug === slug) ?? null;
}

async function slugTaken(ctx: MiaContext, slug: string, exceptId?: string): Promise<boolean> {
  const existing = await findBySlug(ctx, slug);
  if (!existing) {
    return false;
  }
  return existing.id !== exceptId;
}

async function uniqueSlug(ctx: MiaContext, base: string, exceptId?: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 2;

  while (await slugTaken(ctx, candidate, exceptId)) {
    const tail = `-${suffix}`;
    candidate = `${root.slice(0, 80 - tail.length)}${tail}`;
    suffix += 1;
    if (suffix > 50) {
      throw new RecipeInputError("Could not find an open slug for that name");
    }
  }

  return candidate;
}

function materialize(id: string, write: RecipeWrite, previous?: Recipe): Recipe {
  const now = stamp();
  return {
    id,
    slug: write.slug,
    name: write.name,
    author: write.author,
    description: write.description,
    nutrition: write.nutrition,
    prep_minutes: write.prep_minutes,
    cook_minutes: write.cook_minutes,
    ingredients: write.ingredients,
    steps: write.steps,
    photo_url: write.photo_url,
    author_id: write.author_id,
    cookbook_id: write.cookbook_id,
    created_at: previous?.created_at ?? now,
    updated_at: now,
  };
}

async function createRecipe({ body, ctx }: ExecuteArgs<MiaContext>): Promise<unknown> {
  const write = parseRecipeWrite(body);
  write.slug = await uniqueSlug(ctx, write.slug);

  if (isDatabaseConnected()) {
    return insertRecipe(newId(), write);
  }

  const recipe = materialize(newId(), write);
  storedRecipes(ctx).push(recipe);
  return recipe;
}

async function replaceRecipe({ body, params, ctx }: ExecuteArgs<MiaContext>): Promise<unknown> {
  const id = params.id?.trim();
  const current = await findById(ctx, id);
  if (!current || !id) {
    return null;
  }

  const write = parseRecipeWrite(body, {
    photo_url: current.photo_url,
    author_id: current.author_id,
    cookbook_id: current.cookbook_id,
    slug: current.slug,
  });
  write.slug = await uniqueSlug(ctx, write.slug, current.id);

  if (isDatabaseConnected()) {
    return updateRecipe(id, write);
  }

  const next = materialize(current.id, write, current);
  const index = storedRecipes(ctx).findIndex((recipe) => recipe.id === current.id);
  if (index < 0) {
    return null;
  }
  storedRecipes(ctx)[index] = next;
  return next;
}

async function removeRecipe({ params, ctx }: ExecuteArgs<MiaContext>): Promise<unknown> {
  const id = params.id?.trim();
  if (!id) {
    return null;
  }

  if (isDatabaseConnected()) {
    const deleted = await deleteRecipeFromDb(id);
    return deleted ? { ok: true, id } : null;
  }

  const index = storedRecipes(ctx).findIndex((recipe) => recipe.id === id);
  if (index < 0) {
    return null;
  }
  storedRecipes(ctx).splice(index, 1);
  return { ok: true, id };
}

/**
 * Host execute for recipe CRUD.
 *
 * Named SQL lives in recipeQueries.yml. This function validates the body,
 * generates ids, and passes ingredient and step arrays through. The Postgres
 * adapter encodes those JSONB binds. `updateRecipe` returns the row via
 * RETURNING, so a successful write is one statement.
 */
export async function executeRecipe(args: ExecuteArgs<MiaContext>): Promise<unknown> {
  try {
    switch (args.query) {
      case "listRecipes":
        return await listRecipes(args.ctx);
      case "byId":
        return await findById(args.ctx, args.params.id);
      case "bySlug":
        return await findBySlug(args.ctx, args.params.slug);
      case "createRecipe":
        return await createRecipe(args);
      case "updateRecipe":
        return await replaceRecipe(args);
      case "deleteRecipe":
        return await removeRecipe(args);
      default:
        return null;
    }
  } catch (error) {
    if (error instanceof RecipeInputError) {
      return response({ status: 400, body: { error: error.message } });
    }
    throw error;
  }
}

export function createRecipeRoutes(nectarine: NectarineConfig): Route<MiaContext>[] {
  return createNectarineRoutes(nectarine, {
    resources: ["recipe"],
    execute: executeRecipe,
    notFound: () => ({ status: 404, body: { error: "Recipe not found" } }),
  });
}
