/** Repères corporels pour longueur actuelle / souhaitée (profil & onboarding). */
export const HAIR_LENGTH_LANDMARKS = [
  'Oreilles',
  'Menton',
  'Épaules',
  'Aisselles',
  'Soutien-gorge',
  'Taille',
  'Hanches',
] as const;

export type HairLengthLandmark = (typeof HAIR_LENGTH_LANDMARKS)[number];

/** Estimation centrale (cm, cheveux détendus) — fourchette pour l’UI. */
const LANDMARK_APPROX_CM: Record<HairLengthLandmark, number> = {
  Oreilles: 15,
  Menton: 20,
  Épaules: 35,
  Aisselles: 45,
  'Soutien-gorge': 55,
  Taille: 65,
  Hanches: 75,
};

const LANDMARK_CM_RANGE: Record<HairLengthLandmark, { min: number; max: number }> = {
  Oreilles: { min: 10, max: 18 },
  Menton: { min: 15, max: 25 },
  Épaules: { min: 28, max: 42 },
  Aisselles: { min: 38, max: 52 },
  'Soutien-gorge': { min: 48, max: 62 },
  Taille: { min: 58, max: 72 },
  Hanches: { min: 68, max: 85 },
};

export type LengthConfidence = 'measured' | 'refined' | 'estimate' | 'none';

export type ParsedProfileLength = {
  landmark: HairLengthLandmark | null;
  /** Cm saisis à la main (affinage) — prioritaire sur l’estimation du repère. */
  cm: number | null;
};

export type ResolvedLength = {
  cm: number;
  landmark: HairLengthLandmark | null;
  /** Libellé UI (repère, cm, ou les deux). */
  displayLabel: string;
  confidence: LengthConfidence;
};

function parseNumericCm(raw: string): number | null {
  const m = String(raw).match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (!Number.isFinite(n) || n < 0.1 || n > 250) return null;
  return Math.round(n * 10) / 10;
}

export function isHairLengthLandmark(value: string | undefined | null): value is HairLengthLandmark {
  if (!value?.trim()) return false;
  return (HAIR_LENGTH_LANDMARKS as readonly string[]).includes(value.trim());
}

export function landmarkApproxCm(value: string | undefined | null): number | null {
  if (!isHairLengthLandmark(value)) return null;
  return LANDMARK_APPROX_CM[value];
}

export function landmarkCmRangeHint(landmark: HairLengthLandmark): string {
  const r = LANDMARK_CM_RANGE[landmark];
  return `~${r.min}–${r.max} cm`;
}

/**
 * Stocke repère seul, cm seul, ou les deux : `Épaules|38` (repère + cm affiné).
 */
export function parseProfileLength(raw: string | undefined | null): ParsedProfileLength {
  const t = raw?.trim() ?? '';
  if (!t) return { landmark: null, cm: null };

  for (const lm of HAIR_LENGTH_LANDMARKS) {
    const prefix = `${lm}|`;
    if (t.startsWith(prefix)) {
      const cm = parseNumericCm(t.slice(prefix.length));
      return { landmark: lm, cm };
    }
    if (t === lm) return { landmark: lm, cm: null };
  }

  const cmOnly = parseNumericCm(t);
  if (cmOnly != null) return { landmark: null, cm: cmOnly };

  return { landmark: null, cm: null };
}

export function serializeProfileLength(p: ParsedProfileLength): string {
  if (p.landmark && p.cm != null) return `${p.landmark}|${p.cm}`;
  if (p.landmark) return p.landmark;
  if (p.cm != null) return String(p.cm);
  return '';
}

/** Résout une longueur profil en cm + niveau de confiance (sans historique de mesures). */
export function resolveProfileLengthCm(raw: string | undefined | null): ResolvedLength {
  const parsed = parseProfileLength(raw);

  if (parsed.cm != null && parsed.cm > 0) {
    const label = parsed.landmark
      ? `${parsed.landmark} · ${parsed.cm} cm`
      : `${parsed.cm} cm`;
    return {
      cm: parsed.cm,
      landmark: parsed.landmark,
      displayLabel: label,
      confidence: parsed.landmark ? 'refined' : 'refined',
    };
  }

  if (parsed.landmark) {
    const approx = LANDMARK_APPROX_CM[parsed.landmark];
    const range = landmarkCmRangeHint(parsed.landmark);
    return {
      cm: approx,
      landmark: parsed.landmark,
      displayLabel: `${parsed.landmark} (${range})`,
      confidence: 'estimate',
    };
  }

  return { cm: 0, landmark: null, displayLabel: '—', confidence: 'none' };
}

/** Extrait un cm pour calculs (mesures > cm affiné > estimation repère). */
export function parseCmFromText(raw: string | undefined | null): number | null {
  const r = resolveProfileLengthCm(raw);
  return r.confidence === 'none' ? null : r.cm;
}

/** Affichage profil / onglet compte. */
export function formatProfileLengthDisplay(value: string | undefined | null): string {
  const r = resolveProfileLengthCm(value);
  if (r.confidence === 'none') return '—';
  return r.displayLabel;
}
