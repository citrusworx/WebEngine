export type Recipe = {
  id: string;
  slug: string;
  name: string;
  author: string;
  description: string;
  nutrition: string;
  prep_minutes: number;
  cook_minutes: number;
  ingredients: string[];
  steps: string[];
  photo_url: string | null;
  author_id: string | null;
  cookbook_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Fields the form and HTTP body may set. Identity and timestamps stay on the server. */
export type RecipeWrite = {
  slug: string;
  name: string;
  author: string;
  description: string;
  nutrition: string;
  prep_minutes: number;
  cook_minutes: number;
  ingredients: string[];
  steps: string[];
  photo_url: string | null;
  author_id: string | null;
  cookbook_id: string | null;
};

export class RecipeInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecipeInputError";
  }
}

const SLUG_MAX = 80;
const LIST_MAX = 80;
const TEXT_MAX = 8000;

export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");

  return slug || "recipe";
}

function payloadRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RecipeInputError("Request body must be an object");
  }
  return body as Record<string, unknown>;
}

function requiredName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new RecipeInputError("name is required");
  }
  const name = value.trim();
  if (name.length > 160) {
    throw new RecipeInputError("name must be 160 characters or fewer");
  }
  return name;
}

function optionalText(value: unknown, field: string, fallback = ""): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== "string") {
    throw new RecipeInputError(`${field} must be a string`);
  }
  const text = value.trim();
  if (text.length > TEXT_MAX) {
    throw new RecipeInputError(`${field} must be ${TEXT_MAX} characters or fewer`);
  }
  return text;
}

function optionalNullable(value: unknown, field: string, fallback: string | null): string | null {
  if (value === undefined) {
    return fallback;
  }
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new RecipeInputError(`${field} must be a string`);
  }
  const text = value.trim();
  if (!text) {
    return null;
  }
  if (text.length > 500) {
    throw new RecipeInputError(`${field} must be 500 characters or fewer`);
  }
  return text;
}

function minutes(value: unknown, field: string): number {
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 7 * 24 * 60) {
    throw new RecipeInputError(`${field} must be a whole number of minutes from 0 to 10080`);
  }
  return parsed;
}

function stringList(value: unknown, field: string): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new RecipeInputError(`${field} must be a list of strings`);
  }
  if (value.length > LIST_MAX) {
    throw new RecipeInputError(`${field} can include at most ${LIST_MAX} lines`);
  }

  const lines: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      throw new RecipeInputError(`${field} must be a list of strings`);
    }
    const line = item.trim();
    if (!line) {
      continue;
    }
    if (line.length > 300) {
      throw new RecipeInputError(`Each ${field} line must be 300 characters or fewer`);
    }
    lines.push(line);
  }
  return lines;
}

export type RecipeSeamDefaults = {
  photo_url?: string | null;
  author_id?: string | null;
  cookbook_id?: string | null;
  slug?: string | null;
};

/**
 * Validate a create/update body.
 *
 * Omitted photo_url, author_id, and cookbook_id keep `defaults` so a later
 * photo or account value is not wiped by the week-1 form, which does not
 * send those fields. An explicit empty string clears the seam.
 */
export function parseRecipeWrite(
  body: unknown,
  defaults: RecipeSeamDefaults = {},
): RecipeWrite {
  const payload = payloadRecord(body);
  const name = requiredName(payload.name);
  const requestedSlug = optionalText(payload.slug, "slug");

  return {
    slug: slugify(requestedSlug || defaults.slug || name),
    name,
    author: optionalText(payload.author, "author"),
    description: optionalText(payload.description, "description"),
    nutrition: optionalText(payload.nutrition, "nutrition"),
    prep_minutes: minutes(payload.prep_minutes, "prep_minutes"),
    cook_minutes: minutes(payload.cook_minutes, "cook_minutes"),
    ingredients: stringList(payload.ingredients, "ingredients"),
    steps: stringList(payload.steps, "steps"),
    photo_url: optionalNullable(payload.photo_url, "photo_url", defaults.photo_url ?? null),
    author_id: optionalNullable(payload.author_id, "author_id", defaults.author_id ?? null),
    cookbook_id: optionalNullable(payload.cookbook_id, "cookbook_id", defaults.cookbook_id ?? null),
  };
}

export function recipeTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return new Date(0).toISOString();
}

export function recipeStringList(value: unknown): string[] {
  if (typeof value === "string") {
    try {
      return recipeStringList(JSON.parse(value) as unknown);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

export function recipeFromRow(row: Record<string, unknown>): Recipe {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    author: typeof row.author === "string" ? row.author : "",
    description: typeof row.description === "string" ? row.description : "",
    nutrition: typeof row.nutrition === "string" ? row.nutrition : "",
    prep_minutes: Number.isFinite(Number(row.prep_minutes)) ? Math.trunc(Number(row.prep_minutes)) : 0,
    cook_minutes: Number.isFinite(Number(row.cook_minutes)) ? Math.trunc(Number(row.cook_minutes)) : 0,
    ingredients: recipeStringList(row.ingredients),
    steps: recipeStringList(row.steps),
    photo_url: typeof row.photo_url === "string" && row.photo_url ? row.photo_url : null,
    author_id: typeof row.author_id === "string" && row.author_id ? row.author_id : null,
    cookbook_id: typeof row.cookbook_id === "string" && row.cookbook_id ? row.cookbook_id : null,
    created_at: recipeTimestamp(row.created_at),
    updated_at: recipeTimestamp(row.updated_at),
  };
}
