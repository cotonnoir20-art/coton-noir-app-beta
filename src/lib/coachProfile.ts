import type { HairProfile } from '../context/AppContext';

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
