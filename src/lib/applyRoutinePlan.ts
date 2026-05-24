import type { HairProfile } from '../context/AppContext';
import type { HairAnalysis } from '../services/coachApi';
import type { RoutineType } from '../data/routines';
import type { UserRoutinePlan } from '../types/userRoutinePlan';
import { planFromHairAnalysis, planFromRecoSteps } from './planFromHairAnalysis';
import { markAnalysisRoutineAdopted } from './analysisJourney';
import { trackProductEvent } from './productAnalytics';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
} from './onboardingRecommendations';
import { validatePlan } from './userRoutinePlan';

type SetPlanDispatch = (action: { type: 'setRoutinePlan'; plan: UserRoutinePlan }) => void;

export function applyRoutinePlanToState(
  dispatch: SetPlanDispatch,
  plan: UserRoutinePlan,
): string | null {
  const err = validatePlan(plan);
  if (err) return err;
  dispatch({ type: 'setRoutinePlan', plan: { ...plan, updatedAt: new Date().toISOString() } });
  return null;
}

/** Applique le diagnostic IA en routine daily sans passer par l’éditeur. */
export function applyAnalysisRoutineNow(
  dispatch: SetPlanDispatch,
  routine: HairAnalysis['routine'],
  synthesis: string | undefined,
  kind: RoutineType = 'daily',
): string | null {
  const plan = planFromHairAnalysis(kind, routine, synthesis);
  const err = applyRoutinePlanToState(dispatch, plan);
  if (err) return err;
  void trackProductEvent('analysis_routine_adopted', { routine_type: kind, apply_mode: 'one_tap' });
  void markAnalysisRoutineAdopted();
  return null;
}

/** Applique la routine matin issue du profil + catalogue (pas les étapes libres de l’IA). */
export function applyProfileRoutineNow(
  dispatch: SetPlanDispatch,
  profile: HairProfile,
  synthesis?: string,
  kind: RoutineType = 'daily',
): string | null {
  const reco = buildOnboardingRecommendations(diagnosticSnapshotFromProfile(profile));
  const steps = kind === 'washday' ? reco.weekly : kind === 'night' ? reco.evening : reco.morning;
  const plan = planFromRecoSteps(kind, steps, 'Routine selon mon profil', synthesis);
  const err = applyRoutinePlanToState(dispatch, plan);
  if (err) return err;
  void trackProductEvent('profile_routine_adopted', { routine_type: kind, source: 'profile_catalog' });
  void markAnalysisRoutineAdopted();
  return null;
}
