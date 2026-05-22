import type { AppState } from '../context/AppContext';
import { computeHairHealthScore } from './homeGrowth';
import { loadAnalysisDraft } from './analysisDraftStorage';
import { fetchHairAnalysisHistory } from './hairAnalysisHistory';

/** Synthèse Black Cotton pour bilan mensuel / export (dernier diagnostic en priorité). */
export async function resolveBlackCottonBilanSynthesis(state: AppState): Promise<{
  text: string;
  source: 'draft' | 'history' | 'health' | 'default';
  score?: number;
  analyzedAt?: string;
}> {
  const draft = await loadAnalysisDraft();
  if (draft?.analysis?.synthesis?.trim()) {
    return {
      text: draft.analysis.synthesis.trim(),
      source: 'draft',
      score: draft.analysis.score,
      analyzedAt: draft.completedAt,
    };
  }

  const rows = await fetchHairAnalysisHistory(1);
  if (rows[0]?.synthesis?.trim()) {
    return {
      text: rows[0].synthesis.trim(),
      source: 'history',
      score: rows[0].score,
      analyzedAt: rows[0].createdAt,
    };
  }

  const health = computeHairHealthScore(state);
  if (health != null) {
    if (health >= 75) {
      return {
        text: 'Tes habitudes de soin sont régulières. Continue sur ta routine matin et tes wash days planifiés pour consolider tes résultats.',
        source: 'health',
        score: health,
      };
    }
    if (health >= 50) {
      return {
        text: 'Ta routine progresse — priorise l’hydratation quotidienne et un wash day tous les 7–10 jours pour réduire la casse.',
        source: 'health',
        score: health,
      };
    }
    return {
      text: 'Black Cotton te recommande de reprendre une routine courte (matin) et de refaire une analyse photo pour ajuster tes produits.',
      source: 'health',
      score: health,
    };
  }

  return {
    text: 'Fais une analyse capillaire pour obtenir une synthèse personnalisée Black Cotton sur tes prochains soins.',
    source: 'default',
  };
}
