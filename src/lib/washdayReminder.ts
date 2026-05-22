import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlannedSoin } from '../context/AppContext';
import { getNextPlannedWashday } from './washdayHistory';
import {
  isNativeNotificationsSupported,
  safeCancelScheduledNotification,
  safeGetNotificationPermissions,
  safeScheduleNotification,
} from './notificationsPlatform';
import { loadUserPrefs } from './userPrefs';

export const WASHDAY_REMINDER_TIME_KEY = '@coton_noir_washday_reminder_time';
export const WASHDAY_REMINDER_NOTIF_KEY = '@coton_noir_washday_reminder_notif_id';
export const WASHDAY_GROWTH_NOTIF_KEY = '@coton_noir_washday_growth_notif_id';

const DEFAULT_REMINDER_TIME = '09:00';

export function parseReminderTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : 9, minute: Number.isFinite(m) ? m : 0 };
}

export async function getWashdayReminderTime(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(WASHDAY_REMINDER_TIME_KEY)) ?? DEFAULT_REMINDER_TIME;
  } catch {
    return DEFAULT_REMINDER_TIME;
  }
}

export async function setWashdayReminderTime(time: string): Promise<void> {
  await AsyncStorage.setItem(WASHDAY_REMINDER_TIME_KEY, time);
}

/** Déclenchement J-1 à l’heure choisie (null si déjà passé ou pas planifiable). */
export function computeWashdayReminderDate(
  washdayIso: string,
  hour: number,
  minute: number,
): Date | null {
  const wash = new Date(`${washdayIso}T12:00:00`);
  const trigger = new Date(wash);
  trigger.setDate(trigger.getDate() - 1);
  trigger.setHours(hour, minute, 0, 0);
  if (trigger.getTime() <= Date.now()) return null;
  return trigger;
}

export function formatWashdayReminderSub(
  plannedSoins: PlannedSoin[],
  timeStr: string,
): string {
  const next = getNextPlannedWashday(plannedSoins);
  if (!next) return 'Planifie un wash day pour activer le rappel la veille';
  const { hour, minute } = parseReminderTime(timeStr);
  const at = computeWashdayReminderDate(next.date, hour, minute);
  if (!at) return `Wash day le ${formatLongFr(next.date)} · rappel déjà passé`;
  const dayLabel = at.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  return `${dayLabel} · ${timeStr}`;
}

function formatLongFr(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export async function cancelWashdayReminder(): Promise<void> {
  if (!isNativeNotificationsSupported()) return;
  try {
    const id = await AsyncStorage.getItem(WASHDAY_REMINDER_NOTIF_KEY);
    if (id) {
      await safeCancelScheduledNotification(id);
      await AsyncStorage.removeItem(WASHDAY_REMINDER_NOTIF_KEY);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Rappel J-1 avant le prochain wash day planifié, à l’heure enregistrée.
 */
export async function scheduleWashdayReminder(
  plannedSoins: PlannedSoin[],
  timeStr?: string,
): Promise<{ status: 'scheduled' | 'skipped' | 'denied' | 'none'; at?: Date }> {
  if (!isNativeNotificationsSupported()) return { status: 'skipped' };

  const prefs = await loadUserPrefs();
  if (prefs.notifEnabled === false) {
    await cancelWashdayReminder();
    return { status: 'none' };
  }

  const next = getNextPlannedWashday(plannedSoins);
  if (!next) {
    await cancelWashdayReminder();
    return { status: 'none' };
  }

  const time = timeStr ?? (await getWashdayReminderTime());
  const { hour, minute } = parseReminderTime(time);
  const at = computeWashdayReminderDate(next.date, hour, minute);
  if (!at) {
    await cancelWashdayReminder();
    return { status: 'none' };
  }

  const granted = await safeGetNotificationPermissions();
  if (!granted) return { status: 'denied' };

  await cancelWashdayReminder();

  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return { status: 'skipped' };

  const id = await safeScheduleNotification({
    content: {
      title: 'Wash day demain 🚿',
      body: `Prépare tes produits — ${next.soinType} prévu demain.`,
      sound: true,
      data: {
        kind: 'washday-reminder',
        washdayDate: next.date,
        deeplink: '/washday',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });

  if (!id) return { status: 'skipped' };

  await AsyncStorage.setItem(WASHDAY_REMINDER_NOTIF_KEY, id);
  return { status: 'scheduled', at };
}

export async function cancelWashdayGrowthReminder(): Promise<void> {
  if (!isNativeNotificationsSupported()) return;
  try {
    const id = await AsyncStorage.getItem(WASHDAY_GROWTH_NOTIF_KEY);
    if (id) {
      await safeCancelScheduledNotification(id);
      await AsyncStorage.removeItem(WASHDAY_GROWTH_NOTIF_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Rappel mesure de pousse ~48 h après validation du wash day. */
export async function scheduleWashdayGrowthReminder(
  validatedAt: Date = new Date(),
): Promise<{ status: 'scheduled' | 'skipped' | 'denied' }> {
  if (!isNativeNotificationsSupported()) return { status: 'skipped' };

  const prefs = await loadUserPrefs();
  if (prefs.notifEnabled === false) {
    await cancelWashdayGrowthReminder();
    return { status: 'skipped' };
  }

  const granted = await safeGetNotificationPermissions();
  if (!granted) return { status: 'denied' };

  await cancelWashdayGrowthReminder();

  const at = new Date(validatedAt.getTime() + 48 * 3600000);
  const { hour, minute } = parseReminderTime(await getWashdayReminderTime());
  at.setHours(hour, minute, 0, 0);
  if (at.getTime() <= Date.now()) return { status: 'skipped' };

  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return { status: 'skipped' };

  const id = await safeScheduleNotification({
    content: {
      title: 'Mesure ta pousse 📏',
      body: '48 h après ton wash day — une mesure au même endroit pour suivre ta progression.',
      sound: true,
      data: {
        kind: 'washday-growth',
        deeplink: '/growth',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });

  if (!id) return { status: 'skipped' };

  await AsyncStorage.setItem(WASHDAY_GROWTH_NOTIF_KEY, id);
  return { status: 'scheduled' };
}
