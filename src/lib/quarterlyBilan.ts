import type { AppState } from '../context/AppContext';
import { countRoutineValidations } from './premiumAccess';

const QUARTER_DAYS = 90;

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type QuarterlyBilan = {
  periodLabel: string;
  routinesValidated: number;
  washdaysCount: number;
  measurementsCount: number;
  growthDeltaCm: number | null;
  streakCurrent: number;
  /** Fallback si pas de diagnostic chargé côté UI. */
  synthesisHint: string;
};

export function buildQuarterlyBilan(state: AppState): QuarterlyBilan {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - QUARTER_DAYS);
  const cutoffIso = toLocalISODate(cutoff);

  const recentHistory = state.coinHistory.filter(
    e => e.date >= cutoffIso && e.amount > 0,
  );
  const routinesValidated = countRoutineValidations(recentHistory);
  const washdaysCount = recentHistory.filter(e => /wash day|washday/i.test(e.label)).length;

  const measures = state.growthHistory.filter(h => h.date >= cutoffIso && h.zone === 'Devant');
  const measurementsCount = new Set(measures.map(m => m.date)).size;

  let growthDeltaCm: number | null = null;
  if (measures.length >= 2) {
    const sorted = [...measures].sort((a, b) => a.date.localeCompare(b.date));
    growthDeltaCm = +(sorted[sorted.length - 1].cm - sorted[0].cm).toFixed(1);
  }

  const monthName = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return {
    periodLabel: `90 derniers jours · jusqu’à ${monthName}`,
    routinesValidated,
    washdaysCount,
    measurementsCount,
    growthDeltaCm,
    streakCurrent: state.streak,
    synthesisHint:
      'Exporte ce bilan (Premium) pour ton RDV coiffeuse ou trichologue — mesures, routines et synthèse Black Cotton.',
  };
}
