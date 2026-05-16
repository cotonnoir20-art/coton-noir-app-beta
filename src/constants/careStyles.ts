// Source unique de vérité pour la préférence de soin
// (utilisée par l'onboarding ET par l'écran "Profil capillaire").

export const CARE_STYLES = [
  {
    id:    'shop',
    emoji: '🛒',
    label: 'Produits du commerce',
    desc:  'Marques, gammes capillaires et soins prêts à l\'emploi.',
  },
  {
    id:    'diy',
    emoji: '🧪',
    label: 'Recettes DIY',
    desc:  'Recettes maison à base d\'ingrédients naturels.',
  },
  {
    id:    'mix',
    emoji: '✨',
    label: 'Mixte des deux',
    desc:  'Un combo produits + maison selon les besoins.',
  },
] as const;

export type CareStyleId = typeof CARE_STYLES[number]['id'];

export function getCareStyleMeta(id: string | undefined | null) {
  return CARE_STYLES.find(c => c.id === id);
}
