import { Colors } from '../theme/colors';
import type { IonName } from '../components/AppIconBox';

export type DiscoverModuleItem = {
  ion: IonName;
  ionBg: string;
  ionColor: string;
  label: string;
  route: string;
  premium?: boolean;
};

export type DiscoverModule = {
  id: string;
  label: string;
  subtitle: string;
  items: DiscoverModuleItem[];
};

/** Hub « Découvrir » — aligné sur les parcours produit. */
export const DISCOVER_MODULES: DiscoverModule[] = [
  {
    id: 'learn',
    label: 'Apprendre',
    subtitle: 'Article → favori → partage',
    items: [
      { ion: 'newspaper-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Articles', route: '/articles' },
      { ion: 'heart-outline', ionBg: Colors.blush, ionColor: Colors.rose, label: 'Mes favoris', route: '/favorites' },
    ],
  },
  {
    id: 'diy',
    label: 'Faire maison',
    subtitle: 'Recette → ingrédients → routine',
    items: [
      { ion: 'flask-outline', ionBg: Colors.sageLight, ionColor: Colors.sage, label: 'Recettes', route: '/recipes' },
    ],
  },
  {
    id: 'buy',
    label: 'Acheter',
    subtitle: 'Shop → offres partenaires → codes',
    items: [
      { ion: 'bag-handle-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Boutique', route: '/shop' },
      { ion: 'storefront-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Offres partenaires', route: '/codes' },
      { ion: 'pricetag-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Mes codes', route: '/codes' },
      { ion: 'people-outline', ionBg: Colors.sageLight, ionColor: Colors.sage, label: 'Partenaires', route: '/partners' },
    ],
  },
  {
    id: 'style',
    label: 'Se coiffer',
    subtitle: 'Coiffure → étapes & outils',
    items: [
      { ion: 'cut-outline', ionBg: Colors.blush, ionColor: Colors.rose, label: 'Coiffures', route: '/coiffures' },
    ],
  },
  {
    id: 'watch',
    label: 'Regarder',
    subtitle: 'Tutos vidéo',
    items: [
      { ion: 'play-circle-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Tutoriels', route: '/tutorials' },
    ],
  },
  {
    id: 'premium',
    label: 'Box & Premium',
    subtitle: 'Box digitale → Premium si verrouillé',
    items: [
      { ion: 'cube-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Box digitale', route: '/box' },
      { ion: 'diamond-outline', ionBg: Colors.ink, ionColor: Colors.amber, label: 'Premium', route: '/premium', premium: true },
    ],
  },
];

/** Raccourcis accueil — alignés matrice navigation v2. */
export const HOME_DISCOVER_SHORTCUTS: DiscoverModuleItem[] = [
  { ion: 'camera-outline',     ionBg: Colors.cream,      ionColor: Colors.ink,      label: 'Analyse',            route: '/(tabs)/analyze' },
  { ion: 'storefront-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Offres partenaires', route: '/codes' },
  { ion: 'stats-chart-outline',ionBg: Colors.growthLight,ionColor: Colors.growth,   label: 'Progression',        route: '/growth' },
  { ion: 'bag-handle-outline', ionBg: Colors.cream,      ionColor: Colors.ink,      label: 'Shop',               route: '/shop' },
  { ion: 'flask-outline',      ionBg: Colors.sageLight,  ionColor: Colors.sage,     label: 'Recettes',           route: '/recipes' },
  { ion: 'chatbubbles-outline',ionBg: Colors.sageLight,  ionColor: Colors.sage,     label: 'Communauté',         route: '/community' },
  { ion: 'play-circle-outline',ionBg: Colors.amberLight, ionColor: Colors.amberDark,label: 'Tutos',              route: '/tutorials' },
];
