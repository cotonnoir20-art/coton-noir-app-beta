import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_KEY = '@coton_noir_premium_trial_v1';
const FIRST_VALUE_KEY = '@coton_noir_premium_first_value_v1';
export const TRIAL_DAYS = 7;

export type PremiumTrialState = {
  startedAt: string;
  endsAt: string;
};

export type PremiumFirstValueKind = 'analysis' | 'box' | 'export' | 'routine_insight';

export async function loadPremiumTrial(): Promise<PremiumTrialState | null> {
  try {
    const raw = await AsyncStorage.getItem(TRIAL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PremiumTrialState;
    if (!p?.startedAt || !p?.endsAt) return null;
    return p;
  } catch {
    return null;
  }
}

export function isTrialActive(trial: PremiumTrialState | null, now = Date.now()): boolean {
  if (!trial) return false;
  return new Date(trial.endsAt).getTime() > now;
}

export function trialDaysRemaining(trial: PremiumTrialState | null, now = Date.now()): number {
  if (!trial) return 0;
  const diff = new Date(trial.endsAt).getTime() - now;
  return Math.max(0, Math.ceil(diff / 86400000));
}

export async function startPremiumTrial(): Promise<PremiumTrialState> {
  const started = new Date();
  const ends = new Date(started);
  ends.setDate(ends.getDate() + TRIAL_DAYS);
  const state: PremiumTrialState = {
    startedAt: started.toISOString(),
    endsAt: ends.toISOString(),
  };
  await AsyncStorage.setItem(TRIAL_KEY, JSON.stringify(state));
  return state;
}

export async function markPremiumFirstValue(kind: PremiumFirstValueKind): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(FIRST_VALUE_KEY);
    const list: PremiumFirstValueKind[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(kind)) {
      list.push(kind);
      await AsyncStorage.setItem(FIRST_VALUE_KEY, JSON.stringify(list));
    }
  } catch {
    /* ignore */
  }
}

export async function getPremiumFirstValues(): Promise<PremiumFirstValueKind[]> {
  try {
    const raw = await AsyncStorage.getItem(FIRST_VALUE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
