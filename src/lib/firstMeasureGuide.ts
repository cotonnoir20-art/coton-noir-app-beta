import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@coton_noir_first_measure_guide_seen';

function storageKey(userId: string | null): string {
  return userId ? `${KEY_PREFIX}:${userId}` : KEY_PREFIX;
}

export async function hasSeenFirstMeasureGuide(userId: string | null): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(storageKey(userId));
    return v === '1';
  } catch {
    return false;
  }
}

export async function markFirstMeasureGuideSeen(userId: string | null): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), '1');
  } catch {
    /* ignore */
  }
}
