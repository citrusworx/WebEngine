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
  category: string;
  before_you_begin: string;
  created_at: string;
  updated_at: string;
};

export type RecipeInput = {
  name: string;
  author: string;
  description: string;
  nutrition: string;
  prep_minutes: number;
  cook_minutes: number;
  ingredients: string[];
  steps: string[];
  slug?: string;
  category?: string;
  before_you_begin?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const text = await response.text();
  const payload: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : text || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function listRecipes(): Promise<Recipe[]> {
  return request<Recipe[]>("/api/recipes");
}

export function listRecipesByCategory(category: string): Promise<Recipe[]> {
  return request<Recipe[]>(`/api/recipes/category/${encodeURIComponent(category)}`);
}

export function getRecipeBySlug(slug: string): Promise<Recipe> {
  return request<Recipe>(`/api/recipes/slug/${encodeURIComponent(slug)}`);
}

export function createRecipe(input: RecipeInput): Promise<Recipe> {
  return request<Recipe>("/api/recipes", jsonInit("POST", input));
}

export function updateRecipe(id: string, input: RecipeInput): Promise<Recipe> {
  return request<Recipe>(`/api/recipes/${encodeURIComponent(id)}`, jsonInit("PUT", input));
}

export function deleteRecipe(id: string): Promise<{ ok: boolean; id: string }> {
  return request(`/api/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
}
