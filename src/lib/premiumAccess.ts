import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CoinHistoryEntry, GrowthEntry } from '../context/AppContext';
import { supabase } from './supabase';

export const FREE_ANALYSES_PER_MONTH = 2;
export const FREE_GROWTH_HISTORY_MONTHS = 3;
export const ROUTINE_INSIGHT_THRESHOLD = 3;

const MOMENT_SHOWN_PREFIX = '@coton_noir_premium_moment_shown_';

export function countRoutineValidations(history: CoinHistoryEntry[]): number {
  return history.filter(
    e => e.amount > 0 && (/routine/i.test(e.label) || /wash day/i.test(e.label)),
  ).length;
}

export function growthTrackingMonths(history: GrowthEntry[]): number {
  if (history.length === 0) return 0;
  const dates = history.map(h => h.date.slice(0, 7));
  const unique = new Set(dates);
  return unique.size;
}

export async function fetchMonthlyAnalysisCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count, error } = await supabase
      .from('hair_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function wasPremiumMomentShown(momentId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(`${MOMENT_SHOWN_PREFIX}${momentId}`)) === '1';
}

export async function markPremiumMomentShown(momentId: string): Promise<void> {
  await AsyncStorage.setItem(`${MOMENT_SHOWN_PREFIX}${momentId}`, '1');
}

export function applyPremiumCoinMultiplier(amount: number, hasPremiumAccess: boolean): number {
  return hasPremiumAccess ? amount * 2 : amount;
}
