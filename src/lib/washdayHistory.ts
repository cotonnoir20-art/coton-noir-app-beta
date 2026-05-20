import type { CoinHistoryEntry, PlannedSoin } from '../context/AppContext';
import { toLocalISODate } from './homeGrowth';

/** Entrée coin_history correspondant à un wash day validé. */
export function isWashdayHistoryEntry(label: string): boolean {
  const l = label.toLowerCase();
  return l.includes('wash day') || l.includes('washday');
}

export function getWashdayHistoryEntries(coinHistory: CoinHistoryEntry[]): CoinHistoryEntry[] {
  return coinHistory.filter(e => isWashdayHistoryEntry(e.label));
}

export function formatWashdayHistoryDate(iso: string): { d: string; m: string } {
  const date = new Date(iso + 'T12:00:00');
  return {
    d: String(date.getDate()),
    m: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
  };
}

export function getCompletedWashdayDaysInMonth(
  coinHistory: CoinHistoryEntry[],
  year: number,
  month: number,
): Set<number> {
  const days = new Set<number>();
  getWashdayHistoryEntries(coinHistory).forEach(e => {
    const d = new Date(e.date + 'T12:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      days.add(d.getDate());
    }
  });
  return days;
}

export type WashdayCalendarMonthMarkers = {
  /** Jours du mois avec wash day validé (coin_history). */
  completedDays: Set<number>;
  /** Jours du mois avec un wash day planifié à venir (aujourd’hui inclus si pas encore validé). */
  plannedDays: Set<number>;
  /** Wash day planifié dans le passé mais jamais validé → considéré comme non fait. */
  missedDays: Set<number>;
};

export function getWashdayCompletedDateSet(coinHistory: CoinHistoryEntry[]): Set<string> {
  return new Set(getWashdayHistoryEntries(coinHistory).map(e => e.date));
}

export function isWashdayCompletedOnDate(
  iso: string,
  coinHistory: CoinHistoryEntry[],
): boolean {
  return getWashdayCompletedDateSet(coinHistory).has(iso);
}

/** Marqueurs calendrier wash day — source unique accueil + page Wash day. */
export function buildWashdayCalendarMonthMarkers(
  year: number,
  /** Mois 0-indexé (janvier = 0), comme `Date.getMonth()`. */
  month: number,
  plannedSoins: PlannedSoin[],
  coinHistory: CoinHistoryEntry[],
  todayIso?: string,
): WashdayCalendarMonthMarkers {
  const today = todayIso ?? toLocalISODate(new Date());
  const completedIso = getWashdayCompletedDateSet(coinHistory);
  const completedDays = getCompletedWashdayDaysInMonth(coinHistory, year, month);
  const plannedDays = new Set<number>();
  const missedDays = new Set<number>();

  for (const s of plannedSoins) {
    const d = new Date(s.date + 'T12:00:00');
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    if (completedIso.has(s.date)) continue;

    const dayNum = d.getDate();
    if (s.date < today) {
      missedDays.add(dayNum);
    } else {
      plannedDays.add(dayNum);
    }
  }

  return { completedDays, plannedDays, missedDays };
}

export function isWashdayCalendarToday(
  year: number,
  month: number,
  dayNum: number,
  todayStr: string,
): boolean {
  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  return iso === todayStr;
}

export function countWashdaysInMonth(
  coinHistory: CoinHistoryEntry[],
  year: number,
  month: number,
): number {
  return getCompletedWashdayDaysInMonth(coinHistory, year, month).size;
}

/** Intervalle moyen en jours entre deux wash days (≥ 2 entrées). */
export function averageWashdayIntervalDays(entries: CoinHistoryEntry[]): number | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].map(e => e.date).sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1] + 'T12:00:00').getTime();
    const b = new Date(sorted[i] + 'T12:00:00').getTime();
    gaps.push(Math.round((b - a) / 86400000));
  }
  return Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
}

const MONTH_LABELS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
] as const;

export type MonthlyWashdayCount = {
  label: string;
  year: number;
  month: number;
  count: number;
};

