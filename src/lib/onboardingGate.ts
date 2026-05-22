import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HairProfile } from '../context/AppContext';

const DONE_KEY_PREFIX = '@coton_noir_onboarding_done';

function doneKey(userId: string | null): string {
  return userId ? `${DONE_KEY_PREFIX}:${userId}` : DONE_KEY_PREFIX;
}

/** Profil diagnostic incomplet : pas d’objectif ou pas de style de soin. */
export function isProfileOnboardingIncomplete(profile: HairProfile): boolean {
  return !profile.objective?.trim() || !profile.careStyle?.trim();
}

export async function getOnboardingDoneLocal(userId: string | null): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(doneKey(userId))) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingDoneLocal(userId: string | null): Promise<void> {
  try {
    await AsyncStorage.setItem(doneKey(userId), '1');
  } catch {
    /* ignore */
  }
}

export async function needsOnboardingFlow(
  profile: HairProfile,
  userId: string | null,
  serverOnboardingDone?: boolean | null,
): Promise<boolean> {
  if (serverOnboardingDone === true) return false;
  if (await getOnboardingDoneLocal(userId)) return false;
  return isProfileOnboardingIncomplete(profile);
}
