import type { HairProfile } from '../context/AppContext';
import { normalizeObjectiveId } from '../constants/hairObjectives';
import { supabase } from './supabase';

export type ProfileSyncResult =
  | { ok: true }
  | { ok: false; error: string };

export function buildProfileUpsertRow(
  userId: string,
  profile: HairProfile,
  onboardingDone: boolean,
) {
  return {
    id: userId,
    name: profile.name,
    hair_type: (profile.hairType ?? '').trim() || '3C',
    porosity: profile.porosity,
    density: profile.density,
    length: profile.length ?? '',
    objective: normalizeObjectiveId(profile.objective ?? ''),
    target_length: profile.targetLength ?? '',
    target_goal_date: profile.objectiveTargetDate ?? '',
    routine_type: profile.routineType ?? '',
    problematics: profile.problematics ?? [],
    region: profile.region ?? '',
    climate: profile.climate ?? '',
    budget: profile.budget ?? '',
    care_style: profile.careStyle ?? '',
    onboarding_done: onboardingDone,
  };
}

/** Écrit le profil capillaire dans `profiles` (sans toucher coins/streak). */
export async function syncProfileToServer(
  userId: string,
  profile: HairProfile,
  onboardingDone: boolean,
): Promise<ProfileSyncResult> {
  const row = buildProfileUpsertRow(userId, profile, onboardingDone);

  const { error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    if (__DEV__) {
      console.warn('[profileSync] upsert failed:', error.message, error.details);
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
