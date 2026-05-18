import { ROUTINE_TYPES, RoutineStep, RoutineType } from '../data/routines';
import type {
  RoutinePlanStep,
  RoutinePlansState,
  UserRoutinePlan,
} from '../types/userRoutinePlan';

export function newPlanId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyRoutinePlans(): RoutinePlansState {
  return { washday: null, daily: null, night: null };
}

/** Plan par défaut à partir du catalogue intégré (pour pré-remplir l’éditeur). */
export function defaultPlanFromCatalog(kind: RoutineType): UserRoutinePlan {
  const catalog = ROUTINE_TYPES[kind];
  return {
    kind,
    mode: 'keep',
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
}

export function planToRoutineSteps(plan: UserRoutinePlan): RoutineStep[] {
  return plan.steps.map((s, i) => ({
    id: i + 1,
    title: s.title.trim() || `Étape ${i + 1}`,
    duration: s.duration.trim() || '5 min',
    desc: s.desc.trim(),
    products: s.productLabels.filter(Boolean),
    done: false,
  }));
}

export function validatePlan(plan: UserRoutinePlan): string | null {
  if (!plan.name.trim()) return 'Donne un nom à ta routine.';
  if (plan.steps.length === 0) return 'Ajoute au moins une étape.';
  const emptyStep = plan.steps.find(s => !s.title.trim());
  if (emptyStep) return 'Chaque étape doit avoir un titre.';
  return null;
}

export function parseRoutinePlansState(raw: unknown): RoutinePlansState | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const kinds: RoutineType[] = ['washday', 'daily', 'night'];
  const out = emptyRoutinePlans();
  for (const k of kinds) {
    const v = o[k];
    if (v == null) continue;
    if (!isValidPlan(v, k)) return null;
    out[k] = v as UserRoutinePlan;
  }
  return out;
}

function isValidPlan(v: unknown, kind: RoutineType): boolean {
  if (!v || typeof v !== 'object') return false;
  const p = v as UserRoutinePlan;
  if (p.kind !== kind) return false;
  if (typeof p.name !== 'string') return false;
  if (!Array.isArray(p.steps)) return false;
  return true;
}

export function createBlankStep(): RoutinePlanStep {
  return {
    id: newPlanId(),
    title: '',
    duration: '5 min',
    desc: '',
    productLabels: [],
  };
}

/** Texte court pour Black Cotton / recommandations futures */
export function planFeedbackSnippet(plan: UserRoutinePlan): string {
  const parts: string[] = [];
  if (plan.mode === 'try_new') parts.push('[test nouvelle routine]');
  else parts.push('[routine établie]');
  if (plan.hairStateComment.trim()) parts.push(`État: ${plan.hairStateComment.trim()}`);
  if (plan.evolutionComment.trim()) parts.push(`Évolution: ${plan.evolutionComment.trim()}`);
  const items = plan.items.map(i => `${i.kind}:${i.label}`).join(', ');
  if (items) parts.push(`Utilise: ${items}`);
  return parts.join(' · ');
}
