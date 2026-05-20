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

export const EXPLORER_SECTIONS: { id: string; label: string; items: ExplorerItem[] }[] = [
  {
    id: 'tools',
    label: 'Mes outils',
    items: [
      { ion: 'camera-outline',         ionBg: Colors.cream,      ionColor: Colors.ink,     label: 'Analyse IA',  route: '/(tabs)/analyze' },
      { ion: 'leaf-outline',           ionBg: Colors.sageLight,  ionColor: Colors.sage,     label: 'Ma Routine',  route: '/(tabs)/routine' },
      { ion: 'water-outline',          ionBg: '#DBEAFE',        ionColor: '#2563EB',      label: 'Washday tracker', route: '/washday' },
      { ion: 'stats-chart-outline',    ionBg: Colors.cream,      ionColor: Colors.ink,     label: 'Progression', route: '/growth' },
      { ion: 'flask-outline',          ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Recettes',    route: '/recipes' },
      { ion: 'trophy-outline',         ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Niveaux',     route: '/rewards' },
      { ion: 'heart-outline',          ionBg: Colors.blush,      ionColor: Colors.rose,     label: 'Favoris',     route: '/favorites' },
    ],
  },
  {
    id: 'discover',
    label: 'Découvrir',
    items: [
      { ion: 'bag-handle-outline',     ionBg: Colors.cream,      ionColor: Colors.ink,     label: 'Produits',    route: '/shop' },
      { ion: 'newspaper-outline',      ionBg: Colors.cream,      ionColor: Colors.ink,     label: 'Articles',    route: '/articles' },
      { ion: 'cut-outline',            ionBg: Colors.blush,      ionColor: Colors.rose,     label: 'Coiffures',   route: '/coiffures' },
      { ion: 'play-circle-outline',    ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Tutos',       route: '/tutorials' },
      { ion: 'people-outline',         ionBg: Colors.sageLight,  ionColor: Colors.sage,     label: 'Partenaires', route: '/partners' },
      { ion: 'pricetag-outline',       ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Codes',       route: '/codes' },
      { ion: 'cube-outline',           ionBg: Colors.cream,      ionColor: Colors.ink,     label: 'Box',         route: '/box' },
      { ion: 'diamond-outline',        ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Premium',     route: '/premium', premium: true },
    ],
  },
  {
    id: 'community',
    label: 'Communauté',
    items: [
      { ion: 'chatbubbles-outline',    ionBg: Colors.sageLight,  ionColor: Colors.sage,     label: 'Communauté', route: '/community' },
      { ion: 'gift-outline',           ionBg: Colors.blush,      ionColor: Colors.rose,     label: 'Inviter',    route: '/invite' },
    ],
  },
];
