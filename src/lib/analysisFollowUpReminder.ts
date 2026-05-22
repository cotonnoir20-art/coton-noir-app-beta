import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isNativeNotificationsSupported,
  safeCancelScheduledNotification,
  safeGetNotificationPermissions,
  safeScheduleNotification,
} from './notificationsPlatform';
import { getWashdayReminderTime, parseReminderTime } from './washdayReminder';
import { loadUserPrefs } from './userPrefs';

export const ANALYSIS_FOLLOWUP_NOTIF_KEY = '@coton_noir_analysis_followup_notif_id';

const FOLLOWUP_DAYS = 14;

export function computeAnalysisFollowUpDate(fromIso?: string): Date | null {
  const base = fromIso ? new Date(fromIso) : new Date();
  if (Number.isNaN(base.getTime())) return null;
  const at = new Date(base);
  at.setDate(at.getDate() + FOLLOWUP_DAYS);
  at.setHours(9, 0, 0, 0);
  if (at.getTime() <= Date.now()) return null;
  return at;
}

export async function cancelAnalysisFollowUpReminder(): Promise<void> {
  if (!isNativeNotificationsSupported()) return;
  try {
    const id = await AsyncStorage.getItem(ANALYSIS_FOLLOWUP_NOTIF_KEY);
    if (id) {
      await safeCancelScheduledNotification(id);
      await AsyncStorage.removeItem(ANALYSIS_FOLLOWUP_NOTIF_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Rappel J+14 : nouvelle analyse ou mesure pour comparer l’évolution. */
export async function scheduleAnalysisFollowUpReminder(
  completedAtIso?: string,
): Promise<{ status: 'scheduled' | 'skipped' | 'denied' | 'none'; at?: Date }> {
  if (!isNativeNotificationsSupported()) return { status: 'skipped' };

  const prefs = await loadUserPrefs();
  if (prefs.notifEnabled === false) {
    await cancelAnalysisFollowUpReminder();
    return { status: 'none' };
  }

  const at = computeAnalysisFollowUpDate(completedAtIso);
  if (!at) {
    await cancelAnalysisFollowUpReminder();
    return { status: 'none' };
  }

  const granted = await safeGetNotificationPermissions();
  if (!granted) return { status: 'denied' };

  await cancelAnalysisFollowUpReminder();

  const timeStr = await getWashdayReminderTime();
  const { hour, minute } = parseReminderTime(timeStr);
  at.setHours(hour, minute, 0, 0);

  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return { status: 'skipped' };

  const id = await safeScheduleNotification({
    content: {
      title: 'Et tes cheveux, 2 semaines après ? 🔍',
      body: 'Refais une analyse ou une mesure pour voir si ton score progresse.',
      sound: true,
      data: {
        kind: 'analysis-followup',
        deeplink: '/(tabs)/analyze',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });

  if (!id) return { status: 'skipped' };

  await AsyncStorage.setItem(ANALYSIS_FOLLOWUP_NOTIF_KEY, id);
  return { status: 'scheduled', at };
}
