import type { HairAnalysis } from '../services/coachApi';
import { ROUTINE_TYPES, type RoutineType } from '../data/routines';
import type { UserRoutinePlan } from '../types/userRoutinePlan';
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