/** Wash days par mois sur les 6 derniers mois calendaires. */
export function buildLast6MonthsWashdayFrequency(
  coinHistory: CoinHistoryEntry[],
): MonthlyWashdayCount[] {
  const now = new Date();
  const out: MonthlyWashdayCount[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    out.push({
      label: MONTH_LABELS_FR[month],
      year,
      month,
      count: countWashdaysInMonth(coinHistory, year, month),
    });
  }
  return out;
}

export function averageMonthlyWashdays(months: MonthlyWashdayCount[]): number | null {
  if (months.every(m => m.count === 0)) return null;
  const total = months.reduce((s, m) => s + m.count, 0);
  return Math.round((total / months.length) * 10) / 10;
}

function daysBetweenIso(startIso: string, endIso: string): number {
  const a = new Date(startIso + 'T12:00:00').getTime();
  const b = new Date(endIso + 'T12:00:00').getTime();
  return Math.max(1, Math.round((b - a) / 86400000));
}

function formatWashdayShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatWashdayDone(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const day = d.getDate();
  const month = d.toLocaleDateString('fr-FR', { month: 'long' });
  return `Fait le ${day} ${month}`;
}

function formatPlannedWashdayLong(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Prochain soin planifié (même logique que `HomeNextWashday` / écran Wash day). */
export function getNextPlannedWashday(
  plannedSoins: PlannedSoin[],
  todayIso?: string,
): { date: string; daysUntil: number; soinType: string } | null {
  const today = todayIso ?? toLocalISODate(new Date());
  const todayMs = new Date(`${today}T00:00:00`).getTime();

  const next = [...plannedSoins]
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (!next) return null;

  const nextMs = new Date(`${next.date}T00:00:00`).getTime();
  const daysUntil = Math.max(0, Math.round((nextMs - todayMs) / 86400000));

  return { date: next.date, daysUntil, soinType: next.soinType };
}

export type HomeWashdaySession = {
  id: number;
  date: string;
  title: string;
  subtitle: string;
  dotTotal: number;
  dotDone: number;
  isUpcoming: boolean;
};

/** Sessions wash day pour l’accueil : prochain planifié + historique validé. */
export function buildHomeWashdaySessions(
  coinHistory: CoinHistoryEntry[],
  plannedSoins: PlannedSoin[],
  opts: { washdayStepCount: number },
  limit = 3,
): HomeWashdaySession[] {
  const today = toLocalISODate(new Date());
  const dotTotal = Math.max(6, Math.min(opts.washdayStepCount || 6, 14));
  const sessions: HomeWashdaySession[] = [];

  const next = getNextPlannedWashday(plannedSoins, today);
  if (next) {
    const title =
      next.daysUntil === 0
        ? 'Prochain washday'
        : `Prochain washday · dans ${next.daysUntil} jour${next.daysUntil > 1 ? 's' : ''}`;
    sessions.push({
      id: -1,
      date: next.date,
      title,
      subtitle: formatPlannedWashdayLong(next.date),
      dotTotal,
      dotDone: 0,
      isUpcoming: true,
    });
  }

  const entries = getWashdayHistoryEntries(coinHistory);
  const byDate = new Map<string, CoinHistoryEntry>();
  for (const e of entries) {
    const prev = byDate.get(e.date);
    if (!prev || e.id > prev.id) byDate.set(e.date, e);
  }

  const pastSorted = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  const historySlots = Math.max(0, limit - sessions.length);

  pastSorted.slice(0, historySlots).forEach((entry, i) => {
    const newerWash = pastSorted[i - 1];
    const endDate = newerWash?.date ?? today;
    const spanDays = daysBetweenIso(entry.date, endDate);
    const title = `${spanDays} jour${spanDays > 1 ? 's' : ''}`;
    const subtitle = formatWashdayDone(entry.date);

    sessions.push({
      id: entry.id,
      date: entry.date,
      title,
      subtitle,
      dotTotal,
      dotDone: dotTotal,
      isUpcoming: false,
    });
  });

  return sessions;
}
