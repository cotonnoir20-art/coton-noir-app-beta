import { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTINE_TYPES, RoutineStep, RoutineType } from '../data/routines';
import { getCurrentLevel, LEVELS } from '../data/levels';
import { hapticSuccess } from '../lib/haptics';
import { scheduleDailyCoach, cancelDailyCoach } from '../lib/dailyCoach';
import { supabase } from '../lib/supabase';
import { normalizeObjectiveId } from '../constants/hairObjectives';
import { useAuth } from './AuthContext';
import { buildDemoAppState, buildDemoPrefs, getDemoFixture, isDemoEmail } from '../data/demoUsers';
import {
  CC_ONBOARDING_GIFT,
  CC_PROFILE_COMPLETE,
  CC_STREAK_BONUS_30,
  CC_STREAK_BONUS_7,
  ONBOARDING_GIFT_LABEL,
  PENDING_ONBOARDING_GIFT_KEY,
  ensureOnboardingWallet,
  getRoutineValidationRewards,
  hasOnboardingGiftInHistory,
} from '../lib/cotonCoins';
import {
  getOnboardingDoneLocal,
  markOnboardingDoneLocal,
  needsOnboardingFlow,
} from '../lib/onboardingGate';
import {
  hasProfileCompleteBonusInHistory,
  isProfileComplete,
  PROFILE_COMPLETE_LABEL,
} from '../lib/profileCompleteness';
import { trackProductEvent } from '../lib/productAnalytics';
import { loadUserPrefs, prepareUserPrefs, setActivePrefsUserId, PREFS_KEY } from '../lib/userPrefs';
import { syncProfileToServer } from '../lib/profileSync';
import { isNativeNotificationsSupported } from '../lib/notificationsPlatform';
import { scheduleRoutineReminder } from '../lib/routineReminder';
import {
  scheduleWashdayGrowthReminder,
  scheduleWashdayReminder,
} from '../lib/washdayReminder';
import { scheduleGrowthMonthlyReminder } from '../lib/growthMeasurementReminder';
import { recordAnalysisJourneyValidation } from '../lib/analysisJourney';
import { normalizeProblematicLabels } from '../constants/hairProblematics';
import { resolvePorosity } from '../constants/hairProfileOptions';
import { buildGrowthMilestones, getHomeLengthMetrics } from '../lib/homeGrowth';
import type { BlackCottonTrigger, TriggerContext } from '../components/blackCotton/types';
import { buildPostRoutineContext } from '../lib/coachMoments';
import {
  applyReferralCodeOnServer,
  claimOnboardingGiftOnServer,
  grantCoinsOnServer,
  grantJournalEntryOnServer,
  refreshEconomyFromServer,
  spendCoinsOnServer,
  validateRoutineOnServer,
  type EconomyRpcResult,
  type EconomySnapshot,
} from '../lib/economyApi';
import {
  clearSensitiveAppStorage,
  loadOfflineSlice as loadOfflineSliceRaw,
  migrateLegacyPlaintextCache,
  saveOfflineSlice,
} from '../lib/appOfflineStorage';
import {
  mergeOfflineSlice,
  parseOfflineSlice,
  pickOfflinePersistSlice,
} from '../lib/appOfflineState';
import type { RoutinePlansState, UserRoutinePlan } from '../types/userRoutinePlan';
import { emptyRoutinePlans, mergePlanIntoRoutineSteps } from '../lib/userRoutinePlan';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
  recoStepsToRoutineSteps,
  routineStepsMatchCatalog,
} from '../lib/onboardingRecommendations';
import {
  clearRoutinePlansStorage,
  loadRoutinePlans,
  saveRoutinePlans,
} from '../lib/routinePlanStorage';
import {
  clearPendingOnboardingProfile,
  isPlaceholderHairType,
  loadPendingOnboardingProfile,
  mergePendingOnboardingProfile,
} from '../lib/onboardingProfile';

/** Au-delà, on considère un hydrate / import batch — pas de haptique « niveau atteint ». */
const MAX_SINGLE_GAIN_FOR_LEVEL_HAPTIC = 400;

export type CoinHistoryEntry = {
  id: number;
  label: string;
  amount: number;
  date: string;
};

/** Préférence de soin : produits du commerce / recettes DIY / mixte des deux. */
export type CareStyle = '' | 'shop' | 'diy' | 'mix';

export type HairProfile = {
  name: string;
  hairType: string;
  porosity: string;
  density: string;
  length: string;
  objective: string;
  targetLength?: string;
  /** Date cible objectif longueur (YYYY-MM-DD), sync `profiles.target_goal_date`. */
  objectiveTargetDate?: string;
  routineType?: string;
  problematics?: string[];
  region?: string;
  climate?: string;
  budget?: string;
  /** "shop" → produits commerce · "diy" → recettes maison · "mix" → les deux. */
  careStyle?: CareStyle;
  /** Confiance capillaire : "getting_there" | "frustrated" | "overwhelmed" */
  hairConfidence?: string;
  /** Régularité routine : "very_consistent" | "somewhat" | "variable" | "none" */
  routineConsistency?: string;
  /** Freins capillaires (ids) : ["consistency", "dont_know", "no_structure", …] */
  hairBlockers?: string[];
};

function resolveCoachDisplayName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'Username';
  return trimmed.split(/\s+/)[0];
}

export type GrowthEntry = {
  id: number;
  date: string;
  zone: string;
  cm: number;
};

export type PlannedSoin = {
  id: number;
  soinType: string;
  date: string; // "YYYY-MM-DD"
  products?: string;
  notes?: string;
  hairState?: string;
  ratingStars?: number;
  ratingNote?: string;
  reminderHour?: number;
  reminderMinute?: number;
};

