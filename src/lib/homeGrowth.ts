import type { AppState, GrowthEntry } from '../context/AppContext';
import {
  isHairLengthLandmark,
  type LengthConfidence,
  type ResolvedLength,
  resolveProfileLengthCm,
} from '../constants/hairLengthLandmarks';
import { Colors } from '../theme/colors';

/** Même libellés de zones que `growth.tsx` / `hair-length.tsx` (sync obligatoire). */
export const HOME_GROWTH_ZONES = ['Devant', 'Derrière', 'Côté Gauche', 'Côté Droit'] as const;

/** yyyy-mm-dd fuseau local (évite le décalage UTC de `toISOString().slice(0,10)`). */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export { parseCmFromText } from '../constants/hairLengthLandmarks';

function primaryDevantLatestCm(history: GrowthEntry[]): number | null {
  const sorted = primaryDevantSorted(history);
  const cm = sorted[sorted.length - 1]?.cm;
  if (cm == null || !Number.isFinite(cm) || cm <= 0) return null;
  return Math.round(cm * 10) / 10;
}

/** Longueur courante : mesures zones → cm affiné → repère estimé. */
export function resolveCurrentLength(
  profileLength: string | undefined | null,
  history: GrowthEntry[],
): ResolvedLength {
  const avgCm = averageLatestCmByZone(history);
  const profile = resolveProfileLengthCm(profileLength);

  if (avgCm > 0) {
    return {
      cm: avgCm,
      landmark: profile.landmark,
      displayLabel: profile.landmark ? `${profile.landmark} · ${avgCm} cm` : `${avgCm} cm`,
      confidence: 'measured',
    };
  }

  const devant = primaryDevantLatestCm(history);
  if (devant != null) {
    return {
      cm: devant,
      landmark: profile.landmark,
      displayLabel: profile.landmark ? `${profile.landmark} · ${devant} cm` : `${devant} cm`,
      confidence: 'measured',
    };
  }

  return profile;
}

export function resolveTargetLength(profileTarget: string | undefined | null): ResolvedLength {
  return resolveProfileLengthCm(profileTarget);
}

/** Dernière mesure connue par zone (tri date desc). */
export function latestCmByZone(history: GrowthEntry[], zone: string): number | null {
  const entries = history.filter(h => h.zone === zone).sort((a, b) => b.date.localeCompare(a.date));
  const cm = entries[0]?.cm;
  if (cm == null || !Number.isFinite(cm) || cm <= 0) return null;
  return Math.round(cm * 10) / 10;
}

