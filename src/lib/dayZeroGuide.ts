import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_KEY_PREFIX = '@coton_noir_day_zero_guide_seen';

function seenKey(userId: string | null): string {
  return userId ? `${SEEN_KEY_PREFIX}:${userId}` : SEEN_KEY_PREFIX;
}

export type DayZeroPrompt = 'routine_banner' | 'measure_popin' | 'none';

/**
 * J0 : une seule entrée guidée à la fois.
 * Priorité produit : définir la routine matin avant la première mesure.
 */
export function resolveDayZeroPrompt(args: {
  hasMeasurements: boolean;
  hasDailyRoutinePlan: boolean;
  hasAnyRoutineValidation: boolean;
  guideAlreadySeen: boolean;
}): DayZeroPrompt {
  if (args.guideAlreadySeen) return 'none';
  if (args.hasAnyRoutineValidation || args.hasMeasurements) return 'none';

  if (!args.hasDailyRoutinePlan) return 'routine_banner';
  if (!args.hasMeasurements) return 'measure_popin';
  return 'none';
}

export async function hasSeenDayZeroGuide(userId: string | null): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(seenKey(userId))) === '1';
  } catch {
    return false;
  }
}

export async function markDayZeroGuideSeen(userId: string | null): Promise<void> {
  try {
    await AsyncStorage.setItem(seenKey(userId), '1');
  } catch {
    /* ignore */
  }
}
