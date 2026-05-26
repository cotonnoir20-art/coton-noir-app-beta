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
  // Nouvelles entrées onboarding
  {
    id: 'dry_brittle',
    label: 'Cheveux secs et cassants',
    icon: 'sunny-outline',
    emoji: '🌵',
    onboardingLabel: 'Cheveux secs et cassants',
  },
  {
    id: 'curl_loss',
    label: 'Perte de définition des boucles',
    icon: 'refresh-outline',
    emoji: '🌀',
    onboardingLabel: 'Perte de définition des boucles',
  },
  {
    id: 'hair_loss',
    label: 'Chute de cheveux',
    icon: 'trending-down-outline',
    emoji: '😰',
    onboardingLabel: 'Chute de cheveux',
  },
  {
    id: 'split_ends',
    label: 'Fourches et pointes abîmées',
    icon: 'git-branch-outline',
    emoji: '✂️',
    onboardingLabel: 'Fourches et pointes abîmées',
  },
  // Entrées existantes (conservées en base)
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
  {
    id: 'dandruff',
    label: 'Pellicules',
    icon: 'snow-outline',
    emoji: '❄️',
    onboardingLabel: 'Pellicules ou démangeaisons',
  },
  {
    id: 'frizz',
    label: 'Frisottis',
    icon: 'flash-outline',
    emoji: '💨',
    onboardingLabel: "Frisottis et manque d'hydratation",
  },
  { id: 'fine_hair', label: 'Cheveux fins', icon: 'remove-outline', emoji: '🌿' },
  { id: 'oily', label: 'Cheveux gras', icon: 'water-outline', emoji: '💧' },
  {
    id: 'dull',
    label: 'Manque de brillance',
    icon: 'moon-outline',
    emoji: '✨',
    onboardingLabel: 'Cheveux ternes sans éclat',
  },
  {
    id: 'tangles',
    label: 'Noeuds fréquents',
    icon: 'git-network-outline',
    emoji: '🪲',
    onboardingLabel: 'Cheveux difficiles à démêler',
  },
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
  {
    id: 'damaged',
    label: 'Endommagés',
    icon: 'flame-outline',
    emoji: '🔥',
    onboardingLabel: 'Endommagés (chaleur ou produits chimiques)',
  },
  {
    id: 'transition',
    label: 'En transition',
    icon: 'leaf-outline',
    emoji: '🌿',
    onboardingLabel: 'En transition (vers le naturel)',
  },
];

/** Ordre d'affichage onboarding — 10 options, sélection max 3. */
export const ONBOARDING_PROBLEMATIC_IDS: string[] = [
  'dry_brittle',
  'curl_loss',
  'hair_loss',
  'dandruff',
  'dull',
  'split_ends',
  'frizz',
  'tangles',
  'product_confusion',
  'damaged',
  'transition',
];

export function getProblematicDisplayLabel(p: HairProblematic): string {
  return p.onboardingLabel ?? p.label;
}

const CANONICAL_LABELS = new Set(HAIR_PROBLEMATICS.map(p => p.label));

/** Anciens libellés profil → libellé canonique. */
const LEGACY_ALIASES: Record<string, string> = {
  'Noeuds': 'Noeuds fréquents',
  'Fourches': 'Fourches et pointes abîmées',
  'Rétraction': 'Frisottis',
  'Pointes': 'Manque de brillance',
  'Volume': 'Cheveux fins',
  'Une sécheresse persistante': 'Sécheresse',
  'Casse et perte': 'Casse',
  "Je n'ai aucune idée des produits qui fonctionnent.": 'Produits inadaptés',
  'routine incohérente': 'Routine incohérente',
  'Dommages causés par la chaleur ou les produits chimiques': 'Endommagés',
  'Dommages chaleur & chimie': 'Endommagés',
  'Dommages chaleur': 'Endommagés',
  'Dommages chimiques': 'Endommagés',
  'Dommages coloration': 'Dommages chimiques',
  'Sécheresse': 'Cheveux secs et cassants',
  'Pellicules': 'Pellicules',
  'Nœuds fréquents': 'Noeuds fréquents',
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
