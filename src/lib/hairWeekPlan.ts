import type { CoinHistoryEntry, PlannedSoin } from '../context/AppContext';
import type { RoutineType } from '../data/routines';

/** 0 = dimanche … 6 = samedi (aligné Date.getDay()). */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WeekSlotKind = 'daily_morning' | 'hydration' | 'washday';

export type WeekPlanTemplate = {
  weekday: WeekdayIndex;
  kind: WeekSlotKind;
  routineType: RoutineType;
  label: string;
  emoji: string;
};

/** Modèle « Ma semaine capillaire » par défaut. */
export const DEFAULT_HAIR_WEEK: WeekPlanTemplate[] = [
  { weekday: 1, kind: 'daily_morning', routineType: 'daily', label: 'Routine matin', emoji: '🌤️' },
  { weekday: 3, kind: 'hydration', routineType: 'daily', label: 'Hydratation rapide', emoji: '💧' },
  { weekday: 0, kind: 'washday', routineType: 'washday', label: 'Wash day planifié', emoji: '🚿' },
];

export type WeekAgendaItem = WeekPlanTemplate & {
  dateIso: string;
  dayLabel: string;
  dateNum: number;
  isToday: boolean;
  isPast: boolean;
  status: 'done' | 'planned' | 'today' | 'upcoming';
  detail?: string;
};

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function getMondayWeekStart(ref = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d;
}

function routineDoneOnDate(coinHistory: CoinHistoryEntry[], dateIso: string, type: RoutineType): boolean {
  const labels =
    type === 'washday'
      ? [/wash day/i, /washday/i]
      : type === 'night'
        ? [/routine.*soir/i, /night/i]
        : [/routine.*matin/i, /routine du matin/i, /daily/i, /routine/i];
  return coinHistory.some(
    e => e.amount > 0 && e.date === dateIso && labels.some(re => re.test(e.label)),
  );
}

function washdayPlannedOn(plannedSoins: PlannedSoin[], dateIso: string): PlannedSoin | undefined {
  return plannedSoins.find(s => s.date === dateIso);
}

export function buildHairWeekAgenda(args: {
  coinHistory: CoinHistoryEntry[];
  plannedSoins: PlannedSoin[];
  todayIso?: string;
  weekStart?: Date;
}): WeekAgendaItem[] {
  // Nouvelle utilisatrice : aucune routine validée et aucun soin planifié → vide
  const hasRoutineHistory = args.coinHistory.some(
    e => e.amount > 0 && /routine|wash/i.test(e.label),
  );
  if (!hasRoutineHistory && args.plannedSoins.length === 0) return [];

  const today = args.todayIso ?? toLocalISODate(new Date());
  const weekStart = args.weekStart ?? getMondayWeekStart();

  return DEFAULT_HAIR_WEEK.map(template => {
    const offset = template.weekday === 0 ? 6 : template.weekday - 1;
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + offset);
    const dateIso = toLocalISODate(d);
    const isToday = dateIso === today;
    const isPast = dateIso < today;

    let status: WeekAgendaItem['status'] = isPast ? 'upcoming' : 'upcoming';
    let detail: string | undefined;

    if (template.kind === 'washday') {
      const planned = washdayPlannedOn(args.plannedSoins, dateIso);
      const done = routineDoneOnDate(args.coinHistory, dateIso, 'washday');
      if (done) {
        status = 'done';
        detail = planned?.soinType ? planned.soinType : 'Validé';
      } else if (planned) {
        status = isToday ? 'today' : isPast ? 'planned' : 'planned';
        detail = planned.soinType;
      } else if (isPast) {
        status = 'planned';
        detail = 'Non planifié';
      } else {
        status = isToday ? 'today' : 'upcoming';
        detail = 'À planifier';
      }
    } else {
      const done = routineDoneOnDate(args.coinHistory, dateIso, template.routineType);
      if (done) {
        status = 'done';
      } else if (isToday) {
        status = 'today';
      } else if (isPast) {
        status = 'planned';
        detail = 'Non fait';
      }
    }

    return {
      ...template,
      dateIso,
      dayLabel: DAY_LABELS[d.getDay()],
      dateNum: d.getDate(),
      isToday,
      isPast,
      status,
      detail,
    };
  });
}
