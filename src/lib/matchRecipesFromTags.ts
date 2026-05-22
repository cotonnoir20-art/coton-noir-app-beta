import { CATALOG_RECIPES, type CatalogRecipe } from '../data/recipesCatalog';

const TAG_KEYWORDS: Record<string, string[]> = {
  hydratation: ['hydrat', 'karité', 'avocat', 'masque', 'aloe'],
  sécheresse: ['hydrat', 'karité', 'masque', 'huile'],
  casse: ['protéine', 'prot', 'renforc'],
  protéines: ['protéine', 'prot', 'œuf', 'oeuf'],
  scellage: ['huile', 'beurre'],
  frisottis: ['spray', 'gel', 'aloe'],
  brillance: ['huile', 'rinçage', 'spray'],
  pousse: ['cuir', 'scalp', 'massage'],
  scalp: ['cuir', 'scalp', 'ginger', 'gingembre'],
  masque: ['masque'],
  huile: ['huile', 'pré-poo', 'prepoo'],
};

function recipeMatchesTag(recipe: CatalogRecipe, tag: string): boolean {
  const keys = TAG_KEYWORDS[tag.toLowerCase()] ?? [tag.toLowerCase()];
  const blob = `${recipe.name} ${recipe.description} ${recipe.category} ${recipe.ingredients.join(' ')}`.toLowerCase();
  return keys.some(k => blob.includes(k));
}

export function matchRecipesFromTags(tags: string[] | undefined, limit = 4): CatalogRecipe[] {
  if (!tags || tags.length === 0) {
    return CATALOG_RECIPES.filter(r => r.featured).slice(0, limit);
  }
  const scored = CATALOG_RECIPES.map(r => {
    let score = r.featured ? 1 : 0;
    for (const t of tags) {
      if (recipeMatchesTag(r, t)) score += 2;
    }
    return { r, score };
  });
  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.r)
    .slice(0, limit);
}
