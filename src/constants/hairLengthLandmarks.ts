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

/** Estimation cm (cheveux détendus) pour anneau / progrès quand pas de mesure zone. */
const LANDMARK_APPROX_CM: Record<HairLengthLandmark, number> = {
  Oreilles: 15,
  Menton: 20,
  Épaules: 35,
  Aisselles: 45,
  'Soutien-gorge': 55,
  Taille: 65,
  Hanches: 75,
};

export function isHairLengthLandmark(value: string | undefined | null): value is HairLengthLandmark {
  if (!value?.trim()) return false;
  return (HAIR_LENGTH_LANDMARKS as readonly string[]).includes(value.trim());
}

export function landmarkApproxCm(value: string | undefined | null): number | null {
  if (!isHairLengthLandmark(value)) return null;
  return LANDMARK_APPROX_CM[value];
}

/** Affichage profil : repère tel quel, sinon « X cm » si nombre parsable. */
export function formatProfileLengthDisplay(value: string | undefined | null): string {
  if (!value?.trim()) return '—';
  if (isHairLengthLandmark(value)) return value.trim();
  const m = String(value).match(/(\d+(?:[.,]\d+)?)/);
  if (m) {
    const n = parseFloat(m[1].replace(',', '.'));
    if (Number.isFinite(n)) return `${n} cm`;
  }
  return value.trim();
}
