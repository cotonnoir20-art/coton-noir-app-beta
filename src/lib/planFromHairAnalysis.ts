import type { HairAnalysis } from '../services/coachApi';
import { ROUTINE_TYPES, type RoutineType } from '../data/routines';
import type { UserRoutinePlan } from '../types/userRoutinePlan';
import type { RecoRoutineStep } from './onboardingRecommendations';
import { newPlanId } from './userRoutinePlan';

/** Durée affichée dans l’éditeur — la fréquence IA reste dans la description. */
function stepDurationFromFreq(freq: string): string {
  const m = freq.match(/(\d+)\s*min/i);
  if (m) return `${m[1]} min`;
  return '10 min';
}

/** Pré-remplit l’éditeur routine-plan à partir des étapes du diagnostic. */
export function planFromHairAnalysis(
  kind: RoutineType,
  routine: HairAnalysis['routine'],
  synthesis?: string,
): UserRoutinePlan {
  const catalog = ROUTINE_TYPES[kind];
  const steps = (routine.length > 0 ? routine : catalog.steps.map(s => ({
    t: s.title,
    f: s.duration,
    d: s.desc,
  }))).map(r => ({
    id: newPlanId(),
    title: r.t.trim() || 'Étape',
    duration: stepDurationFromFreq(r.f),
    desc: [r.d.trim(), r.f.trim() ? `Fréquence : ${r.f.trim()}` : ''].filter(Boolean).join('\n'),
    productLabels: [] as string[],
  }));

  return {
    kind,
    mode: 'try_new',
    name: 'Routine issue de l\'analyse',
    items: [],
    steps,
    hairStateComment: synthesis?.trim().slice(0, 280) ?? '',
    evolutionComment: '',
    updatedAt: new Date().toISOString(),
  };
}

/** Routine catalogue + profil (étapes et produits réels de l’app). */
export function planFromRecoSteps(
  kind: RoutineType,
  steps: RecoRoutineStep[],
  name: string,
  synthesis?: string,
): UserRoutinePlan {
  const catalog = ROUTINE_TYPES[kind];
  const source = steps.length > 0 ? steps : catalog.steps.map(s => ({
    title: s.title,
    duration: s.duration,
    desc: s.desc,
    products: s.products,
  }));

  return {
    kind,
    mode: 'try_new',
    name,
    items: [],
    steps: source.map(s => ({
      id: newPlanId(),
      title: s.title.trim() || 'Étape',
      duration: s.duration.trim() || '10 min',
      desc: s.desc.trim(),
      productLabels: [...s.products],
    })),
    hairStateComment: synthesis?.trim().slice(0, 280) ?? '',
    evolutionComment: '',
    updatedAt: new Date().toISOString(),
  };
}
