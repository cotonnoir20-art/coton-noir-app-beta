import type { CoinHistoryEntry } from '../context/AppContext';

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
