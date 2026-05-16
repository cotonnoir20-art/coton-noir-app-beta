import type { AppState, GrowthEntry } from '../context/AppContext';
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

/**
 * Extrait un nombre de cm depuis une chaîne profil ou saisie libre
 * (« 32 », « 32 cm », « 32,5 ») — borne 0,1–250.
 */
export function parseCmFromText(raw: string | undefined | null): number | null {
  if (raw == null || String(raw).trim() === '') return null;
  const m = String(raw).match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (!Number.isFinite(n) || n < 0.1 || n > 250) return null;
  return Math.round(n * 10) / 10;
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
  /** Delta mois courant vs mois précédent (zone Devant uniquement — série stable). */
  monthDeltaCm: number | null;
  /** Progression 0–1 vers l’objectif (longueur / cible, plafonnée à 1). */
  ringProgress: number;
  /** Au moins une mesure dans `growthHistory` OU une longueur exploitable dans le profil. */
  hasMeasurements: boolean;
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

  const targetCm = Math.max(1, parseFloat(state.profile.targetLength ?? '') || 40);

  const avgCm = averageLatestCmByZone(history);
  const devantSorted = primaryDevantSorted(history);
  const latestDevant = devantSorted[devantSorted.length - 1]?.cm ?? null;
  const profileCm = parseCmFromText(state.profile.length);

  let currentCm = 0;
  let source: HomeLengthSource = 'none';

  if (avgCm > 0) {
    currentCm = avgCm;
    source = 'avg_zones';
  } else if (latestDevant != null && latestDevant > 0) {
    currentCm = Math.round(latestDevant * 10) / 10;
    source = 'devant';
  } else if (profileCm != null) {
    currentCm = profileCm;
    source = 'profile';
  }

  const hasHistory = HOME_GROWTH_ZONES.some(z => latestCmByZone(history, z) != null);
  const hasMeasurements = hasHistory || profileCm != null;

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

  const hint =
    source === 'profile'
      ? 'Valeur indiquée sur ton profil — ajoute une mesure pour suivre la pousse.'
      : null;

  return {
    currentCm,
    targetCm,
    monthDeltaCm,
    ringProgress,
    hasMeasurements,
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
  if (score >= 30) {
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