type RoutineStepsState = Record<RoutineType, RoutineStep[]>;
type ValidatedState    = Record<RoutineType, boolean>;

export type AppState = {
  coins: number;
  totalEarned: number; // Cumul total gagné (jamais décrémenté → sert au calcul de niveau)
  streak: number;
  lastRoutineDate: string | null;
  /** Date d'inscription (ISO yyyy-mm-dd) — affichée sur le profil. */
  memberSince: string | null;
  profile: HairProfile;
  routineSteps: RoutineStepsState;
  validated: ValidatedState;
  coinHistory: CoinHistoryEntry[];
  growthHistory: GrowthEntry[];
  plannedSoins: PlannedSoin[];
  /** Plans personnalisés (nom, produits, étapes, commentaires) par type de routine */
  routinePlans: RoutinePlansState;
};

type Action =
  | { type: 'toggleRoutineStep'; routineType: RoutineType; stepId: number }
  | { type: 'validateRoutine'; routineType: RoutineType }
  | { type: 'addCoins'; amount: number; label: string }
  | { type: 'spendCoins'; amount: number; label: string }
  | { type: 'updateProfile'; payload: Partial<HairProfile> }
  | { type: 'addGrowthEntry'; entry: Omit<GrowthEntry, 'id'> }
  | { type: 'planSoin'; soin: Omit<PlannedSoin, 'id'> }
  | { type: 'removePlannedSoin'; id: number }
  | { type: 'updatePlannedSoin'; id: number; soin: Omit<PlannedSoin, 'id'> }
  | { type: 'hydrate'; payload: AppState }
  | { type: 'grantOnboardingGift' }
  | { type: 'applyEconomySnapshot'; payload: EconomySnapshot }
  | { type: 'applyRecoRoutineSteps'; daily: RoutineStep[]; evening: RoutineStep[] }
  | { type: 'loadRoutinePlans'; plans: RoutinePlansState }
  | { type: 'setRoutinePlan'; plan: UserRoutinePlan }
  | { type: 'clearRoutinePlan'; kind: RoutineType }
  | { type: 'reset' };

function makeInitialSteps(): RoutineStepsState {
  const keys = Object.keys(ROUTINE_TYPES) as RoutineType[];
  return Object.fromEntries(
    keys.map(k => [k, ROUTINE_TYPES[k].steps.map(s => ({ ...s, done: false }))])
  ) as RoutineStepsState;
}

const initialState: AppState = {
  coins: 0,
  totalEarned: 0,
  streak: 0,
  lastRoutineDate: null,
  memberSince: null,
  profile: {
    name: 'Utilisatrice',
    hairType: '3C',
    porosity: 'Moyenne',
    density: 'Épaisse',
    length: '',
    objective: '',
  },
  routineSteps: makeInitialSteps(),
  validated: { washday: false, daily: false, night: false },
  coinHistory: [],
  growthHistory: [],
  plannedSoins: [],
  routinePlans: emptyRoutinePlans(),
};

