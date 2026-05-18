import type { AppState, HairProfile } from '../context/AppContext';
import type { RoutinePlansState } from '../types/userRoutinePlan';
import { mergePlanIntoRoutineSteps, parseRoutinePlansState } from './userRoutinePlan';
import type { RoutineType } from '../data/routines';

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
  const hasPlans = Object.values(state.routinePlans).some(Boolean);
  return {
    routineSteps: state.routineSteps,
    plannedSoins: state.plannedSoins,
    profileDraft: Object.keys(profileDraft).length > 0 ? profileDraft : undefined,
    routinePlans: hasPlans ? state.routinePlans : undefined,
  };
}

function syncStepsWithPlans(state: AppState): AppState {
  const routineSteps = { ...state.routineSteps };
  (['washday', 'daily', 'night'] as RoutineType[]).forEach(k => {
    const plan = state.routinePlans[k];
    if (plan) {
      routineSteps[k] = mergePlanIntoRoutineSteps(plan, plan, routineSteps[k]);
    }
  });
  return { ...state, routineSteps };
}

export function mergeOfflineSlice(base: AppState, slice: OfflineAppSlice | null): AppState {
  if (!slice) return base;
  const merged: AppState = {
    ...base,
    routineSteps: slice.routineSteps ?? base.routineSteps,
    plannedSoins: slice.plannedSoins ?? base.plannedSoins,
    profile: slice.profileDraft
      ? { ...base.profile, ...slice.profileDraft }
      : base.profile,
    routinePlans: slice.routinePlans ?? base.routinePlans,
  };
  return syncStepsWithPlans(merged);
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
