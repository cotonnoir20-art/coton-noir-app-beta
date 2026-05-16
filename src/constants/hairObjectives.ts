/**
 * Objectifs capillaires unifiés (onboarding + écran profil capillaire).
 * Les doublons sémantiques ont été fusionnés (ex. hydratation, pousse, casse/fibres).
 * `profiles.objective` stocke toujours `id` (pas le libellé complet).
 */

export type HairObjective = { id: string; label: string; emoji: string };

export const HAIR_OBJECTIVES: HairObjective[] = [
  { id: 'Hydratation', label: 'Hydrater en profondeur', emoji: '💧' },
  { id: 'Pousse', label: 'Accélérer la pousse', emoji: '🌱' },
  { id: 'Définition', label: 'Définir mes boucles', emoji: '✨' },
  {
    id: 'Casse',
    label: 'Stopper la casse & renforcer les fibres',
    emoji: '💪',
  },
  { id: 'Pointes', label: 'Réparer les pointes', emoji: '✂️' },
  { id: 'Couleur', label: 'Préserver la couleur', emoji: '🎨' },
  { id: 'Brillance', label: 'Maximiser la brillance', emoji: '💫' },
  { id: 'Tout', label: 'Tout améliorer', emoji: '🌟' },
];

const LEGACY_OBJECTIVE_TO_ID: Record<string, string> = {
  '💪 Renforcer les fibres': 'Casse',
  '💧 Hydrater en profondeur': 'Hydratation',
  '🌱 Accélérer la pousse': 'Pousse',
  '✂️ Réparer les pointes': 'Pointes',
  '🎨 Préserver la couleur': 'Couleur',
  '✨ Maximiser la brillance': 'Brillance',
  'Pousser plus vite': 'Pousse',
  'Hydrater en profondeur': 'Hydratation',
  'Définir mes boucles': 'Définition',
  'Stopper la casse': 'Casse',
  'Tout améliorer': 'Tout',
};

export function normalizeObjectiveId(stored: string): string {
  const t = (stored || '').trim();
  if (!t) return '';
  if (HAIR_OBJECTIVES.some(o => o.id === t)) return t;
  if (LEGACY_OBJECTIVE_TO_ID[t]) return LEGACY_OBJECTIVE_TO_ID[t];
  return t;
}

/** Libellé lisible (ex. fiche profil). */
export function displayObjective(stored: string): string {
  const id = normalizeObjectiveId(stored);
  const o = HAIR_OBJECTIVES.find(x => x.id === id);
  if (o) return `${o.emoji} ${o.label}`;
  return stored.trim() || '—';
}
