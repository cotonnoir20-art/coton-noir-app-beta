import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Coach quotidien — notification locale à 8h00 du matin.
 *
 * Règle métier :
 *   - On planifie un push « Hydrate-toi 💧 » uniquement quand le **streak est
 *     en danger** : la dernière routine validée a eu lieu **hier** (J-1).
 *     → Si elle valide aujourd'hui, le streak continue (cf. AppContext.computeNewStreak).
 *     → Si elle ne fait rien, le streak repart à 1 demain : on l'aide à l'éviter.
 *   - Si la dernière routine date d'aujourd'hui : pas besoin de relance.
 *   - Si elle date d'avant-hier ou plus : streak déjà cassé, pas la peine de
 *     spammer (on garde le ton bienveillant — on relancera quand elle reviendra).
 *   - Sur web : no-op (les notifs locales programmées ne fonctionnent pas
 *     de façon fiable hors d'une app installée).
 *
 * Idempotent : on stocke l'ID de la notif programmée pour pouvoir l'annuler
 * et re-planifier quand l'état change (validation routine, nouveau jour, etc.).
 */

const SCHEDULED_ID_KEY = '@coton_noir_daily_coach_id';
const CATEGORY         = 'daily-coach';

/** Heure de déclenchement du push quotidien. */
const COACH_HOUR   = 8;
const COACH_MINUTE = 0;

let handlerRegistered = false;

/** Format YYYY-MM-DD (jour local). */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Format YYYY-MM-DD pour J-1 (jour local). */
function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Configure le handler global (foreground display) — une seule fois par
 * cold start. À appeler le plus tôt possible dans le cycle de l'app.
 */
export function setupNotificationsHandler() {
  if (handlerRegistered || Platform.OS === 'web') return;
  handlerRegistered = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList:   true,
      shouldPlaySound:  true,
      shouldSetBadge:   false,
    }),
  });
}

/** Demande la permission notifications (no-op web). */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    if (settings.canAskAgain === false) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** Annule la notif coach déjà planifiée, le cas échéant. */
export async function cancelDailyCoach(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const existing = await AsyncStorage.getItem(SCHEDULED_ID_KEY);
    if (existing) {
      try { await Notifications.cancelScheduledNotificationAsync(existing); } catch {}
      await AsyncStorage.removeItem(SCHEDULED_ID_KEY);
    }
  } catch {}
}

/**
 * Calcule si on doit planifier la notif coach pour demain matin 8h,
 * en fonction de la dernière routine validée et de l'état actuel.
 *
 * @returns true → streak en danger, push à programmer
 *          false → routine déjà faite aujourd'hui OU streak déjà cassé
 */
export function shouldScheduleCoach(lastRoutineDate: string | null): boolean {
  if (!lastRoutineDate) return false; // Aucun streak en cours → rien à protéger
  const today     = todayISO();
  const yesterday = yesterdayISO();
  // Routine déjà faite aujourd'hui → rien à pousser
  if (lastRoutineDate === today) return false;
  // Hier (J-1) → streak en danger, on protège
  if (lastRoutineDate === yesterday) return true;
  // Avant-hier ou plus ancien → streak déjà cassé, pas de spam
  return false;
}

/**
 * Renvoie la prochaine occurrence (Date) de 08:00 strictement future.
 * - Si on est avant 8h aujourd'hui → aujourd'hui 08:00.
 * - Sinon → demain 08:00.
 */
function nextCoachDate(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(COACH_HOUR, COACH_MINUTE, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Planifie (ou re-planifie) le coach quotidien si la règle métier le justifie.
 *
 * À appeler :
 *   - au démarrage de l'app (après hydratation + auth),
 *   - après chaque `validateRoutine` (succès → on annule la relance prévue),
 *   - quand on bascule de jour (cas optionnel).
 */
export async function scheduleDailyCoach(args: {
  lastRoutineDate: string | null;
  streak: number;
}): Promise<{ status: 'scheduled' | 'cancelled' | 'denied' | 'skipped'; at?: Date }> {
  if (Platform.OS === 'web') return { status: 'skipped' };

  // Cas où il n'y a rien à pousser → on s'assure qu'aucune notif obsolète ne traîne.
  if (!shouldScheduleCoach(args.lastRoutineDate)) {
    await cancelDailyCoach();
    return { status: 'cancelled' };
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return { status: 'denied' };

  // On ré-arme à neuf : on annule l'ancien programme s'il existait,
  // puis on planifie une notif unique pour la prochaine 8h00.
  await cancelDailyCoach();

  const at = nextCoachDate();
  const title = 'Hydrate-toi 💧';
  const body  =
    args.streak >= 7
      ? `Ne casse pas ta série de ${args.streak} jours 🔥 — 5 min suffisent.`
      : 'Ta routine d\'hydratation t\'attend pour garder ta série vivante.';

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        categoryIdentifier: CATEGORY,
        data: { kind: 'daily-coach', deeplink: '/(tabs)/routine' },
      },
      // Date trigger absolu — fiable cross-platform pour un one-shot.
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
    await AsyncStorage.setItem(SCHEDULED_ID_KEY, id);
    return { status: 'scheduled', at };
  } catch {
    return { status: 'skipped' };
  }
}
