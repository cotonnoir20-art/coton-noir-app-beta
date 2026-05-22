import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type HairProblematicIcon = ComponentProps<typeof Ionicons>['name'];

export type HairProblematic = {
  id: string;
  label: string;
  icon: HairProblematicIcon;
};

/** Liste canonique (profil, onboarding) — libellés stockés en base. */
export const HAIR_PROBLEMATICS: HairProblematic[] = [
  { id: 'dryness', label: 'Sécheresse', icon: 'sunny-outline' },
  { id: 'breakage', label: 'Casse', icon: 'warning-outline' },
  { id: 'dandruff', label: 'Pellicules', icon: 'snow-outline' },
  { id: 'frizz', label: 'Frisottis', icon: 'flash-outline' },
  { id: 'fine_hair', label: 'Cheveux fins', icon: 'remove-outline' },
  { id: 'oily', label: 'Cheveux gras', icon: 'water-outline' },
  { id: 'dull', label: 'Manque de brillance', icon: 'moon-outline' },
  { id: 'tangles', label: 'Nœuds fréquents', icon: 'git-network-outline' },
  { id: 'slow_growth', label: 'Pousse lente', icon: 'time-outline' },
  { id: 'color_damage', label: 'Dommages coloration', icon: 'color-palette-outline' },
];

const CANONICAL_LABELS = new Set(HAIR_PROBLEMATICS.map(p => p.label));

/** Anciens libellés profil → libellé canonique. */
const LEGACY_ALIASES: Record<string, string> = {
  'Nœuds': 'Nœuds fréquents',
  Fourches: 'Casse',
  Rétraction: 'Frisottis',
  Pointes: 'Manque de brillance',
  Volume: 'Cheveux fins',
};

export function normalizeProblematicLabel(label: string): string {
  const t = label.trim();
  if (CANONICAL_LABELS.has(t)) return t;
  return LEGACY_ALIASES[t] ?? t;
}

export function normalizeProblematicLabels(labels: string[] | undefined): string[] {
  if (!labels?.length) return [];
  const out: string[] = [];
  for (const raw of labels) {
    const n = normalizeProblematicLabel(raw);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

export function findHairProblematic(label: string): HairProblematic | undefined {
  const canonical = normalizeProblematicLabel(label);
  return HAIR_PROBLEMATICS.find(p => p.label === canonical);
}
