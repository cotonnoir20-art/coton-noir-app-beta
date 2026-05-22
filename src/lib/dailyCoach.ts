import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isNativeNotificationsSupported,
  safeCancelScheduledNotification,
  safeGetNotificationPermissions,
  safeScheduleNotification,
  safeSetupForegroundNotificationHandler,
} from './notificationsPlatform';

/**
 * Coach quotidien — notification locale à 8h00 du matin.
 *
 * Règle métier :
 *   - On planifie un push « Hydrate-toi 💧 » uniquement quand le **streak est
 *     en danger** : la dernière routine validée a eu lieu **hier** (J-1).
 *   - Sur web / PWA : no-op (API native indisponible).
 */

const SCHEDULED_ID_KEY = '@coton_noir_daily_coach_id';
const CATEGORY = 'daily-coach';

const COACH_HOUR = 8;
const COACH_MINUTE = 0;

let handlerRegistered = false;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function setupNotificationsHandler() {
  if (handlerRegistered || !isNativeNotificationsSupported()) return;
  handlerRegistered = true;
  void safeSetupForegroundNotificationHandler();
}

/** Demande la permission notifications (no-op web). */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativeNotificationsSupported()) return false;
  return safeGetNotificationPermissions();
}

export async function cancelDailyCoach(): Promise<void> {
  if (!isNativeNotificationsSupported()) return;
  try {
    const existing = await AsyncStorage.getItem(SCHEDULED_ID_KEY);
    if (existing) {
      await safeCancelScheduledNotification(existing);
      await AsyncStorage.removeItem(SCHEDULED_ID_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function shouldScheduleCoach(lastRoutineDate: string | null): boolean {
  if (!lastRoutineDate) return false;
  const today = todayISO();
  const yesterday = yesterdayISO();
  if (lastRoutineDate === today) return false;
  if (lastRoutineDate === yesterday) return true;
  return false;
}

function nextCoachDate(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(COACH_HOUR, COACH_MINUTE, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export async function scheduleDailyCoach(args: {
  lastRoutineDate: string | null;
  streak: number;
}): Promise<{ status: 'scheduled' | 'cancelled' | 'denied' | 'skipped'; at?: Date }> {
  if (!isNativeNotificationsSupported()) return { status: 'skipped' };

  if (!shouldScheduleCoach(args.lastRoutineDate)) {
    await cancelDailyCoach();
    return { status: 'cancelled' };
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return { status: 'denied' };

  await cancelDailyCoach();

  const at = nextCoachDate();
  const title = 'Hydrate-toi 💧';
  const body =
    args.streak >= 7
      ? `Ne casse pas ta série de ${args.streak} jours 🔥 — 5 min suffisent.`
      : "Ta routine d'hydratation t'attend pour garder ta série vivante.";

  const Notifications = await import('expo-notifications').catch(() => null);
  if (!Notifications) return { status: 'skipped' };

  const id = await safeScheduleNotification({
    content: {
      title,
      body,
      sound: true,
      categoryIdentifier: CATEGORY,
      data: {
        kind: 'daily-coach',
        deeplink: '/(tabs)/routine',
        routine: 'daily',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });

  if (!id) return { status: 'skipped' };

  await AsyncStorage.setItem(SCHEDULED_ID_KEY, id);
  return { status: 'scheduled', at };
}
