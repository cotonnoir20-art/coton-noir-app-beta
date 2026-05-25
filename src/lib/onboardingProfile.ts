import type { HairProfile } from '../context/AppContext';
import type { CareStyle } from '../context/AppContext';
import { normalizeObjectiveId } from '../constants/hairObjectives';
import { normalizeProblematicLabels } from '../constants/hairProblematics';
import type { CareStyleId } from '../constants/careStyles';
import type {
  OnboardingBlockerId,
  OnboardingConfidenceId,
  OnboardingResultsPaceId,
  OnboardingRoutineConsistencyId,
} from '../constants/onboardingEmotional';

/** Profil capillaire en attente après inscription (hydrate ne lit pas le state React). */
export const PENDING_ONBOARDING_PROFILE_KEY = '@coton_noir_pending_onboarding_profile';

export type OnboardingProfileRow = {
  id: string;
  name: string;
  hair_type: string;
  hair_type_unsure: boolean;
  porosity: string;
  density: string;
  problematics: string[];
  hair_notes: string;
  hair_confidence: string;
  routine_consistency: string;
  hair_blockers: OnboardingBlockerId[];
  results_pace: OnboardingResultsPaceId;
  results_weeks: number;
  objective: string;
  length: string | null;
  target_length: string | null;
  target_goal_date: string | null;
  region: string;
  climate: string;
  budget: string;
  care_style: string;
  onboarding_done: boolean;
};

export function normalizeOnboardingHairType(
  code: string | undefined | null,
  unsure: boolean,
): string {
  const t = (code ?? '').trim();
  if (t) return t;
  return unsure ? '' : '3C';
}

export function buildOnboardingProfileRow(args: {
  userId: string;
  name: string;
  hairType: string;
  hairTypeUnsure: boolean;
  porosity: string;
  density: string;
  problematics: string[];
  hairNotes: string;
  confidence: OnboardingConfidenceId | '';
  routineConsistency: OnboardingRoutineConsistencyId | '';
  blockers: OnboardingBlockerId[];
  resultsPace: OnboardingResultsPaceId;
  resultsWeeks: number;
  objective: string;
  currentLength: string;
  targetLength: string;
  goalDateIso: string;
  regionLabel: string;
  regionClimate: string;
  budgetRange: string;
  careStyle: CareStyleId | '';
}): OnboardingProfileRow {
  return {
    id: args.userId,
    name: args.name.trim(),
    hair_type: normalizeOnboardingHairType(args.hairType, args.hairTypeUnsure),
    hair_type_unsure: args.hairTypeUnsure,
    porosity: args.porosity || 'Moyenne',
    density: args.density || 'Moyenne',
    problematics: normalizeProblematicLabels(args.problematics),
    hair_notes: args.hairNotes.trim(),
    hair_confidence: args.confidence || '',
    routine_consistency: args.routineConsistency || '',
    hair_blockers: args.blockers,
    results_pace: args.resultsPace,
    results_weeks: args.resultsWeeks,
    objective: normalizeObjectiveId(args.objective) || '',
    length: args.currentLength.trim() || null,
    target_length: args.targetLength.trim() || null,
    target_goal_date: args.targetLength.trim() ? args.goalDateIso : null,
    region: args.regionLabel,
    climate: args.regionClimate,
    budget: args.budgetRange,
    care_style: args.careStyle || '',
    onboarding_done: true,
  };
}

export function onboardingRowToHairProfile(row: OnboardingProfileRow): HairProfile {
  return {
    name: row.name,
    hairType: row.hair_type || (row.hair_type_unsure ? '' : '3C'),
    porosity: row.porosity,
    density: row.density,
    problematics: row.problematics ?? [],
    objective: row.objective,
    length: row.length ?? '',
    targetLength: row.target_length ?? '',
    objectiveTargetDate: row.target_goal_date ?? '',
    region: row.region,
    climate: row.climate,
    budget: row.budget,
    careStyle: (row.care_style || '') as CareStyle,
  };
}

export function buildOnboardingAuthMetadata(row: OnboardingProfileRow): Record<string, string | boolean> {
  return {
    name: row.name,
    hair_type: row.hair_type,
    hair_type_unsure: row.hair_type_unsure,
    porosity: row.porosity,
    density: row.density,
    onboarding_done: true,
  };
}

/** Valeur par défaut créée par le trigger Supabase avant l’upsert onboarding. */
export function isPlaceholderHairType(hairType: string | null | undefined): boolean {
  const t = (hairType ?? '').trim();
  return !t || t === '3C';
}

/**
 * Après inscription : le serveur peut encore avoir 3C (trigger) si l’upsert a raté
 * ou si l’hydrate lit avant la réplication. On préfère le profil onboarding local.
 */
export function mergePendingOnboardingProfile(
  server: HairProfile,
  pending: Partial<HairProfile> | null | undefined,
  pendingHairType?: string,
): HairProfile {
  if (!pending && !pendingHairType) return server;

  const hairFromPending =
    (pendingHairType ?? pending?.hairType ?? '').trim() ||
    (pending?.hairType ?? '').trim();

  const merged: HairProfile = {
    ...server,
    ...(pending ?? {}),
  };

  if (hairFromPending && (isPlaceholderHairType(server.hairType) || hairFromPending !== server.hairType)) {
    merged.hairType = hairFromPending;
  }

  return merged;
}

export async function savePendingOnboardingProfile(row: OnboardingProfileRow): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(
    PENDING_ONBOARDING_PROFILE_KEY,
    JSON.stringify(onboardingRowToHairProfile(row)),
  );
}

export async function loadPendingOnboardingProfile(): Promise<Partial<HairProfile> | null> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const raw = await AsyncStorage.getItem(PENDING_ONBOARDING_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<HairProfile>;
  } catch {
    return null;
  }
}

export async function clearPendingOnboardingProfile(): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.removeItem(PENDING_ONBOARDING_PROFILE_KEY);
}
