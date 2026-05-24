import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STORAGE_KEY,
  type OnboardingPersistedState,
} from './onboardingStorage';

/** Repart de l’étape 1 du diagnostic (index 0) avant d’ouvrir l’onboarding. */
export async function resetOnboardingForNewDiagnostic(): Promise<void> {
  let merged: OnboardingPersistedState = { ...DEFAULT_ONBOARDING_STATE };
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OnboardingPersistedState>;
      merged = { ...merged, ...parsed, step: 0 };
    }
  } catch {
    /* garde défaut */
  }
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(merged));
}
