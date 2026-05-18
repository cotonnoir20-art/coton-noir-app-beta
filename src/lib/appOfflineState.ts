import type { AppState, HairProfile } from '../context/AppContext';
import type { RoutinePlansState } from '../types/userRoutinePlan';
import { parseRoutinePlansState } from './userRoutinePlan';

const PROFILE_DRAFT_KEYS: (keyof HairProfile)[] = [
  'name',
  'hairType',
  'porosity',
  'density',
  'length',
  'objective',
  'targetLength',
  'objectiveTargetDate',
  'routineType',
  'problematics',
  'region',
  'climate',
  'budget',
  'careStyle',
];

export type OfflineAppSlice = {
  routineSteps: AppState['routineSteps'];
  plannedSoins: AppState['plannedSoins'];
  profileDraft?: Partial<HairProfile>;
  routinePlans?: RoutinePlansState;
};

export function pickOfflinePersistSlice(state: AppState): OfflineAppSlice {
  const profileDraft: Partial<HairProfile> = {};
  for (const key of PROFILE_DRAFT_KEYS) {
    const v = state.profile[key];
    if (v !== undefined && v !== null && v !== '') {
      (profileDraft as Record<string, unknown>)[key] = v;
    }
  }
  return {
    routineSteps: state.routineSteps,
    plannedSoins: state.plannedSoins,
    profileDraft: Object.keys(profileDraft).length > 0 ? profileDraft : undefined,
  };
}

export function mergeOfflineSlice(base: AppState, slice: OfflineAppSlice | null): AppState {
  if (!slice) return base;
  return {
    ...base,
    routineSteps: slice.routineSteps ?? base.routineSteps,
    plannedSoins: slice.plannedSoins ?? base.plannedSoins,
    profile: slice.profileDraft
      ? { ...base.profile, ...slice.profileDraft }
      : base.profile,
    routinePlans: slice.routinePlans ?? base.routinePlans,
  };
}

/** Valide un slice chargé depuis SecureStore. */
export function parseOfflineSlice(raw: {
  routineSteps?: unknown;
  plannedSoins?: unknown;
  profileDraft?: Record<string, unknown>;
  routinePlans?: unknown;
} | null): OfflineAppSlice | null {
  if (!raw?.routineSteps || !Array.isArray(raw.plannedSoins)) return null;
  const routinePlans = raw.routinePlans
    ? parseRoutinePlansState(raw.routinePlans) ?? undefined
    : undefined;
  return {
    routineSteps: raw.routineSteps as AppState['routineSteps'],
    plannedSoins: raw.plannedSoins as AppState['plannedSoins'],
    profileDraft: raw.profileDraft as Partial<HairProfile> | undefined,
    routinePlans,
  };
}
