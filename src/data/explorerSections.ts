import { Colors } from '../theme/colors';
import type { IonName } from '../components/AppIconBox';

export type ExplorerItem = {
  ion: IonName;
  ionBg: string;
  ionColor: string;
  label: string;
  route: string;
  premium?: boolean;
};

/** Hub Découvrir — navigation v2 par intention (matrice entrée → objectif). */
export const EXPLORER_SECTIONS: { id: string; label: string; items: ExplorerItem[] }[] = [
  {
    id: 'care',
    label: 'Prendre soin',
    items: [
      { ion: 'leaf-outline', ionBg: Colors.sageLight, ionColor: Colors.sage, label: 'Ma routine', route: '/(tabs)/routine' },
      { ion: 'water-outline', ionBg: '#DBEAFE', ionColor: '#2563EB', label: 'Wash day', route: '/washday' },
      { ion: 'bag-outline', ionBg: Colors.amberPowder, ionColor: Colors.amberDark, label: 'Ma trousse', route: '/ma-trousse' },
      { ion: 'camera-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Analyse IA', route: '/(tabs)/analyze' },
      { ion: 'cellular-outline', ionBg: Colors.growthLight, ionColor: Colors.growth, label: 'Mon ADN', route: '/adn-capillaire' },
      { ion: 'person-circle-outline', ionBg: Colors.blush, ionColor: Colors.rose, label: 'Profil capillaire', route: '/hair-profile' },
      { ion: 'settings-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Paramètres', route: '/(tabs)/profile' },
    ],
  },
  {
    id: 'progress',
    label: 'Progresser',
    items: [
      { ion: 'stats-chart-outline', ionBg: Colors.growthLight, ionColor: Colors.growth, label: 'Ma progression', route: '/growth' },
      { ion: 'document-text-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Bilan trimestriel', route: '/quarterly-bilan' },
      { ion: 'calculator-outline', ionBg: Colors.growthLight, ionColor: Colors.growth, label: 'Calculateur pousse', route: '/growth-calculator' },
      { ion: 'heart-outline', ionBg: Colors.blush, ionColor: Colors.rose, label: 'Favoris', route: '/favorites' },
    ],
  },
  {
    id: 'save_buy',
    label: 'Économiser & acheter',
    items: [
      { ion: 'storefront-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Offres partenaires', route: '/codes' },
      { ion: 'pricetag-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Mes codes', route: '/codes' },
      { ion: 'flask-outline', ionBg: Colors.sageLight, ionColor: Colors.sage, label: 'Recettes', route: '/recipes' },
      { ion: 'bag-handle-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Boutique', route: '/shop' },
      { ion: 'people-outline', ionBg: Colors.sageLight, ionColor: Colors.sage, label: 'Partenaires', route: '/partners' },
      { ion: 'cube-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Box', route: '/box' },
    ],
  },
  {
    id: 'learn_style',
    label: 'Comprendre & se coiffer',
    items: [
      { ion: 'newspaper-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Articles', route: '/articles' },
      { ion: 'play-circle-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Tutos', route: '/tutorials' },
      { ion: 'cut-outline', ionBg: Colors.blush, ionColor: Colors.rose, label: 'Coiffures', route: '/coiffures' },
    ],
  },
  {
    id: 'motivation',
    label: 'Motivation & communauté',
    items: [
      { ion: 'trophy-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Niveaux & CC', route: '/rewards' },
      { ion: 'chatbubbles-outline', ionBg: Colors.sageLight, ionColor: Colors.sage, label: 'Communauté', route: '/community' },
      { ion: 'gift-outline', ionBg: Colors.blush, ionColor: Colors.rose, label: 'Inviter', route: '/invite' },
      { ion: 'diamond-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Premium', route: '/premium', premium: true },
    ],
  },
];
