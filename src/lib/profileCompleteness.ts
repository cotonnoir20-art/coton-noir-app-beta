import type { CoinHistoryEntry, HairProfile } from '../context/AppContext';

export const PROFILE_COMPLETE_LABEL = 'Profil complété à 100 %';

const COMPLETION_FIELDS: { key: keyof HairProfile; label: string; weight: number }[] = [
  { key: 'name', label: 'Prénom', weight: 1 },
  { key: 'hairType', label: 'Type de cheveux', weight: 2 },
  { key: 'porosity', label: 'Porosité', weight: 2 },
  { key: 'density', label: 'Densité', weight: 1 },
  { key: 'objective', label: 'Objectif', weight: 2 },
  { key: 'careStyle', label: 'Style de soin', weight: 2 },
  { key: 'length', label: 'Longueur actuelle', weight: 1 },
  { key: 'targetLength', label: 'Longueur souhaitée', weight: 1 },
  { key: 'problematics', label: 'Problématiques capillaires', weight: 1 },
];

function fieldFilled(profile: HairProfile, key: keyof HairProfile): boolean {
  const v = profile[key];
  if (key === 'problematics') {
    return Array.isArray(v) && v.length > 0;
  }
  return typeof v === 'string' && v.trim().length > 0;
}

export type ProfileCompletion = {
  percent: number;
  missing: string[];
  isComplete: boolean;
};

export function getProfileCompletion(profile: HairProfile): ProfileCompletion {
  let score = 0;
  let max = 0;
  const missing: string[] = [];

  for (const f of COMPLETION_FIELDS) {
    max += f.weight;
    if (fieldFilled(profile, f.key)) {
      score += f.weight;
    } else {
      missing.push(f.label);
    }
  }

  const percent = max > 0 ? Math.round((score / max) * 100) : 0;
  return {
    percent,
    missing,
    isComplete: percent >= 100,
  };
}

/** Champs requis pour le bonus « Profil complété » (cœur diagnostic, hors optionnels). */
export function isProfileComplete(profile: HairProfile): boolean {
  return (
    !!profile.hairType?.trim() &&
    !!profile.porosity?.trim() &&
    !!profile.density?.trim() &&
    !!profile.objective?.trim() &&
    !!profile.careStyle?.trim()
  );
}

export function hasProfileCompleteBonusInHistory(history: CoinHistoryEntry[]): boolean {
  return history.some(
    e =>
      e.amount > 0 &&
      (e.label === PROFILE_COMPLETE_LABEL || e.label.includes('Profil complété')),
  );
}
