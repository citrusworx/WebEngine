export type CategoryId = "salads" | "entrees" | "appetizers";

export type CategoryShelf = {
  id: string;
  label: string;
  surface: string;
};

/** Starter shelves, in the order Drew's home screen stacks them. */
export const CATEGORIES: readonly CategoryShelf[] = [
  { id: "salads", label: "Salads", surface: "mm-photo-salads" },
  { id: "entrees", label: "Entrees", surface: "mm-photo-entrees" },
  { id: "appetizers", label: "Appetizers", surface: "mm-photo-appetizers" },
];

const KNOWN = new Set(CATEGORIES.map((category) => category.id));

export function categoryLabel(id: string): string {
  const known = CATEGORIES.find((category) => category.id === id);
  if (known) {
    return known.label;
  }
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function categorySurface(id: string): string {
  return CATEGORIES.find((category) => category.id === id)?.surface ?? "mm-photo-extra";
}

/** Drew's salad cards are the only ones with Get Ingreds. */
export function showsIngredientsButton(category: string): boolean {
  return category === "salads";
}

export function extraCategories(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const extras: string[] = [];
  for (const id of ids) {
    if (!id || KNOWN.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    extras.push(id);
  }
  return extras;
}