/** Moyenne des dernières mesures par zone (même règle que l’écran Progrès). */
export function averageLatestCmByZone(history: GrowthEntry[]): number {
  const values: number[] = [];
  for (const zone of HOME_GROWTH_ZONES) {
    const v = latestCmByZone(history, zone);
    if (v != null) values.push(v);
  }
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function primaryDevantSorted(history: GrowthEntry[]): GrowthEntry[] {
  return history.filter(h => h.zone === 'Devant').sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Carte mois → cm pour la zone Devant (dernière entrée du mois = dernière valeur chronologique dans le mois).
 * Utilisé pour le delta « ce mois » — même série que le graph Progrès (Devant).
 */
function monthMapDevant(history: GrowthEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const h of primaryDevantSorted(history)) {
    const key = h.date.slice(0, 7);
    map[key] = h.cm;
  }
  return map;
}

export type HomeLengthSource = 'avg_zones' | 'devant' | 'profile' | 'none';

export type HomeLengthMetrics = {
  currentCm: number;
  targetCm: number;
  currentLabel: string;
  targetLabel: string;
  currentConfidence: LengthConfidence;
  targetConfidence: LengthConfidence;
  /** Delta mois courant vs mois précédent (zone Devant uniquement — série stable). */
  monthDeltaCm: number | null;
  /** Progression 0–1 vers l’objectif (longueur / cible, plafonnée à 1). */
  ringProgress: number;
  /** Au moins une mesure dans `growthHistory` OU une longueur exploitable dans le profil. */
  hasMeasurements: boolean;
  /** Projection calculateur basée sur estimations repère (pas assez précise). */
  projectionIsEstimate: boolean;
  /** D’où vient la valeur affichée (pour libellés / confiance). */
  source: HomeLengthSource;
  /** Texte court optionnel sous l’objectif (ex. indication profil). */
  hint: string | null;
};

/**
 * Métriques longueur pour l’accueil — alignées sur `growth.tsx` :
 * - longueur courante : moyenne des dernières mesures par zone, sinon dernier Devant, sinon profil ;
 * - delta mois : série **Devant** (cohérent avec le graph « Pousse ») ;
 * - anneau : current / target (max 100 %).
 */
export function getHomeLengthMetrics(state: AppState): HomeLengthMetrics {
  const todayObj = new Date();
  const todayStr = toLocalISODate(todayObj);
  const history = state.growthHistory;

  const current = resolveCurrentLength(state.profile.length, history);
  const target = resolveTargetLength(state.profile.targetLength);
  const targetCm = Math.max(1, target.cm > 0 ? target.cm : 40);
  const currentCm = current.cm;

  let source: HomeLengthSource = 'none';
  if (current.confidence === 'measured') {
    source = averageLatestCmByZone(history) > 0 ? 'avg_zones' : 'devant';
  } else if (current.confidence !== 'none') {
    source = 'profile';
  }

  const hasHistory = HOME_GROWTH_ZONES.some(z => latestCmByZone(history, z) != null);
  const hasMeasurements =
    hasHistory || current.confidence !== 'none' || target.confidence !== 'none';
  const projectionIsEstimate =
    hasHistory
      ? target.confidence === 'estimate'
      : current.confidence === 'estimate' || target.confidence === 'estimate';

  const homeMMap = monthMapDevant(history);
  const curMonthKey = todayStr.slice(0, 7);
  const prevMDate = new Date(todayObj);
  prevMDate.setMonth(prevMDate.getMonth() - 1);
  const prevMonthKey = `${prevMDate.getFullYear()}-${String(prevMDate.getMonth() + 1).padStart(2, '0')}`;
  const monthDeltaCm =
    homeMMap[curMonthKey] != null && homeMMap[prevMonthKey] != null
      ? +(homeMMap[curMonthKey] - homeMMap[prevMonthKey]).toFixed(1)
      : null;

  const ringProgress =
    targetCm > 0 ? Math.min(1, Math.max(0, currentCm / targetCm)) : 0;

  let hint: string | null = null;
  if (projectionIsEstimate && !hasHistory) {
    hint =
      'Estimation à partir de tes repères — ajoute une mesure au mètre ou précise en cm pour un calculateur fiable.';
  } else if (current.confidence === 'estimate' && hasHistory) {
    hint = 'Objectif indicatif — précise ta cible en cm ou par mesure régulière.';
  } else if (source === 'profile' && !hasHistory) {
    hint = 'Mesure au mètre ruban pour affiner ta longueur et le suivi de pousse.';
  }

  return {
    currentCm,
    targetCm,
    currentLabel: current.displayLabel,
    targetLabel: target.displayLabel,
    currentConfidence: current.confidence,
    targetConfidence: target.confidence,
    monthDeltaCm,
    ringProgress,
    hasMeasurements,
    projectionIsEstimate,
    source,
    hint,
  };
}

const HEALTH_SCORE_PROFILE_FIELDS: (keyof AppState['profile'])[] = [
  'hairType',
  'porosity',
  'density',
  'length',
  'objective',
  'targetLength',
  'routineType',
  'region',
  'budget',
];

/**
 * Score santé 0–100 (aligné sur les fixtures démo : profil + streak + mesures).
 * `null` si aucune donnée exploitable (nouveau compte sans profil ni mesure).
 */
export function computeHairHealthScore(state: AppState): number | null {
  const { profile, growthHistory, streak } = state;
  const filled = HEALTH_SCORE_PROFILE_FIELDS.filter(k => {
    const v = profile[k];
    return v != null && String(v).trim() !== '';
  }).length;

  const profilePts = Math.round((filled / HEALTH_SCORE_PROFILE_FIELDS.length) * 60);
  const streakPts = Math.min(streak * 2, 20);
  const growthPts = Math.min(growthHistory.length * 5, 20);
  const total = profilePts + streakPts + growthPts;

  if (total === 0) return null;
  return Math.min(100, total);
}

/** En dessous : bandeau « Routine / Analyser » recommandé. */
export const HEALTH_SCORE_LOW_THRESHOLD = 30;

/** Couleurs score santé (alignées charte : sage ≥ 55, alert < 30). */
export function getHealthScoreColors(score: number | null): {
  value: string;
  muted: string;
  bg: string;
} {
  if (score == null) {
    return { value: Colors.warmGray, muted: Colors.warmGray, bg: Colors.cream };
  }
  if (score >= 55) {
    return { value: Colors.sageDark, muted: Colors.sageDark, bg: Colors.sageLight };
  }
  if (score >= HEALTH_SCORE_LOW_THRESHOLD) {
    return { value: Colors.amberInk, muted: Colors.amberDark, bg: Colors.amberLight };
  }
  return { value: Colors.alertDark, muted: Colors.alert, bg: Colors.alertLight };
}

export type MilestoneItem = {
  cm: number;
  status: 'done' | 'current' | 'future' | 'goal';
};

/** Paliers pour la timeline : repères réguliers jusqu’à la cible + « tu es ici » sur le plus proche de la longueur actuelle. */
export function buildGrowthMilestones(currentCm: number, targetCm: number): MilestoneItem[] {
  const t = Math.round(Math.max(targetCm, 25));
  const n = 5;
  const steps: number[] = [];
  for (let i = 0; i < n; i++) {
    steps.push(Math.round((t * (i + 1)) / n));
  }
  const uniq = [...new Set(steps)].sort((a, b) => a - b);
  const withGoal = uniq[uniq.length - 1] === t ? uniq : [...uniq.filter(x => x < t), t];

  if (currentCm <= 0) {
    return withGoal.map((cm): MilestoneItem => ({
      cm,
      status: cm === t ? 'goal' : 'future',
    }));
  }

  let closestIdx = 0;
  let best = Infinity;
  withGoal.forEach((cm, i) => {
    const d = Math.abs(cm - currentCm);
    if (d < best) {
      best = d;
      closestIdx = i;
    }
  });

  return withGoal.map((cm, i) => {
    let status: MilestoneItem['status'];
    if (cm === t) status = 'goal';
    else if (i === closestIdx) status = 'current';
    else if (cm < currentCm - 0.01) status = 'done';
    else status = 'future';
    return { cm, status };
  });
}

export type HomeMeasureSession = {
  date: string;
  dateLabel: string;
  avgCm: number;
  zoneCount: number;
  isLatest: boolean;
  /** Delta vs la session précédente (plus ancienne), en cm. */
  deltaCm: number | null;
};

function formatMeasureDateLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Historique de pousse groupé par date (moyenne des zones mesurées ce jour-là). */
export function buildHomeMeasureSessions(
  history: GrowthEntry[],
  limit = 5,
): HomeMeasureSession[] {
  if (history.length === 0) return [];

  const byDate = new Map<string, GrowthEntry[]>();
  for (const h of history) {
    const list = byDate.get(h.date) ?? [];
    list.push(h);
    byDate.set(h.date, list);
  }

  const sortedDates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));
  const latestDate = sortedDates[0];

  const sessions: HomeMeasureSession[] = sortedDates.map((date, i) => {
    const rows = byDate.get(date)!;
    const avgCm = Math.round((rows.reduce((s, r) => s + r.cm, 0) / rows.length) * 10) / 10;

    const prevDate = sortedDates[i + 1];
    let deltaCm: number | null = null;
    if (prevDate) {
      const prevRows = byDate.get(prevDate)!;
      const prevAvg =
        Math.round((prevRows.reduce((s, r) => s + r.cm, 0) / prevRows.length) * 10) / 10;
      deltaCm = +(avgCm - prevAvg).toFixed(1);
    }

    return {
      date,
      dateLabel: formatMeasureDateLabel(date),
      avgCm,
      zoneCount: rows.length,
      isLatest: date === latestDate,
      deltaCm,
    };
  });

  return sessions.slice(0, limit);
}
