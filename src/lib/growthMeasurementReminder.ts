import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GrowthEntry } from '../context/AppContext';
import {
  isNativeNotificationsSupported,
  safeCancelScheduledNotification,
  safeGetNotificationPermissions,
  safeScheduleNotification,
} from './notificationsPlatform';
import { getWashdayReminderTime, parseReminderTime } from './washdayReminder';
import { loadUserPrefs } from './userPrefs';

export const GROWTH_MONTHLY_NOTIF_KEY = '@coton_noir_growth_monthly_notif_id';

const INTERVAL_DAYS = 28;

function latestMeasurementDate(history: GrowthEntry[]): string | null {
  if (history.length === 0) return null;
  return [...history].map(e => e.date).sort().pop() ?? null;
}

/** Prochain rappel mensuel (~28 j après dernière mesure ou dans 7 j si aucune). */
export function computeNextGrowthReminderDate(
  history: GrowthEntry[],
  objectiveTargetDate?: string,
): Date | null {
  const timeStr = '09:00';
  const { hour, minute } = parseReminderTime(timeStr);

  const baseIso = latestMeasurementDate(history);
  const base = baseIso
    ? new Date(`${baseIso}T12:00:00`)
    : new Date();

  if (!baseIso) {
    base.setDate(base.getDate() + 7);
  } else {
    base.setDate(base.getDate() + INTERVAL_DAYS);
  }

  if (objectiveTargetDate && /^\d{4}-\d{2}-\d{2}$/.test(objectiveTargetDate)) {
    const goal = new Date(`${objectiveTargetDate}T12:00:00`);
    if (goal.getTime() < base.getTime() && goal.getTime() > Date.now()) {
      base.setTime(goal.getTime());
      base.setDate(base.getDate() - 14);
    }
  }

  base.setHours(hour, minute, 0, 0);
  if (base.getTime() <= Date.now()) {
    base.setDate(base.getDate() + INTERVAL_DAYS);
    base.setHours(hour, minute, 0, 0);
  }
  if (base.getTime() <= Date.now()) return null;
  return base;
}

export async function cancelGrowthMonthlyReminder(): Promise<void> {
  if (!isNativeNotificationsSupported()) return;
  try {
    const id = await AsyncStorage.getItem(GROWTH_MONTHLY_NOTIF_KEY);
    if (id) {
      await safeCancelScheduledNotification(id);
      await AsyncStorage.removeItem(GROWTH_MONTHLY_NOTIF_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function scheduleGrowthMonthlyReminder(
  history: GrowthEntry[],
  objectiveTargetDate?: string,
): Promise<{ status: 'scheduled' | 'skipped' | 'denied' | 'none'; at?: Date }> {
  if (!isNativeNotificationsSupported()) return { status: 'skipped' };

  const prefs = await loadUserPrefs();
  if (prefs.notifEnabled === false) {
    await cancelGrowthMonthlyReminder();
    return { status: 'none' };
  }

  const at = computeNextGrowthReminderDate(history, objectiveTargetDate);
  if (!at) {
    await cancelGrowthMonthlyReminder();
    return { status: 'none' };
  }

  const granted = await safeGetNotificationPermissions();
  if (!granted) return { status: 'denied' };

  await cancelGrowthMonthlyReminder();

  const timeStr = await getWashdayReminderTime();
  const { hour, minute } = parseReminderTime(timeStr);
  at.setHours(hour, minute, 0, 0);

  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return { status: 'skipped' };

  const id = await safeScheduleNotification({
    content: {
      title: 'Mesure ta longueur 📏',
      body: 'Un point mensuel suffit pour suivre ta pousse et alimenter ton anneau.',
      sound: true,
      data: {
        kind: 'growth-monthly',
        deeplink: '/hair-length',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });

  if (!id) return { status: 'skipped' };

  await AsyncStorage.setItem(GROWTH_MONTHLY_NOTIF_KEY, id);
  return { status: 'scheduled', at };
}
