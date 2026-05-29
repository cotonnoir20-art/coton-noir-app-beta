import type { CareStyleId } from '../constants/careStyles';
import type {
  OnboardingBlockerId,
  OnboardingConfidenceId,
  OnboardingResultsPaceId,
  OnboardingRoutineConsistencyId,
} from '../constants/onboardingEmotional';

export const ONBOARDING_STORAGE_KEY = '@coton_noir_onboarding';
/** Après inscription : ouvrir l'onglet Analyse une fois. */
export const PENDING_POST_ONBOARDING_SCAN_KEY = '@coton_noir_pending_scan';
/** Resultat du scan initial onboarding - persist pour tout l ecosysteme app. */
export const INITIAL_SCAN_RESULT_KEY = '@coton_noir_initial_scan_v1';

export type OnboardingPersistedState = {
  step: number;
  hairType: string;
  hairTypeUnsure: boolean;
  porosity: string;
  density: string;
  problematics: string[];
  hairNotes: string;
  objective: string;
  confidence: OnboardingConfidenceId | '';
  routineConsistency: OnboardingRoutineConsistencyId | '';
  blockers: OnboardingBlockerId[];
  currentLength: string;
  targetLength: string;
  goalDateIso: string;
  resultsPace: OnboardingResultsPaceId;
  resultsWeeks: number;
  region: string;
  budget: string;
  careStyle: CareStyleId | '';
  name: string;
  email: string;
};

export const DEFAULT_ONBOARDING_STATE: OnboardingPersistedState = {
  step: 0,
  hairType: '',
  hairTypeUnsure: false,
  porosity: '',
  density: '',
  problematics: [],
  hairNotes: '',
  objective: '',
  confidence: '',
  routineConsistency: '',
  blockers: [],
  currentLength: '',
  targetLength: '',
  goalDateIso: '',
  resultsPace: 'balanced',
  resultsWeeks: 12,
  region: '',
  budget: '',
  careStyle: '',
  name: '',
  email: '',
};
