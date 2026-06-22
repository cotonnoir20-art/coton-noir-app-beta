/**

 * Objectifs capillaires unifiés (onboarding + écran profil capillaire).

 * `profiles.objective` stocke toujours `id` (pas le libellé complet).

 */



export type HairObjective = { id: string; label: string; emoji: string };



export const HAIR_OBJECTIVES: HairObjective[] = [

  { id: 'Hydratation', label: "Améliorer l'hydratation", emoji: '💧' },

  { id: 'Pousse', label: 'Faire pousser mes cheveux', emoji: '🌱' },

  { id: 'Casse_et_chute', label: 'Limiter la casse et la chute', emoji: '💔' },

  { id: 'Fibre', label: 'Renforcer la fibre capillaire', emoji: '💪' },

  { id: 'Brillance', label: 'Augmenter la brillance', emoji: '✨' },

  { id: 'Densite', label: "Augmenter la densité et l'épaisseur", emoji: '🌳' },

  { id: 'Définition', label: 'Définir mes boucles', emoji: '🌀' },

  { id: 'Dommages', label: 'Réparer les dommages', emoji: '🩹' },

  { id: 'Transition', label: 'Gérer ma transition', emoji: '🦋' },

  { id: 'Cuir_chevelu', label: 'Avoir un cuir chevelu plus sain', emoji: '🧠' },

];



/** Ordre affiché à l’étape onboarding « Qu’est-ce que tu veux changer ? » */

export const ONBOARDING_OBJECTIVE_IDS: string[] = HAIR_OBJECTIVES.map(o => o.id);



export function getOnboardingObjectives(): HairObjective[] {

  const byId = new Map(HAIR_OBJECTIVES.map(o => [o.id, o]));

  return ONBOARDING_OBJECTIVE_IDS.map(id => byId.get(id)).filter(

    (o): o is HairObjective => !!o,

  );

}



const LEGACY_OBJECTIVE_TO_ID: Record<string, string> = {

  '💪 Renforcer les fibres': 'Fibre',

  '💧 Hydrater en profondeur': 'Hydratation',

  '🌱 Accélérer la pousse': 'Pousse',

  '✂️ Réparer les pointes': 'Dommages',

  '🎨 Préserver la couleur': 'Dommages',

  '✨ Maximiser la brillance': 'Brillance',

  'Pousser plus vite': 'Pousse',

  'Hydrater en profondeur': 'Hydratation',

  "Améliorer l'humidité": 'Hydratation',

  'Accélérer la pousse': 'Pousse',

  'Définir mes boucles': 'Définition',

  'Définir tes boucles': 'Définition',

  'Stopper la casse': 'Casse_et_chute',

  'Stopper la casse & renforcer les fibres': 'Casse_et_chute',

  'Réduire la casse': 'Casse_et_chute',

  'Tout améliorer': 'Hydratation',

  Brillance: 'Brillance',

  'Maximiser la brillance': 'Brillance',

  'Laissez pousser mes cheveux plus longtemps': 'Pousse',

  'Faire pousser tes cheveux plus longtemps': 'Pousse',

  'Faire pousser mes cheveux': 'Pousse',

  "Remédier à la chute ou à l'amincissement": 'Casse_et_chute',

  Chute: 'Casse_et_chute',

  Casse: 'Casse_et_chute',

  "Améliorer l'épaisseur": 'Densite',

  Epaisseur: 'Densite',

  Pointes: 'Dommages',

  Couleur: 'Dommages',

  Tout: 'Hydratation',

  'Cuir chevelu plus sain': 'Cuir_chevelu',

  'Avoir cuir chevelu plus sain': 'Cuir_chevelu',

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