// ── Calcul du streak basé sur la dernière date de routine ──────────────────
function computeNewStreak(currentStreak: number, lastRoutineDate: string | null): number {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (lastRoutineDate === today)      return currentStreak; // Déjà validée aujourd'hui
  if (lastRoutineDate === yesterday)  return currentStreak + 1; // Hier → on continue
  return 1; // Gap > 1 jour → on repart de 1
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'reset':
      return initialState;

    case 'hydrate':
      return action.payload;

    case 'applyEconomySnapshot':
      return {
        ...state,
        coins:           action.payload.coins,
        totalEarned:     action.payload.totalEarned,
        streak:          action.payload.streak,
        lastRoutineDate: action.payload.lastRoutineDate,
        coinHistory:     action.payload.coinHistory,
        validated:       action.payload.validated,
      };

    case 'grantOnboardingGift': {
      const already =
        state.coins >= CC_ONBOARDING_GIFT && hasOnboardingGiftInHistory(state.coinHistory);
      if (already) return state;
      const today = new Date().toISOString().slice(0, 10);
      const hasEntry = hasOnboardingGiftInHistory(state.coinHistory);
      return {
        ...state,
        coins:       Math.max(state.coins, CC_ONBOARDING_GIFT),
        totalEarned: Math.max(state.totalEarned, CC_ONBOARDING_GIFT),
        coinHistory: hasEntry
          ? state.coinHistory
          : [
              { id: Date.now(), label: ONBOARDING_GIFT_LABEL, amount: CC_ONBOARDING_GIFT, date: today },
              ...state.coinHistory,
            ],
      };
    }

    case 'applyRecoRoutineSteps': {
      const applyKind = (kind: 'daily' | 'night', next: RoutineStep[]) => {
        if (state.routinePlans[kind] != null) return state.routineSteps[kind];
        return next;
      };
      return {
        ...state,
        routineSteps: {
          ...state.routineSteps,
          daily: applyKind('daily', action.daily),
          night: applyKind('night', action.evening),
        },
      };
    }

    case 'loadRoutinePlans': {
      const routineSteps = { ...state.routineSteps };
      (Object.keys(action.plans) as RoutineType[]).forEach(k => {
        const plan = action.plans[k];
        if (plan) {
          routineSteps[k] = mergePlanIntoRoutineSteps(
            plan,
            plan,
            state.routineSteps[k],
          );
        }
      });
      return { ...state, routinePlans: action.plans, routineSteps };
    }

    case 'setRoutinePlan': {
      const plan = { ...action.plan, updatedAt: new Date().toISOString() };
      const prevPlan = state.routinePlans[plan.kind];
      const steps = mergePlanIntoRoutineSteps(
        plan,
        prevPlan,
        state.routineSteps[plan.kind],
      );
      return {
        ...state,
        routinePlans: { ...state.routinePlans, [plan.kind]: plan },
        routineSteps: { ...state.routineSteps, [plan.kind]: steps },
      };
    }

    case 'clearRoutinePlan': {
      const kind = action.kind;
      const defaultSteps = ROUTINE_TYPES[kind].steps.map(s => ({ ...s, done: false }));
      return {
        ...state,
        routinePlans: { ...state.routinePlans, [kind]: null },
        routineSteps: { ...state.routineSteps, [kind]: defaultSteps },
      };
    }

    case 'toggleRoutineStep':
      return {
        ...state,
        routineSteps: {
          ...state.routineSteps,
          [action.routineType]: state.routineSteps[action.routineType].map(s =>
            s.id === action.stepId ? { ...s, done: !s.done } : s
          ),
        },
      };

    case 'validateRoutine': {
      if (state.validated[action.routineType]) {
        return state;
      }
      const today      = new Date().toISOString().slice(0, 10);
      const isWashday  = action.routineType === 'washday';
      const { cc: baseCc, pts: basePts } = getRoutineValidationRewards(action.routineType);
      const label      = isWashday
        ? 'Wash day effectué'
        : `Routine ${ROUTINE_TYPES[action.routineType].label} complétée`;
      const newStreak  = computeNewStreak(state.streak, state.lastRoutineDate);

      // Streak bonus — une seule fois par palier (uniquement si le streak a changé)
      const streakChanged = state.lastRoutineDate !== today;
      const streakBonus =
        streakChanged && newStreak > 0 && newStreak % 30 === 0 ? CC_STREAK_BONUS_30 :
        streakChanged && newStreak > 0 && newStreak % 7  === 0 ? CC_STREAK_BONUS_7 : 0;

      const newEntries: CoinHistoryEntry[] = [
        { id: Date.now(), label, amount: baseCc, date: today },
      ];
      if (streakBonus > 0) {
        newEntries.push({ id: Date.now() + 1, label: `Streak ${newStreak} jours 🔥`, amount: streakBonus, date: today });
      }

      return {
        ...state,
        validated:       { ...state.validated, [action.routineType]: true },
        coins:           state.coins + baseCc + streakBonus,
        totalEarned:     state.totalEarned + basePts,
        streak:          newStreak,
        lastRoutineDate: today,
        coinHistory:     [...newEntries, ...state.coinHistory],
      };
    }

    case 'addCoins':
      return {
        ...state,
        coins:       state.coins + action.amount,
        totalEarned: state.totalEarned + action.amount,
        coinHistory: [
          { id: Date.now(), label: action.label, amount: action.amount, date: new Date().toISOString().slice(0, 10) },
          ...state.coinHistory,
        ],
      };

    case 'spendCoins':
      return {
        ...state,
        coins: Math.max(0, state.coins - action.amount),
        // totalEarned ne change pas lors d'une dépense (niveaux non régressifs)
        coinHistory: [
          { id: Date.now(), label: action.label, amount: -action.amount, date: new Date().toISOString().slice(0, 10) },
          ...state.coinHistory,
        ],
      };

    case 'updateProfile':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'addGrowthEntry':
      return {
        ...state,
        growthHistory: [...state.growthHistory, { ...action.entry, id: Date.now() }],
      };

    case 'planSoin':
      return {
        ...state,
        plannedSoins: [...state.plannedSoins, { ...action.soin, id: Date.now() }],
      };

    case 'removePlannedSoin':
      return {
        ...state,
        plannedSoins: state.plannedSoins.filter(s => s.id !== action.id),
      };

    case 'updatePlannedSoin':
      return {
        ...state,
        plannedSoins: state.plannedSoins.map(s =>
          s.id === action.id ? { ...action.soin, id: s.id } : s
        ),
      };

    default:
      return state;
  }
}

/** Niveau gagné lors du dernier passage de palier — sert à déclencher la célébration. */
export type LevelDef = (typeof LEVELS)[number];

