import type { PlannedSoin } from '../context/AppContext';
import { getNextPlannedWashday } from './washdayHistory';

export type WashdayCountdown = {
  dateIso: string;
  soinType: string;
  label: string;
  daysUntil: number;
};

/** Libellé « Prochain wash day · … » pour l’accueil. */
export function getNextWashdayCountdown(plannedSoins: PlannedSoin[]): WashdayCountdown | null {
  const next = getNextPlannedWashday(plannedSoins);
  if (!next) return null;

  const { date, daysUntil, soinType } = next;
  let label: string;
  if (daysUntil === 0) label = 'Prochain wash day · Aujourd\'hui';
  else if (daysUntil === 1) label = 'Prochain wash day · Demain (J-1)';
  else label = `Prochain wash day · Dans ${daysUntil} j`;

  return {
    dateIso: date,
    soinType,
    label,
    daysUntil,
  };
}
