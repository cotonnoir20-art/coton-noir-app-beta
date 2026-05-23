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

let activeUserId: string | null = null;

function storageKey(): string {
  return activeUserId ? `${PREFS_KEY}:${activeUserId}` : PREFS_KEY;
}

/** Lie les préférences UI au compte connecté (évite le mélange entre utilisateurs). */
export function setActivePrefsUserId(userId: string | null): void {
  activeUserId = userId;
}

async function migrateLegacyPrefsIfNeeded(userId: string): Promise<void> {
  const userKey = `${PREFS_KEY}:${userId}`;
  try {
    const [userRaw, legacyRaw] = await Promise.all([
      AsyncStorage.getItem(userKey),
      AsyncStorage.getItem(PREFS_KEY),
    ]);
    if (!userRaw && legacyRaw) {
      await AsyncStorage.setItem(userKey, legacyRaw);
    }
  } catch {
    /* non bloquant */
  }
}

export async function prepareUserPrefs(userId: string | null): Promise<void> {
  setActivePrefsUserId(userId);
  if (userId) {
    await migrateLegacyPrefsIfNeeded(userId);
  }
}

export async function loadUserPrefs(): Promise<UserPrefs> {
  try {
    const raw = await AsyncStorage.getItem(storageKey());
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
  await AsyncStorage.setItem(storageKey(), JSON.stringify(next));
  return next;
}

export function rappelRoutineType(prefs: UserPrefs): RoutineType {
  return prefs.rappelRoutine === 'daily' ? 'daily' : 'night';
}
