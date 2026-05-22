import type { HairProfile } from '../context/AppContext';
import type { RoutinePlansState } from '../types/userRoutinePlan';
import { planFeedbackSnippet } from './userRoutinePlan';
import type { RoutineType } from '../data/routines';
import type { UserPrefs } from './userPrefs';

/** Champs autorisés vers le coach IA (aligné Edge Function PROFILE_KEYS). */
const COACH_PROFILE_KEYS = [
  'hairType',
  'porosity',
  'density',
  'length',
  'targetLength',
  'routineType',
  'budget',
  'region',
  'climate',
  'objective',
  'careStyle',
] as const;

/**
 * Profil minimal pour le coach — exclut nom, email, historique, etc.
 */
export function pickCoachProfileFields(
  profile: HairProfile | Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!profile) return {};
  const out: Record<string, string> = {};
  for (const key of COACH_PROFILE_KEYS) {
    const v = (profile as Record<string, unknown>)[key];
    if (v == null || v === '') continue;
    if (typeof v === 'string' || typeof v === 'number') {
      out[key] = String(v).slice(0, 120);
    }
  }
  return out;
}

const ROUTINE_KINDS: RoutineType[] = ['daily', 'night', 'washday'];

/**
 * Profil coach enrichi : diagnostic + notes de routine + mode protecteur.
 */
export function buildCoachProfilePayload(
  profile: HairProfile | Record<string, unknown> | null | undefined,
  options?: {
    routinePlans?: RoutinePlansState | null;
    prefs?: Pick<UserPrefs, 'isProtective' | 'protectiveType'> | null;
  },
): Record<string, string> {
  const out = pickCoachProfileFields(profile);

  if (options?.prefs?.isProtective) {
    out.protectiveMode = 'active';
    if (options.prefs.protectiveType?.trim()) {
      out.protectiveStyle = options.prefs.protectiveType.trim().slice(0, 80);
    }
  }

  const plans = options?.routinePlans;
  if (plans) {
    for (const kind of ROUTINE_KINDS) {
      const plan = plans[kind];
      if (!plan) continue;
      const snippet = planFeedbackSnippet(plan).trim();
      if (snippet) {
        out[`routineNotes_${kind}`] = snippet.slice(0, 280);
      }
    }
  }

  return out;
}
