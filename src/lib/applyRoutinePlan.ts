import type { HairAnalysis } from '../services/coachApi';
import type { RoutineType } from '../data/routines';
import type { UserRoutinePlan } from '../types/userRoutinePlan';

type SetPlanDispatch = (action: { type: 'setRoutinePlan'; plan: UserRoutinePlan }) => void;
import { planFromHairAnalysis } from './planFromHairAnalysis';
import { markAnalysisRoutineAdopted } from './analysisJourney';
import { trackProductEvent } from './productAnalytics';
import { validatePlan } from './userRoutinePlan';

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
