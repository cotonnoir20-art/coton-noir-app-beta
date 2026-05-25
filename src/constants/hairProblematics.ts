import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type HairProblematicIcon = ComponentProps<typeof Ionicons>['name'];

export type HairProblematic = {
  id: string;
  /** Libellé stocké en base / profil. */
  label: string;
  icon: HairProblematicIcon;
  /** Affichage onboarding (pastille avec emoji). */
  emoji?: string;
  onboardingLabel?: string;
};

/** Nombre max de problématiques (profil + IA). */
export const MAX_HAIR_PROBLEMATICS = 3;

/** Liste canonique (profil, onboarding) — libellés stockés en base. */
export const HAIR_PROBLEMATICS: HairProblematic[] = [
  {
    id: 'dryness',
    label: 'Sécheresse',
    icon: 'sunny-outline',
    emoji: '🌵',
    onboardingLabel: 'Une sécheresse persistante',
  },
  {
    id: 'breakage',
    label: 'Casse',
    icon: 'warning-outline',
    emoji: '💔',
    onboardingLabel: 'Casse et perte',
  },
  { id: 'dandruff', label: 'Pellicules', icon: 'snow-outline', emoji: '❄️' },
  { id: 'frizz', label: 'Frisottis', icon: 'flash-outline', emoji: '💨' },
  { id: 'fine_hair', label: 'Cheveux fins', icon: 'remove-outline', emoji: '🌿' },
  { id: 'oily', label: 'Cheveux gras', icon: 'water-outline', emoji: '💧' },
  { id: 'dull', label: 'Manque de brillance', icon: 'moon-outline', emoji: '✨' },
  { id: 'tangles', label: 'Nœuds fréquents', icon: 'git-network-outline', emoji: '🪢' },
  { id: 'slow_growth', label: 'Pousse lente', icon: 'time-outline', emoji: '🌱' },
  {
    id: 'product_confusion',
    label: 'Produits inadaptés',
    icon: 'help-circle-outline',
    emoji: '❓',
    onboardingLabel: "Je n'ai aucune idée des produits qui fonctionnent.",
  },
  {
    id: 'incoherent_routine',
    label: 'Routine incohérente',
    icon: 'calendar-outline',
    emoji: '📋',
    onboardingLabel: 'Routine incohérente',
  },
  {
    id: 'heat_damage',
    label: 'Dommages chaleur',
    icon: 'flame-outline',
    emoji: '🔥',
    onboardingLabel: 'Dommages causés par la chaleur',
  },
  {
    id: 'chemical_damage',
    label: 'Dommages chimiques',
    icon: 'beaker-outline',
    emoji: '🧪',
    onboardingLabel:
      'Dommages causés par les produits chimiques (défrisage, décoloration…)',
  },
  {
    id: 'scalp_issues',
    label: 'Problèmes de cuir chevelu',
    icon: 'body-outline',
    emoji: '😖',
  },
];

/** Ordre d’affichage onboarding — 6 options max, diagnostic ciblé. */
export const ONBOARDING_PROBLEMATIC_IDS: string[] = [
  'dryness',
  'breakage',
  'product_confusion',
  'frizz',
  'slow_growth',
  'scalp_issues',
];

export function getProblematicDisplayLabel(p: HairProblematic): string {
  return p.onboardingLabel ?? p.label;
}

const CANONICAL_LABELS = new Set(HAIR_PROBLEMATICS.map(p => p.label));

/** Anciens libellés profil → libellé canonique. */
const LEGACY_ALIASES: Record<string, string> = {
  'Nœuds': 'Nœuds fréquents',
  Fourches: 'Casse',
  Rétraction: 'Frisottis',
  Pointes: 'Manque de brillance',
  Volume: 'Cheveux fins',
  'Une sécheresse persistante': 'Sécheresse',
  'Casse et perte': 'Casse',
  "Je n'ai aucune idée des produits qui fonctionnent.": 'Produits inadaptés',
  'routine incohérente': 'Routine incohérente',
  'Dommages causés par la chaleur ou les produits chimiques': 'Dommages chaleur',
  'Dommages chaleur & chimie': 'Dommages chaleur',
  'Dommages coloration': 'Dommages chimiques',
};

/** Anciens libellés → plusieurs libellés canoniques (profils déjà enregistrés). */
const LEGACY_EXPAND: Record<string, string[]> = {
  'Dommages chaleur & chimie': ['Dommages chaleur', 'Dommages chimiques'],
  'Dommages causés par la chaleur ou les produits chimiques': [
    'Dommages chaleur',
    'Dommages chimiques',
  ],
};

export function normalizeProblematicLabel(label: string): string {
  const t = label.trim();
  if (CANONICAL_LABELS.has(t)) return t;
  const byOnboarding = HAIR_PROBLEMATICS.find(
    p => p.onboardingLabel?.toLowerCase() === t.toLowerCase(),
  );
  if (byOnboarding) return byOnboarding.label;
  return LEGACY_ALIASES[t] ?? t;
}

export function normalizeProblematicLabels(labels: string[] | undefined): string[] {
  if (!labels?.length) return [];
  const out: string[] = [];
  for (const raw of labels) {
    const t = raw.trim();
    const expanded = LEGACY_EXPAND[t];
    if (expanded) {
      for (const n of expanded) {
        if (!out.includes(n)) out.push(n);
      }
      continue;
    }
    const n = normalizeProblematicLabel(raw);
    if (n && !out.includes(n)) out.push(n);
    if (out.length >= MAX_HAIR_PROBLEMATICS) break;
  }
  return out.slice(0, MAX_HAIR_PROBLEMATICS);
}

export function findHairProblematic(label: string): HairProblematic | undefined {
  const canonical = normalizeProblematicLabel(label);
  return HAIR_PROBLEMATICS.find(p => p.label === canonical);
}

export function getOnboardingProblematics(): HairProblematic[] {
  const byId = new Map(HAIR_PROBLEMATICS.map(p => [p.id, p]));
  return ONBOARDING_PROBLEMATIC_IDS.map(id => byId.get(id)).filter(
    (p): p is HairProblematic => !!p,
  );
}