function hasAnyRoutineValidationInHistory(history: CoinHistoryEntry[]): boolean {
  return history.some(
    e =>
      e.amount > 0 &&
      (e.label.includes('Routine') || e.label.includes('Wash day')),
  );
}

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** Hydratation Supabase / cache terminée pour la session courante. */
  isAppReady: boolean;
  /** Rediriger vers l’onboarding (profil incomplet). */
  needsOnboarding: boolean;
  /** Message Black Cotton en attente (trigger + contexte optionnel). */
  pendingBc: { trigger: BlackCottonTrigger; ctx?: TriggerContext } | null;
  queueBcTrigger: (trigger: BlackCottonTrigger, ctx?: TriggerContext) => void;
  clearPendingBc: () => void;
  /** Cadeau 50 CC à célébrer avant le popup first_login. */
  celebrateOnboardingGift: boolean;
  clearCelebrateOnboardingGift: () => void;
  /** Compte démo : logique locale uniquement (pas de RPC économie). */
  isDemoAccount: boolean;
  /** Niveau atteint en attente d'être célébré (null si rien à fêter). */
  pendingLevelUp: LevelDef | null;
  /** Ferme la célébration (modal). */
  dismissLevelUp: () => void;
  validateRoutineSecure: (routineType: RoutineType) => Promise<EconomyRpcResult>;
  grantCoinsSecure: (args: {
    amount: number;
    label: string;
    points?: number;
    idempotencyKey?: string;
  }) => Promise<EconomyRpcResult>;
  spendCoinsSecure: (
    amount: number,
    label: string,
    meta?: { rewardId?: string },
  ) => Promise<EconomyRpcResult>;
  claimOnboardingGiftSecure: () => Promise<EconomyRpcResult>;
  refreshEconomySecure: () => Promise<EconomyRpcResult>;
  grantJournalEntrySecure: (args: {
    kind: 'soin' | 'routine';
    label: string;
    entryDate?: string;
  }) => Promise<EconomyRpcResult>;
  applyReferralCodeSecure: (code: string) => Promise<EconomyRpcResult & { referralError?: string }>;
  /** Force l’envoi du profil capillaire vers Supabase (ex. avant déconnexion). */
  flushProfileSync: (profileOverride?: HairProfile) => Promise<boolean>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const userEmail = session?.user?.email ?? null;

  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Refs pour tracker ce qui est déjà synchronisé ──
  const syncReady          = useRef(false);
  const hadSession         = useRef(false); // true dès qu'on a eu un userId → distingue logout vs chargement initial
  const lastSyncedProfile  = useRef('__NONE__');
  const lastSyncedCoins    = useRef(-1);
  const lastSyncedStreak   = useRef(-1);
  const syncedCoinCount    = useRef(0);
  const syncedGrowthCount  = useRef(0);
  // Suit quels types de routine ont déjà été loggés cette session
  const loggedRoutines     = useRef<Set<RoutineType>>(new Set());
  const routinePlansReady  = useRef(false);
  // Compte de démo : on désactive tous les syncs Supabase pour ne pas polluer
  // la DB. Les données vivent uniquement en mémoire + cache local.
  const isDemo             = useRef(false);

  /** Ref pour détection « niveau atteint » (ignore les hydratations > +400 CC d’un coup). */
  const prevCoinsForLevelHaptic = useRef<number | null>(null);
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelDef | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pendingBc, setPendingBc] = useState<{
    trigger: BlackCottonTrigger;
    ctx?: TriggerContext;
  } | null>(null);
  const [celebrateOnboardingGift, setCelebrateOnboardingGift] = useState(false);
  const serverOnboardingDoneRef = useRef(false);
  const profileCompleteGrantStarted = useRef(false);

  const clearPendingBc = useCallback(() => setPendingBc(null), []);
  const clearCelebrateOnboardingGift = useCallback(() => setCelebrateOnboardingGift(false), []);
  const queueBcTrigger = useCallback((t: BlackCottonTrigger, ctx?: TriggerContext) => {
    setPendingBc({ trigger: t, ctx });
  }, []);

  useEffect(() => {
    const pts = state.totalEarned;
    const prev = prevCoinsForLevelHaptic.current;
    if (prev === null) {
      prevCoinsForLevelHaptic.current = pts;
      return;
    }
    const delta = pts - prev;
    if (delta <= 0) {
      prevCoinsForLevelHaptic.current = pts;
      return;
    }
    const oldLevel = getCurrentLevel(prev);
    const newLevel = getCurrentLevel(pts);
    if (newLevel.id > oldLevel.id && delta <= MAX_SINGLE_GAIN_FOR_LEVEL_HAPTIC) {
      hapticSuccess();
      setPendingLevelUp(newLevel);
      void trackProductEvent('level_up', {
        level_id: newLevel.id,
        level_name: newLevel.name,
        total_earned: pts,
      });
    }
    prevCoinsForLevelHaptic.current = pts;
  }, [state.totalEarned]);

  const dismissLevelUp = () => setPendingLevelUp(null);

  const applyEconomySnapshot = useCallback((snapshot: EconomySnapshot) => {
    dispatch({ type: 'applyEconomySnapshot', payload: snapshot });
    lastSyncedCoins.current = snapshot.coins;
    lastSyncedStreak.current = snapshot.streak;
    syncedCoinCount.current = snapshot.coinHistory.length;
    loggedRoutines.current = new Set(
      (Object.keys(snapshot.validated) as RoutineType[]).filter(t => snapshot.validated[t]),
    );
  }, []);

  const refreshEconomySecure = useCallback(async (): Promise<EconomyRpcResult> => {
    if (!userId || isDemo.current) return { ok: false, error: 'unavailable' };
    try {
      const snapshot = await refreshEconomyFromServer(userId);
      applyEconomySnapshot(snapshot);
      return { ok: true, snapshot };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [userId, applyEconomySnapshot]);

  const validateRoutineSecure = useCallback(async (routineType: RoutineType): Promise<EconomyRpcResult> => {
    const wasFirstRoutine = !hasAnyRoutineValidationInHistory(state.coinHistory);

    if (isDemo.current) {
      dispatch({ type: 'validateRoutine', routineType });
      const nextStreak = computeNewStreak(state.streak, state.lastRoutineDate);
      if (wasFirstRoutine) {
        queueBcTrigger('first_routine', {
          text: `Félicitations ${resolveCoachDisplayName(state.profile.name)} ! 🖤`,
        });
        void trackProductEvent('first_routine_validated', { routine_type: routineType });
      } else {
        queueBcTrigger('post_routine', buildPostRoutineContext({
          streak: nextStreak,
          routineType,
          profile: state.profile,
          isFirstRoutine: false,
        }));
      }
      if (nextStreak === 7) queueBcTrigger('streak_7_days');
      if (nextStreak === 30) queueBcTrigger('streak_30_days');
      void trackProductEvent('routine_validated', { routine_type: routineType });
      void recordAnalysisJourneyValidation();
      void cancelDailyCoach();
      if (routineType === 'washday') {
        void scheduleWashdayGrowthReminder();
      }
      return { ok: true };
    }
    const result = await validateRoutineOnServer(routineType);
    if (result.ok && result.snapshot) {
      applyEconomySnapshot(result.snapshot);
      if (!result.alreadyDone) {
        void trackProductEvent('routine_validated', { routine_type: routineType });
        void recordAnalysisJourneyValidation();
        void cancelDailyCoach();
        if (routineType === 'washday') {
          void scheduleWashdayGrowthReminder();
        }
        const newStreak = result.snapshot.streak;
        if (wasFirstRoutine) {
          queueBcTrigger('first_routine', {
            text: `Félicitations ${resolveCoachDisplayName(state.profile.name)} ! 🖤`,
          });
          void trackProductEvent('first_routine_validated', { routine_type: routineType });
        } else {
          queueBcTrigger('post_routine', buildPostRoutineContext({
            streak: newStreak,
            routineType,
            profile: state.profile,
            isFirstRoutine: false,
          }));
        }
        if (newStreak === 7) queueBcTrigger('streak_7_days');
        if (newStreak === 30) queueBcTrigger('streak_30_days');
      }
    } else if (!result.ok) {
      void refreshEconomySecure();
    }
    return result;
  }, [
    applyEconomySnapshot,
    refreshEconomySecure,
    state.coinHistory,
    state.streak,
    state.profile,
    queueBcTrigger,
  ]);

  const grantCoinsSecure = useCallback(async (args: {
    amount: number;
    label: string;
    points?: number;
    idempotencyKey?: string;
  }): Promise<EconomyRpcResult> => {
    if (isDemo.current) {
      dispatch({ type: 'addCoins', amount: args.amount, label: args.label });
      return { ok: true };
    }
    const result = await grantCoinsOnServer(args);
    if (result.ok && result.snapshot) applyEconomySnapshot(result.snapshot);
    return result;
  }, [applyEconomySnapshot]);

  const spendCoinsSecure = useCallback(async (
    amount: number,
    label: string,
    meta?: { rewardId?: string },
  ): Promise<EconomyRpcResult> => {
    if (isDemo.current) {
      dispatch({ type: 'spendCoins', amount, label });
      void trackProductEvent('reward_redeemed', {
        cost: amount,
        reward_name: label,
        reward_id: meta?.rewardId ?? null,
      });
      return { ok: true };
    }
    const result = await spendCoinsOnServer(amount, label);
    if (result.ok && result.snapshot) {
      applyEconomySnapshot(result.snapshot);
      void trackProductEvent('reward_redeemed', {
        cost: amount,
        reward_name: label,
        reward_id: meta?.rewardId ?? null,
      });
    }
    return result;
  }, [applyEconomySnapshot]);

  const claimOnboardingGiftSecure = useCallback(async (): Promise<EconomyRpcResult> => {
    if (isDemo.current) {
      dispatch({ type: 'grantOnboardingGift' });
      setCelebrateOnboardingGift(true);
      queueBcTrigger('onboarding_gift');
      return { ok: true };
    }
    const result = await claimOnboardingGiftOnServer();
    if (result.ok && result.snapshot) {
      applyEconomySnapshot(result.snapshot);
      if (!result.alreadyDone) {
        setCelebrateOnboardingGift(true);
        queueBcTrigger('onboarding_gift');
      }
    }
    return result;
  }, [applyEconomySnapshot, queueBcTrigger]);

  const tryGrantProfileCompleteBonus = useCallback(async () => {
    if (!userId || isDemo.current || profileCompleteGrantStarted.current) return;
    if (!isProfileComplete(state.profile)) return;
    if (hasProfileCompleteBonusInHistory(state.coinHistory)) return;

    profileCompleteGrantStarted.current = true;
    const result = await grantCoinsOnServer({
      amount: CC_PROFILE_COMPLETE,
      label: PROFILE_COMPLETE_LABEL,
      idempotencyKey: `profile_complete:${userId}`,
    });
    if (result.ok && result.snapshot) {
      applyEconomySnapshot(result.snapshot);
      queueBcTrigger('profile_completed');
    } else {
      profileCompleteGrantStarted.current = false;
    }
  }, [userId, state.profile, state.coinHistory, applyEconomySnapshot, queueBcTrigger]);

  const grantJournalEntrySecure = useCallback(async (args: {
    kind: 'soin' | 'routine';
    label: string;
    entryDate?: string;
  }): Promise<EconomyRpcResult> => {
    if (isDemo.current) {
      const amount = args.kind === 'soin' ? 30 : 10;
      dispatch({ type: 'addCoins', amount, label: args.label });
      return { ok: true };
    }
    const result = await grantJournalEntryOnServer(args);
    if (result.ok && result.snapshot) applyEconomySnapshot(result.snapshot);
    return result;
  }, [applyEconomySnapshot]);

  const applyReferralCodeSecure = useCallback(async (code: string) => {
    if (isDemo.current) {
      return { ok: false, referralError: 'demo_account', error: 'demo_account' };
    }
    const result = await applyReferralCodeOnServer(code);
    if (result.ok && result.snapshot) applyEconomySnapshot(result.snapshot);
    return result;
  }, [applyEconomySnapshot]);

  // ── Coach quotidien : re-planifie la notif locale 8h "Hydrate-toi" si la
  // streak est en danger (dernière routine = hier). Voir src/lib/dailyCoach.ts.
  // On laisse passer un court délai pour ne pas déclencher sur l'état initial
  // (avant hydratation AsyncStorage / Supabase).
  useEffect(() => {
    const t = setTimeout(() => {
      scheduleDailyCoach({
        lastRoutineDate: state.lastRoutineDate,
        streak:          state.streak,
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [state.lastRoutineDate, state.streak]);

  // Migration : supprimer l’ancien cache @coton_noir_state (économie en clair).
  useEffect(() => {
    void migrateLegacyPlaintextCache();
  }, []);

  // Plans de routine personnalisés (hors comptes démo — données injectées par fixture)
  useEffect(() => {
    if (isDemoEmail(userEmail)) {
      routinePlansReady.current = true;
      return;
    }
    let cancelled = false;
    void loadRoutinePlans().then(plans => {
      if (cancelled) return;
      routinePlansReady.current = true;
      dispatch({ type: 'loadRoutinePlans', plans });
    });
    return () => { cancelled = true; };
  }, [userEmail]);

  useEffect(() => {
    if (!routinePlansReady.current || isDemoEmail(userEmail)) return;
    void saveRoutinePlans(state.routinePlans);
  }, [state.routinePlans, userEmail]);

  // Étapes recommandées du diagnostic → onglet Routine + carte accueil (si pas de plan perso).
  useEffect(() => {
    if (!routinePlansReady.current) return;
    if (!state.profile.careStyle) return;

    const needsDaily =
      !state.routinePlans.daily && routineStepsMatchCatalog(state.routineSteps.daily, 'daily');
    const needsNight =
      !state.routinePlans.night && routineStepsMatchCatalog(state.routineSteps.night, 'night');
    if (!needsDaily && !needsNight) return;

    const reco = buildOnboardingRecommendations(diagnosticSnapshotFromProfile(state.profile));
    dispatch({
      type: 'applyRecoRoutineSteps',
      daily: needsDaily
        ? recoStepsToRoutineSteps(reco.morning, state.routineSteps.daily)
        : state.routineSteps.daily,
      evening: needsNight
        ? recoStepsToRoutineSteps(reco.evening, state.routineSteps.night)
        : state.routineSteps.night,
    });
  }, [
    state.profile.careStyle,
    state.profile.hairType,
    state.profile.porosity,
    state.profile.density,
    state.profile.objective,
    state.routinePlans.daily,
    state.routinePlans.night,
    state.routineSteps.daily,
    state.routineSteps.night,
  ]);

  // Hors session : routines / soins planifiés uniquement (SecureStore, pas d’économie).
  useEffect(() => {
    if (userId) return;
    let cancelled = false;
    void loadOfflineSliceRaw().then(raw => {
      if (cancelled) return;
      const slice = parseOfflineSlice(raw);
      if (!slice) return;
      dispatch({
        type: 'hydrate',
        payload: mergeOfflineSlice(initialState, slice),
      });
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (userId) return;
    void saveOfflineSlice(pickOfflinePersistSlice(state));
  }, [userId, state.routineSteps, state.plannedSoins, state.profile, state.routinePlans]);

  useEffect(() => {
    void scheduleWashdayReminder(state.plannedSoins);
  }, [state.plannedSoins]);

  const milestoneCelebrationReady = useRef(false);
  const milestoneDoneRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isAppReady) return;
    const metrics = getHomeLengthMetrics(state);
    const milestones = buildGrowthMilestones(metrics.currentCm, metrics.targetCm);
    const doneCm = new Set(
      milestones.filter(m => m.status === 'done').map(m => m.cm),
    );

    if (!milestoneCelebrationReady.current) {
      milestoneDoneRef.current = doneCm;
      milestoneCelebrationReady.current = true;
      return;
    }

    for (const cm of doneCm) {
      if (!milestoneDoneRef.current.has(cm)) {
        queueBcTrigger('hair_growth_progress');
        break;
      }
    }
    milestoneDoneRef.current = doneCm;
  }, [
    isAppReady,
    state.growthHistory,
    state.profile.targetLength,
    state.profile.length,
    queueBcTrigger,
  ]);

  useEffect(() => {
    void scheduleGrowthMonthlyReminder(
      state.growthHistory,
      state.profile.objectiveTargetDate,
    );
  }, [state.growthHistory, state.profile.objectiveTargetDate]);

  // ── Chargement Supabase au login ──
  useEffect(() => {
    if (!userId) {
      // Ne réinitialiser que si on avait déjà une session (vrai logout).
      // Au démarrage, userId est null le temps que l'auth restaure la session —
      // on ne doit pas effacer les données locales dans ce cas.
      if (hadSession.current) {
        syncReady.current = false;
        isDemo.current = false;
        loggedRoutines.current = new Set();
        setActivePrefsUserId(null);
        dispatch({ type: 'reset' });
        void clearSensitiveAppStorage();
        routinePlansReady.current = false;
        void clearRoutinePlansStorage();
        cancelDailyCoach().catch(() => {});
      }
      return;
    }
    hadSession.current = true;
    void prepareUserPrefs(userId);

    // ── Compte de démonstration : on injecte une fixture et on coupe tous
    //    les syncs Supabase (la donnée vit uniquement en mémoire + cache).
    if (isDemoEmail(userEmail)) {
      const fixture = getDemoFixture(userEmail!);
      if (fixture) {
        isDemo.current = true;
        // Marqueurs « tout est déjà sync » pour que les useEffect de sync
        // ne déclenchent rien même si l'utilisateur joue avec l'app.
        const demoState = buildDemoAppState(fixture, initialState);
        lastSyncedProfile.current = JSON.stringify(demoState.profile);
        lastSyncedCoins.current   = demoState.coins;
        lastSyncedStreak.current  = demoState.streak;
        syncedCoinCount.current   = demoState.coinHistory.length;
        syncedGrowthCount.current = demoState.growthHistory.length;

        // Préférences (avatar, mode protecteur, etc.) consommées par
        // profile.tsx et la home. On écrit avant la première lecture.
        AsyncStorage.setItem(
          `${PREFS_KEY}:${userId}`,
          JSON.stringify(buildDemoPrefs(fixture)),
        ).catch(() => {});
        // Évite que le popup pantry s'ouvre pendant la démo
        AsyncStorage.setItem('pantry_popup_seen', '1').catch(() => {});

        dispatch({ type: 'hydrate', payload: demoState });
        syncReady.current = true;
        setIsAppReady(true);
        setNeedsOnboarding(false);
        return;
      }
    }

    isDemo.current = false;
    setIsAppReady(false);
    profileCompleteGrantStarted.current = false;
    serverOnboardingDoneRef.current = false;

    (async () => {
      try {
      const today = new Date().toISOString().slice(0, 10);

      const pendingGift =
        (await AsyncStorage.getItem(PENDING_ONBOARDING_GIFT_KEY)) === '1';

      const pendingOnboardingProfile = await loadPendingOnboardingProfile();

      const offlineSlice = parseOfflineSlice(await loadOfflineSliceRaw());
      const localState = mergeOfflineSlice(initialState, offlineSlice);

      const { data: { session: authSession } } = await supabase.auth.getSession();

      const [
        { data: profile },
        { data: coinRows },
        { data: growthRows },
        { data: todayLogs },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase
          .from('coin_history').select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('growth_history').select('*')
          .eq('user_id', userId)
          .order('date', { ascending: true }),
        supabase
          .from('routine_logs').select('routine_type')
          .eq('user_id', userId)
          .gte('logged_at', `${today}T00:00:00`)
          .lte('logged_at', `${today}T23:59:59`),
      ]);

      const coinHistory: CoinHistoryEntry[] = (coinRows ?? []).map((e: any) => ({
        id: e.id,
        label: e.label,
        amount: e.amount,
        date: e.date,
      }));

      const growthHistory: GrowthEntry[] = (growthRows ?? []).map((e: any) => ({
        id: e.id,
        date: e.date,
        zone: e.zone,
        cm: Number(e.cm),
      }));

      if (profile) {
        const serverProfile: HairProfile = {
          name:         profile.name         ?? authSession?.user?.user_metadata?.name ?? 'Utilisatrice',
          hairType:     profile.hair_type    ?? '3C',
          porosity:     resolvePorosity(profile.porosity),
          density:      profile.density      ?? 'Épaisse',
          length:       profile.length       ?? '',
          objective:    normalizeObjectiveId(profile.objective ?? ''),
          targetLength: profile.target_length ?? '',
          objectiveTargetDate: profile.target_goal_date ?? '',
          routineType:  profile.routine_type  ?? '',
          problematics: normalizeProblematicLabels(profile.problematics),
          region:       profile.region        ?? '',
          climate:      profile.climate       ?? '',
          budget:       profile.budget        ?? '',
          careStyle:         (profile.care_style          ?? '') as CareStyle,
          hairConfidence:    profile.hair_confidence      ?? '',
          routineConsistency: profile.routine_consistency ?? '',
          hairBlockers:      profile.hair_blockers        ?? [],
        };

        const metaHairType =
          typeof authSession?.user?.user_metadata?.hair_type === 'string'
            ? authSession.user.user_metadata.hair_type.trim()
            : '';

        const hydratedProfile = mergePendingOnboardingProfile(
          serverProfile,
          pendingOnboardingProfile,
          metaHairType,
        );

        if (pendingOnboardingProfile || pendingGift) {
          await clearPendingOnboardingProfile();
        }

        const hairCorrectedFromOnboarding =
          !!pendingOnboardingProfile &&
          isPlaceholderHairType(serverProfile.hairType) &&
          !!hydratedProfile.hairType &&
          hydratedProfile.hairType !== serverProfile.hairType;

        if (hairCorrectedFromOnboarding && userId) {
          void syncProfileToServer(userId, hydratedProfile, true).then(result => {
            if (result.ok) {
              lastSyncedProfile.current = JSON.stringify(hydratedProfile);
            }
          });
        }

        lastSyncedProfile.current = JSON.stringify(hydratedProfile);
        lastSyncedCoins.current   = profile.coins;
        lastSyncedStreak.current  = profile.streak;
        syncedCoinCount.current   = coinHistory.length;
        syncedGrowthCount.current = growthHistory.length;

        // Reconstruire validated + loggedRoutines depuis les logs du jour
        const validatedToday = (todayLogs ?? []).map((r: any) => r.routine_type as RoutineType);
        validatedToday.forEach(t => loggedRoutines.current.add(t));

        const validated: ValidatedState = {
          washday: validatedToday.includes('washday'),
          daily:   validatedToday.includes('daily'),
          night:   validatedToday.includes('night'),
        };

        // Économie : vérité serveur uniquement (évite afficher +50 CC locaux puis -40 à la validation)
        const computedTotalEarned = (coinRows ?? []).reduce(
          (sum: number, e: any) => sum + Math.max(0, e.amount), 0,
        );
        let totalEarned = Number((profile as any).total_earned) || computedTotalEarned;
        let coins = Number(profile.coins) || 0;
        let history = coinHistory;
        let streak = Number(profile.streak) || 0;
        let lastRoutineDate = profile.last_routine_date ?? null;
        let validatedState = validated;

        const needsOnboardingGift =
          pendingGift ||
          (coins < CC_ONBOARDING_GIFT && !hasOnboardingGiftInHistory(history));

        if (needsOnboardingGift) {
          const claim = await claimOnboardingGiftOnServer();
          if (claim.ok && claim.snapshot) {
            if (pendingGift) {
              await AsyncStorage.removeItem(PENDING_ONBOARDING_GIFT_KEY);
            }
            const s = claim.snapshot;
            coins = s.coins;
            totalEarned = s.totalEarned;
            history = s.coinHistory;
            streak = s.streak;
            lastRoutineDate = s.lastRoutineDate;
            validatedState = s.validated;
            loggedRoutines.current = new Set(
              (Object.keys(s.validated) as RoutineType[]).filter(t => s.validated[t]),
            );
            if (!claim.alreadyDone || pendingGift) {
              setCelebrateOnboardingGift(true);
              setPendingBc({ trigger: 'onboarding_gift' });
            }
          }
        }

        serverOnboardingDoneRef.current = !!(profile as { onboarding_done?: boolean }).onboarding_done;

        const createdAt = authSession?.user?.created_at;
        const memberSince = createdAt ? createdAt.slice(0, 10) : null;

        lastSyncedCoins.current = coins;

        dispatch({
          type: 'hydrate',
          payload: {
            ...localState,
            profile:         hydratedProfile,
            coins,
            totalEarned,
            streak,
            lastRoutineDate,
            memberSince,
            coinHistory:     history,
            growthHistory,
            validated:     validatedState,
          },
        });
      } else {
        const wallet = ensureOnboardingWallet({
          coins: 0,
          totalEarned: 0,
          coinHistory: [],
        });

        const metaHairType =
          typeof authSession?.user?.user_metadata?.hair_type === 'string'
            ? authSession.user.user_metadata.hair_type.trim()
            : '';

        const fallbackProfile = mergePendingOnboardingProfile(
          localState.profile,
          pendingOnboardingProfile,
          metaHairType,
        );

        if (pendingOnboardingProfile) {
          await clearPendingOnboardingProfile();
        }

        lastSyncedProfile.current = JSON.stringify(fallbackProfile);
        lastSyncedStreak.current  = 0;
        lastSyncedCoins.current   = wallet.coins;
        syncedCoinCount.current   = wallet.coinHistory.length;
        syncedGrowthCount.current = 0;

        const createdAt = authSession?.user?.created_at;
        const memberSince = createdAt ? createdAt.slice(0, 10) : null;

        dispatch({
          type: 'hydrate',
          payload: {
            ...localState,
            profile: fallbackProfile,
            coins: wallet.coins,
            totalEarned: wallet.totalEarned,
            coinHistory: wallet.coinHistory as CoinHistoryEntry[],
            growthHistory: [],
            memberSince,
          },
        });
      }

      void clearSensitiveAppStorage().then(() =>
        saveOfflineSlice(pickOfflinePersistSlice(localState)),
      );

      syncReady.current = true;
      setIsAppReady(true);
      if (isNativeNotificationsSupported()) {
        void loadUserPrefs().then(p => {
          void scheduleRoutineReminder(p);
        });
      }
      } catch (e) {
        if (__DEV__) console.error('[AppContext] profile load failed', e);
        syncReady.current = true;
        setIsAppReady(true);
      }
    })();
  }, [userId, userEmail]);

  useEffect(() => {
    if (!isAppReady || !userId || isDemo.current) {
      setNeedsOnboarding(false);
      return;
    }
    void needsOnboardingFlow(
      state.profile,
      userId,
      serverOnboardingDoneRef.current,
    ).then(setNeedsOnboarding);
  }, [isAppReady, userId, state.profile.objective, state.profile.careStyle]);

  useEffect(() => {
    if (!isAppReady || !userId || isDemo.current) return;
    void tryGrantProfileCompleteBonus();
  }, [isAppReady, userId, state.profile, state.coinHistory.length, tryGrantProfileCompleteBonus]);

  // ── Sync profil (sans économie — coins/streak côté serveur uniquement) ──
  const flushProfileSync = useCallback(async (profileOverride?: HairProfile): Promise<boolean> => {
    if (!syncReady.current || !userId || isDemo.current) return true;

    const profile = profileOverride ?? state.profile;
    const profileJson = JSON.stringify(profile);
    if (profileJson === lastSyncedProfile.current) return true;

    const onboardingDone =
      serverOnboardingDoneRef.current ||
      isProfileComplete(profile);

    const result = await syncProfileToServer(userId, profile, onboardingDone);
    if (result.ok) {
      lastSyncedProfile.current = profileJson;
      if (onboardingDone) serverOnboardingDoneRef.current = true;
      return true;
    }
    return false;
  }, [userId, state.profile]);

  useEffect(() => {
    if (!syncReady.current || !userId || isDemo.current) return;

    const profileJson = JSON.stringify(state.profile);
    if (profileJson === lastSyncedProfile.current) return;

    const onboardingDone =
      serverOnboardingDoneRef.current ||
      isProfileComplete(state.profile);

    let cancelled = false;
    void (async () => {
      const result = await syncProfileToServer(userId, state.profile, onboardingDone);
      if (cancelled) return;
      if (result.ok) {
        lastSyncedProfile.current = profileJson;
        if (onboardingDone) serverOnboardingDoneRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.profile, userId]);

  // ── Sync nouvelles mesures growth_history → Supabase ──
  useEffect(() => {
    if (!syncReady.current || !userId || isDemo.current) return;
    const currentCount = state.growthHistory.length;
    if (currentCount <= syncedGrowthCount.current) return;

    const newEntries = state.growthHistory.slice(syncedGrowthCount.current);
    syncedGrowthCount.current = currentCount;

    supabase.from('growth_history').insert(
      newEntries.map(e => ({
        user_id: userId,
        date:    e.date,
        zone:    e.zone,
        cm:      e.cm,
      }))
    );
  }, [state.growthHistory, userId]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        isAppReady,
        needsOnboarding,
        pendingBc,
        queueBcTrigger,
        clearPendingBc,
        celebrateOnboardingGift,
        clearCelebrateOnboardingGift,
        isDemoAccount: isDemo.current,
        pendingLevelUp,
        dismissLevelUp,
        validateRoutineSecure,
        grantCoinsSecure,
        spendCoinsSecure,
        claimOnboardingGiftSecure,
        refreshEconomySecure,
        grantJournalEntrySecure,
        applyReferralCodeSecure,
        flushProfileSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider');
  return ctx;
}
