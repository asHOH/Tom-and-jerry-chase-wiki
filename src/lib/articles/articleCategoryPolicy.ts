export type ArticleCategoryPolicyRecord = Readonly<{
  id: string;
  parent_category_id: string | null;
  requires_character: boolean;
}>;

export type ArticleCategoryPolicy = Readonly<{
  requiresCharacter: boolean;
}>;

export function resolveArticleCategoryPolicy(
  categories: readonly ArticleCategoryPolicyRecord[],
  categoryId: string
): ArticleCategoryPolicy | null {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const selectedCategory = categoriesById.get(categoryId);
  if (!selectedCategory) return null;

  const visited = new Set<string>();
  let category: ArticleCategoryPolicyRecord | undefined = selectedCategory;

  while (category && !visited.has(category.id)) {
    if (category.requires_character) return { requiresCharacter: true };

    visited.add(category.id);
    category = category.parent_category_id
      ? categoriesById.get(category.parent_category_id)
      : undefined;
  }

  return { requiresCharacter: false };
}
