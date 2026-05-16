import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function safeRun(fn: () => void | Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    void fn();
  } catch {
    // indisponible sur émulateur / vieux devices
  }
}

export function hapticLight() {
  safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticMedium() {
  safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticHeavy() {
  safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

export function hapticSelection() {
  safeRun(() => Haptics.selectionAsync());
}

/** Succès : validation, copie, palier atteint */
export function hapticSuccess() {
  safeRun(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}
