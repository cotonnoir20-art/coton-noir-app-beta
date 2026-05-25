export type OnboardingConfidenceId =
  | 'very_confident'
  | 'getting_there'
  | 'frustrated'
  | 'overwhelmed'
  | 'disconnected';

export type OnboardingRoutineConsistencyId =
  | 'very_consistent'
  | 'somewhat'
  | 'variable'
  | 'none';

export type OnboardingBlockerId =
  | 'consistency'
  | 'dont_know'
  | 'too_many_products'
  | 'no_structure'
  | 'stylist'
  | 'budget';

export type OnboardingResultsPaceId =
  | 'very_slow'
  | 'slow'
  | 'balanced'
  | 'fast'
  | 'very_fast';

export type ResultsPaceWeekStop = {
  weeks: number;
  id: OnboardingResultsPaceId;
  /** Titre carte quand cette position est active. */
  label: string;
  /** Libellé sous la jauge (extrémités + centre). */
  gaugeLabel: string;
};

/** Gauche (lent) → droite (accéléré). */
export const RESULTS_PACE_WEEK_STOPS: ResultsPaceWeekStop[] = [
  {
    weeks: 24,
    id: 'very_slow',
    label: 'Lentement mais sûrement',
    gaugeLabel: 'Lentement mais sûrement',
  },
  { weeks: 18, id: 'slow', label: '18 semaines', gaugeLabel: '18 sem.' },
  { weeks: 12, id: 'balanced', label: 'Recommandé', gaugeLabel: 'Recommandé' },
  { weeks: 8, id: 'fast', label: '8 semaines', gaugeLabel: '8 sem.' },
  {
    weeks: 4,
    id: 'very_fast',
    label: 'Voie accélérée',
    gaugeLabel: 'Voie accélérée',
  },
];

export const DEFAULT_RESULTS_PACE_WEEKS = 12;

const LEGACY_PACE_TO_WEEKS: Record<string, number> = {
  slow: 12,
  balanced: 8,
  fast: 5,
};

export function snapResultsWeeks(weeks: number): number {
  return RESULTS_PACE_WEEK_STOPS.reduce(
    (best, stop) =>
      Math.abs(stop.weeks - weeks) < Math.abs(best - weeks) ? stop.weeks : best,
    DEFAULT_RESULTS_PACE_WEEKS,
  );
}

export function paceFromResultsWeeks(weeks: number): OnboardingResultsPaceId {
  const w = snapResultsWeeks(weeks);
  return RESULTS_PACE_WEEK_STOPS.find(s => s.weeks === w)?.id ?? 'balanced';
}

export function normalizeResultsPaceId(
  pace: string | undefined,
  weeks?: number,
): OnboardingResultsPaceId {
  if (weeks != null && weeks > 0) return paceFromResultsWeeks(weeks);
  const p = (pace || '').trim();
  if (RESULTS_PACE_WEEK_STOPS.some(s => s.id === p)) return p as OnboardingResultsPaceId;
  if (p in LEGACY_PACE_TO_WEEKS) return paceFromResultsWeeks(LEGACY_PACE_TO_WEEKS[p]);
  return 'balanced';
}

export const CONFIDENCE_OPTIONS: {
  id: OnboardingConfidenceId;
  emoji: string;
  label: string;
}[] = [
  { id: 'getting_there', emoji: '🌱', label: 'Ça progresse, j’ai de bons jours' },
  { id: 'frustrated', emoji: '😤', label: 'Frustrée, rien ne semble marcher' },
  { id: 'overwhelmed', emoji: '😩', label: 'Perdue, je ne sais pas quoi faire' },
];

export const ROUTINE_CONSISTENCY_OPTIONS: {
  id: OnboardingRoutineConsistencyId;
  emoji: string;
  label: string;
}[] = [
  { id: 'very_consistent', emoji: '💚', label: 'Très régulière, j’ai une routine' },
  { id: 'somewhat', emoji: '🌱', label: 'J’essaie, mais je décroche parfois' },
  { id: 'variable', emoji: '🔄', label: 'Pas vraiment, ça change tout le temps' },
  { id: 'none', emoji: '🤷🏾‍♀️', label: 'Je n’ai pas de routine du tout' },
];

export const BLOCKER_OPTIONS: {
  id: OnboardingBlockerId;
  emoji: string;
  label: string;
}[] = [
  { id: 'consistency', emoji: '⏱️', label: 'Manque de régularité' },
  { id: 'dont_know', emoji: '❓', label: 'Je ne sais pas ce qui me convient' },
  { id: 'no_structure', emoji: '📋', label: 'Pas de routine structurée' },
];

export const MAX_ONBOARDING_BLOCKERS = 3;

export function weeksFromResultsPace(pace: OnboardingResultsPaceId | string): number {
  const stop = RESULTS_PACE_WEEK_STOPS.find(s => s.id === pace);
  if (stop) return stop.weeks;
  if (pace in LEGACY_PACE_TO_WEEKS) return LEGACY_PACE_TO_WEEKS[pace];
  return DEFAULT_RESULTS_PACE_WEEKS;
}

export function weeksUntilGoalDate(goalDateIso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(goalDateIso)) return null;
  const target = new Date(`${goalDateIso}T12:00:00`);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 1;
  return Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
}
