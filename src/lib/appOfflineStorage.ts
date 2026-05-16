import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureKV } from './secureStorage';

/** Cache hors session (SecureStore) — jamais coins / historique / streak. */
export const OFFLINE_SLICE_KEY = 'coton_noir_offline_v1';

/** Ancien cache AsyncStorage en clair (migration + suppression). */
export const LEGACY_APP_STATE_KEY = '@coton_noir_state';

/** Slice JSON persisté hors ligne (forme libre, validée à la lecture). */
export type OfflineAppSlice = {
  routineSteps?: unknown;
  plannedSoins?: unknown[];
  profileDraft?: Record<string, unknown>;
};

export async function saveOfflineSlice(slice: OfflineAppSlice): Promise<void> {
  await secureKV.setItem(OFFLINE_SLICE_KEY, JSON.stringify(slice));
}

export async function loadOfflineSlice(): Promise<OfflineAppSlice | null> {
  try {
    const raw = await secureKV.getItem(OFFLINE_SLICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineAppSlice;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Supprime caches sensibles (logout + migration). */
export async function clearSensitiveAppStorage(): Promise<void> {
  await Promise.all([
    secureKV.removeItem(OFFLINE_SLICE_KEY),
    AsyncStorage.removeItem(LEGACY_APP_STATE_KEY),
  ]);
}

/** Retire l’ancien @coton_noir_state (économie en clair) une fois au démarrage. */
export async function migrateLegacyPlaintextCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEGACY_APP_STATE_KEY);
  } catch {}
}
