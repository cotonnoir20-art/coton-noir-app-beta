import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RoutineType } from '../data/routines';

export const PREFS_KEY = '@coton_noir_prefs';

export type RappelRoutineKind = 'daily' | 'night';

export type UserPrefs = {
  avatarEmoji?: string;
  avatarBg?: string;
  avatarPhoto?: string;
  isProtective?: boolean;
  protectiveType?: string;
  rappelHour?: number;
  rappelMin?: number;
  rappelRoutine?: RappelRoutineKind;
  notifEnabled?: boolean;
  langue?: string;
};

export const DEFAULT_USER_PREFS: Required<Pick<UserPrefs, 'rappelHour' | 'rappelMin' | 'rappelRoutine' | 'notifEnabled'>> = {
  rappelHour: 21,
  rappelMin: 0,
  rappelRoutine: 'night',
  notifEnabled: true,
};

export async function loadUserPrefs(): Promise<UserPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_USER_PREFS };
    const p = JSON.parse(raw) as UserPrefs;
    return {
      ...DEFAULT_USER_PREFS,
      ...p,
      rappelRoutine: p.rappelRoutine === 'daily' ? 'daily' : 'night',
    };
  } catch {
    return { ...DEFAULT_USER_PREFS };
  }
}

export async function saveUserPrefs(patch: UserPrefs): Promise<UserPrefs> {
  const current = await loadUserPrefs();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

export function rappelRoutineType(prefs: UserPrefs): RoutineType {
  return prefs.rappelRoutine === 'daily' ? 'daily' : 'night';
}
