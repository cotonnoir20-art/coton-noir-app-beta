import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RoutineType } from '../data/routines';
import {
  isNativeNotificationsSupported,
  safeCancelScheduledNotification,
  safeGetNotificationPermissions,
  safeScheduleNotification,
} from './notificationsPlatform';
import { getProtectiveReminderBody } from './protectiveRoutine';
import {
  DEFAULT_USER_PREFS,
  loadUserPrefs,
  type UserPrefs,
} from './userPrefs';

const REMINDER_ID_KEY = '@coton_noir_routine_reminder_id';

const COPY: Record<'daily' | 'night', { title: string; body: string }> = {
  daily: {
    title: 'Routine du matin 🌤️',
    body: 'Tes étapes t’attendent — quelques minutes pour garder le rythme.',
  },
  night: {
    title: 'Routine du soir 🌙',
    body: 'Hydrate, protège (tresses, bonnet) — valide pour faire monter ton streak.',
  },
};

function nextTriggerDate(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export async function cancelRoutineReminder(): Promise<void> {
  if (!isNativeNotificationsSupported()) return;
  try {
    const existing = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (existing) {
      await safeCancelScheduledNotification(existing);
      await AsyncStorage.removeItem(REMINDER_ID_KEY);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Rappel quotidien à l’heure du profil (matin ou soir), si notifications activées.
 */
export async function scheduleRoutineReminder(
  prefs?: UserPrefs,
): Promise<{ status: 'scheduled' | 'cancelled' | 'denied' | 'skipped'; at?: Date }> {
  if (!isNativeNotificationsSupported()) return { status: 'skipped' };

  const p = prefs ?? (await loadUserPrefs());
  if (p.notifEnabled === false) {
    await cancelRoutineReminder();
    return { status: 'cancelled' };
  }

  const hour = p.rappelHour ?? DEFAULT_USER_PREFS.rappelHour;
  const minute = p.rappelMin ?? DEFAULT_USER_PREFS.rappelMin;
  const routine: RoutineType = p.rappelRoutine === 'daily' ? 'daily' : 'night';
  const copy = { ...COPY[routine] };
  if (routine === 'night' && p.isProtective) {
    copy.body = getProtectiveReminderBody(p.protectiveType);
  }

  const granted = await safeGetNotificationPermissions();
  if (!granted) return { status: 'denied' };

  await cancelRoutineReminder();

  const at = nextTriggerDate(hour, minute);

  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return { status: 'skipped' };

  const id = await safeScheduleNotification({
    content: {
      title: copy.title,
      body: copy.body,
      sound: true,
      data: {
        kind: 'routine-reminder',
        routine,
        deeplink: '/(tabs)/routine',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  if (!id) return { status: 'skipped' };

  await AsyncStorage.setItem(REMINDER_ID_KEY, id);
  return { status: 'scheduled', at };
}
