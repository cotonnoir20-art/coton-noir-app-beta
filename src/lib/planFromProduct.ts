import { ROUTINE_TYPES, type RoutineType } from '../data/routines';
import type { UserRoutinePlan } from '../types/userRoutinePlan';
import { newPlanId } from './userRoutinePlan';

/** Ajoute un produit testé dans le plan (workflow « nouveau produit »). */
export function planWithTestedProduct(
  kind: RoutineType,
  brand: string,
  name: string,
  existing: UserRoutinePlan | null,
): UserRoutinePlan {
  const catalog = ROUTINE_TYPES[kind];
  const label = [brand.trim(), name.trim()].filter(Boolean).join(' — ') || name.trim() || 'Nouveau produit';

  const base = existing ?? {
    kind,
    mode: 'try_new' as const,
    name: catalog.label,
    items: [],
    steps: catalog.steps.map(s => ({
      id: newPlanId(),
      title: s.title,
      duration: s.duration,
      desc: s.desc,
      productLabels: [...s.products],
    })),
    hairStateComment: '',
    evolutionComment: '',
    updatedAt: new Date().toISOString(),
  };

  const already = base.items.some(i => i.label === label);
  const items = already
    ? base.items
    : [...base.items, { id: newPlanId(), kind: 'product' as const, label }];

  const steps = base.steps.map((s, idx) =>
    idx === 0
      ? {
          ...s,
          productLabels: s.productLabels.includes(label)
            ? s.productLabels
            : [...s.productLabels, label],
        }
      : s,
  );

  return {
    ...base,
    kind,
    mode: 'try_new',
    items,
    steps,
    hairStateComment: base.hairStateComment.trim()
      ? base.hairStateComment
      : `Produit testé : ${label}`,
    evolutionComment: base.evolutionComment,
    updatedAt: new Date().toISOString(),
  };
}
