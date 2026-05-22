import type { CatalogRecipe } from '../data/recipesCatalog';
import { ROUTINE_TYPES, type RoutineType } from '../data/routines';
import type { UserRoutinePlan } from '../types/userRoutinePlan';
import { newPlanId } from './userRoutinePlan';

/** Pré-remplit une routine avec les ingrédients / étapes d’une recette DIY. */
export function planFromRecipe(
  kind: RoutineType,
  recipe: Pick<CatalogRecipe, 'name' | 'ingredients' | 'steps' | 'category'>,
): UserRoutinePlan {
  const catalog = ROUTINE_TYPES[kind];
  const productLabel = recipe.name.trim();

  const items = recipe.ingredients.slice(0, 8).map(ing => ({
    id: newPlanId(),
    kind: 'recipe' as const,
    label: ing.trim(),
  }));

  const steps =
    recipe.steps.length > 0
      ? recipe.steps.map((step, i) => ({
          id: newPlanId(),
          title: `Étape ${i + 1}`,
          duration: '10 min',
          desc: step.trim(),
          productLabels: items.slice(0, 3).map(it => it.label),
        }))
      : catalog.steps.slice(0, 3).map(s => ({
          id: newPlanId(),
          title: s.title,
          duration: s.duration,
          desc: s.desc,
          productLabels: [productLabel],
        }));

  return {
    kind,
    mode: 'try_new',
    name: `Recette · ${productLabel}`,
    items,
    steps,
    hairStateComment: `Recette maison : ${productLabel} (${recipe.category})`,
    evolutionComment: '',
    updatedAt: new Date().toISOString(),
  };
}
