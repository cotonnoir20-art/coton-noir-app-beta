import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CoinHistoryEntry } from '../context/AppContext';

export const COMEBACK_ABSENCE_DAYS = 14;
const DISMISS_KEY = '@coton_noir_comeback_dismissed_at';

export function hasHairActivity(
  coinHistory: CoinHistoryEntry[],
  lastRoutineDate: string | null | undefined,
): boolean {
  if (lastRoutineDate && /^\d{4}-\d{2}-\d{2}/.test(lastRoutineDate)) {
    return true;
  }
  return coinHistory.some(
    e =>
      e.amount > 0 &&
      /^\d{4}-\d{2}-\d{2}/.test(e.date) &&
      /routine|wash day|washday/i.test(e.label),
  );
}

export function daysSinceLastHairActivity(
  coinHistory: CoinHistoryEntry[],
  lastRoutineDate: string | null | undefined,
): number {
  const dates: string[] = [];
  if (lastRoutineDate && /^\d{4}-\d{2}-\d{2}/.test(lastRoutineDate)) {
    dates.push(lastRoutineDate.slice(0, 10));
  }
  for (const e of coinHistory) {
    if (e.amount > 0 && /^\d{4}-\d{2}-\d{2}/.test(e.date)) {
      if (/routine|wash day|washday/i.test(e.label)) {
        dates.push(e.date.slice(0, 10));
      }
    }
  }
  if (dates.length === 0) return 0;
  const latest = dates.sort().reverse()[0];
  const last = new Date(`${latest}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - last.getTime()) / 86400000));
}

export function shouldShowComebackBanner(
  coinHistory: CoinHistoryEntry[],
  lastRoutineDate: string | null | undefined,
): boolean {
  if (!hasHairActivity(coinHistory, lastRoutineDate)) return false;
  return daysSinceLastHairActivity(coinHistory, lastRoutineDate) >= COMEBACK_ABSENCE_DAYS;
}

export async function wasComebackDismissedRecently(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const age = Date.now() - new Date(raw).getTime();
    return age < 7 * 86400000;
  } catch {
    return false;
  }
}

export async function dismissComebackBanner(): Promise<void> {
  await AsyncStorage.setItem(DISMISS_KEY, new Date().toISOString());
}
