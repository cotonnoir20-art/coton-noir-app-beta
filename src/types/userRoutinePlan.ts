import type { RoutineType } from '../data/routines';

/** Routine actuelle qui fonctionne, ou nouvelle routine à tester. */
export type RoutinePlanMode = 'keep' | 'try_new';

export type RoutineItemKind = 'product' | 'recipe' | 'other';

export type RoutinePlanItem = {
  id: string;
  kind: RoutineItemKind;
  label: string;
};

export type RoutinePlanStep = {
  id: string;
  title: string;
  duration: string;
  desc: string;
  /** Produits / recettes utilisés pour cette étape */
  productLabels: string[];
};

export type UserRoutinePlan = {
  kind: RoutineType;
  mode: RoutinePlanMode;
  name: string;
  items: RoutinePlanItem[];
  steps: RoutinePlanStep[];
  /** État actuel des cheveux */
  hairStateComment: string;
  /** Comment ils évoluent avec cette routine */
  evolutionComment: string;
  updatedAt: string;
};

export type RoutinePlansState = Record<RoutineType, UserRoutinePlan | null>;

export const ROUTINE_PLAN_LABELS: Record<RoutineType, { title: string; subtitle: string }> = {
  daily: {
    title: 'Routine du matin',
    subtitle: 'Gestes quotidiens pour hydrater et coiffer',
  },
  night: {
    title: 'Routine du soir',
    subtitle: 'Protection et hydratation nocturne',
  },
  washday: {
    title: 'Wash day',
    subtitle: 'Ton protocole de lavage complet',
  },
};

export const ROUTINE_ITEM_KIND_LABELS: Record<RoutineItemKind, string> = {
  product: 'Produit',
  recipe: 'Recette',
  other: 'Autre',
};
