import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'expo-router';
import { PremiumPaywallModal } from '../components/premium/PremiumPaywallModal';
import type { PremiumMomentId } from '../data/premiumMoments';
import {
  FREE_ANALYSES_PER_MONTH,
  FREE_GROWTH_HISTORY_MONTHS,
  ROUTINE_INSIGHT_THRESHOLD,
  countRoutineValidations,
  fetchMonthlyAnalysisCount,
  growthTrackingMonths,
  markPremiumMomentShown,
  wasPremiumMomentShown,
} from '../lib/premiumAccess';
import {
  isTrialActive,
  loadPremiumTrial,
  startPremiumTrial,
  trialDaysRemaining,
  type PremiumTrialState,
} from '../lib/premiumTrial';
import { trackProductEvent } from '../lib/productAnalytics';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

type PremiumContextValue = {
  isPremium: boolean;
  hasAccess: boolean;
  trial: PremiumTrialState | null;
  trialDaysLeft: number;
  refreshPremium: () => Promise<void>;
  startTrial: () => Promise<void>;
  openPremium: (moment?: PremiumMomentId) => void;
  /** true = accès OK ; false = paywall affiché */
  requireAccess: (moment: PremiumMomentId, opts?: { block?: boolean }) => Promise<boolean>;
  maybeShowMoment: (moment: PremiumMomentId) => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const { state } = useApp();

  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [trial, setTrial] = useState<PremiumTrialState | null>(null);
  const [paywallMoment, setPaywallMoment] = useState<PremiumMomentId | null>(null);
  const [monthlyAnalyses, setMonthlyAnalyses] = useState(0);

  const refreshPremium = useCallback(async () => {
    const [trialState, analysisCount] = await Promise.all([
      loadPremiumTrial(),
      fetchMonthlyAnalysisCount(),
    ]);
    setTrial(trialState);
    setMonthlyAnalyses(analysisCount);

    const uid = session?.user?.id;
    if (!uid) {
      setIsPremium(false);
      setPremiumExpiresAt(null);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', uid)
      .maybeSingle();

    const premium = !!data?.is_premium;
    const expires = (data?.premium_expires_at as string) ?? null;
    const notExpired =
      !expires || new Date(expires).getTime() > Date.now();

    setIsPremium(premium && notExpired);
    setPremiumExpiresAt(expires);
  }, [session?.user?.id]);

  useEffect(() => {
    void refreshPremium();
  }, [refreshPremium, state.coinHistory.length]);

  const trialActive = isTrialActive(trial);
  const hasAccess = isPremium || trialActive;
  const trialDaysLeft = trialDaysRemaining(trial);

  const openPremium = useCallback(
    (moment?: PremiumMomentId) => {
      const q = moment ? `?moment=${moment}&trial=1` : '?trial=1';
      router.push(`/premium${q}` as any);
    },
    [router],
  );

  const startTrialFlow = useCallback(async () => {
    const source = paywallMoment ?? 'direct';
    const next = await startPremiumTrial();
    setTrial(next);
    void trackProductEvent('premium_trial_started', { source });
    setPaywallMoment(null);
    openPremium(source === 'direct' ? undefined : source);
  }, [openPremium, paywallMoment]);

  const requireAccess = useCallback(
    async (moment: PremiumMomentId, opts?: { block?: boolean }): Promise<boolean> => {
      if (hasAccess) return true;

      if (moment === 'analysis_limit') {
        const count = await fetchMonthlyAnalysisCount();
        setMonthlyAnalyses(count);
        if (count < FREE_ANALYSES_PER_MONTH) return true;
      }

      if (opts?.block !== false) {
        setPaywallMoment(moment);
      }
      return false;
    },
    [hasAccess],
  );

  const maybeShowMoment = useCallback(
    async (moment: PremiumMomentId) => {
      if (hasAccess) return;
      if (await wasPremiumMomentShown(moment)) return;

      let show = false;
      if (moment === 'routine_insight') {
        show = countRoutineValidations(state.coinHistory) >= ROUTINE_INSIGHT_THRESHOLD;
      } else if (moment === 'growth_history') {
        show = growthTrackingMonths(state.growthHistory) > FREE_GROWTH_HISTORY_MONTHS;
      } else if (moment === 'coins_multiplier') {
        show = state.totalEarned >= 100;
      }

      if (!show) return;
      await markPremiumMomentShown(moment);
      setPaywallMoment(moment);
      void trackProductEvent('premium_paywall_shown', { moment });
    },
    [hasAccess, state.coinHistory, state.growthHistory, state.totalEarned],
  );

  const value = useMemo<PremiumContextValue>(
    () => ({
      isPremium,
      hasAccess,
      trial,
      trialDaysLeft,
      refreshPremium,
      startTrial: startTrialFlow,
      openPremium,
      requireAccess,
      maybeShowMoment,
    }),
    [
      isPremium,
      hasAccess,
      trial,
      trialDaysLeft,
      refreshPremium,
      startTrialFlow,
      openPremium,
      requireAccess,
      maybeShowMoment,
    ],
  );

  return (
    <PremiumContext.Provider value={value}>
      {children}
      <PremiumPaywallModal
        visible={paywallMoment != null}
        momentId={paywallMoment}
        onClose={() => setPaywallMoment(null)}
        onStartTrial={() => void startTrialFlow()}
        onSeePlans={() => {
          const m = paywallMoment;
          setPaywallMoment(null);
          openPremium(m ?? undefined);
        }}
      />
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
