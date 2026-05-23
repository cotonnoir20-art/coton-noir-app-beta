/** Valeurs canoniques porosité (onboarding, coach, recommandations). */
export const POROSITY_VALUES = ['Faible', 'Moyenne', 'Élevée'] as const;
export type PorosityValue = (typeof POROSITY_VALUES)[number];

export const POROSITY_OPTIONS = [
  { id: 'Faible' as const, label: "L'eau perle", desc: "Le cheveu repousse l'eau", emoji: '💧' },
  { id: 'Moyenne' as const, label: "L'eau s'absorbe", desc: 'Ni trop vite, ni trop lentement', emoji: '🌊' },
  { id: 'Élevée' as const, label: 'Le cheveu boit tout', desc: 'Absorption instantanée', emoji: '🫧' },
];

/** Libellés legacy profil (Basse/Haute) → valeurs canoniques. */
const POROSITY_ALIASES: Record<string, PorosityValue> = {
  basse: 'Faible',
  faible: 'Faible',
  moyenne: 'Moyenne',
  haute: 'Élevée',
  élevée: 'Élevée',
  elevee: 'Élevée',
};

export function normalizePorosity(value: string | null | undefined): PorosityValue | '' {
  const raw = value?.trim();
  if (!raw) return '';
  if ((POROSITY_VALUES as readonly string[]).includes(raw)) return raw as PorosityValue;
  return POROSITY_ALIASES[raw.toLowerCase()] ?? '';
}

/** Retourne la porosité canonique ou « Moyenne » par défaut. */
export function resolvePorosity(value: string | null | undefined): PorosityValue {
  return normalizePorosity(value) || 'Moyenne';
}
