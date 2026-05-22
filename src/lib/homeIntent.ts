import type { GrowthEntry } from '../context/AppContext';
import type { IonName } from '../components/AppIconBox';
import { Colors } from '../theme/colors';

export type HomeIntent = {
  id: string;
  objective: string;
  title: string;
  sub: string;
  cta: string;
  route: string;
  routeParams?: Record<string, string>;
  ion: IonName;
  ionBg: string;
  ionColor: string;
};

function daysSinceLastMeasure(history: GrowthEntry[]): number | null {
  const dates = history
    .filter(h => h.zone === 'Devant' && /^\d{4}-\d{2}-\d{2}/.test(h.date))
    .map(h => h.date.slice(0, 10));
  if (dates.length === 0) return null;
  const latest = dates.sort().reverse()[0];
  const last = new Date(`${latest}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.floor((today.getTime() - last.getTime()) / 86400000);
}

/** Un raccourci contextuel sur l’accueil (matrice navigation v2). */
export function resolveHomeIntent(args: {
  hasMeasurements: boolean;
  hasDailyPlan: boolean;
  hasAnyRoutineValidation: boolean;
  growthHistory: GrowthEntry[];
  hideBecauseComeback?: boolean;
  hideBecauseDayZero?: boolean;
}): HomeIntent | null {
  if (args.hideBecauseComeback || args.hideBecauseDayZero) return null;

  if (!args.hasMeasurements) {
    return {
      id: 'length_first_measure',
      objective: 'Gagner en longueur',
      title: 'Pose ta première repère',
      sub: 'Une mesure mensuelle + wash days réguliers = la base pour suivre ta pousse.',
      cta: 'Mesurer',
      route: '/hair-length',
      ion: 'resize-outline',
      ionBg: Colors.growthLight,
      ionColor: Colors.growth,
    };
  }

  const measureGap = daysSinceLastMeasure(args.growthHistory);
  if (measureGap != null && measureGap >= 28) {
    return {
      id: 'length_update_measure',
      objective: 'Gagner en longueur',
      title: 'Mettre à jour ma mesure',
      sub: `Dernière mesure il y a ${measureGap} jours — garde ton anneau de progression fiable.`,
      cta: 'Mesurer',
      route: '/hair-length',
      ion: 'stats-chart-outline',
      ionBg: Colors.growthLight,
      ionColor: Colors.growth,
    };
  }

  if (!args.hasDailyPlan && !args.hasAnyRoutineValidation) {
    return {
      id: 'hydrate_define_morning',
      objective: 'Hydrater chaque jour',
      title: 'Créer ma routine du matin',
      sub: '3 étapes suffisent pour hydrater chaque jour et lancer ton streak.',
      cta: 'Définir',
      route: '/routine-plan',
      routeParams: { kind: 'daily' },
      ion: 'sunny-outline',
      ionBg: '#FEF3C7',
      ionColor: '#D97706',
    };
  }

  if (!args.hasAnyRoutineValidation) {
    return {
      id: 'hydrate_first_validation',
      objective: 'Hydrater chaque jour',
      title: 'Valider ma première routine',
      sub: 'Commence par le matin : chaque validation fait avancer ton streak.',
      cta: 'Routine matin',
      route: '/(tabs)/routine?routine=daily',
      ion: 'leaf-outline',
      ionBg: Colors.sageLight,
      ionColor: Colors.sage,
    };
  }

  const day = new Date().getDay();
  if (day % 3 === 0) {
    return {
      id: 'breakage_analyze',
      objective: 'Moins de casse',
      title: 'Analyser mes cheveux',
      sub: 'Diagnostic Black Cotton → routine adaptée → recettes pour ton profil.',
      cta: 'Analyser',
      route: '/(tabs)/analyze',
      ion: 'camera-outline',
      ionBg: Colors.cream,
      ionColor: Colors.ink,
    };
  }
  if (day % 3 === 1) {
    return {
      id: 'products_shop',
      objective: 'Trouver des produits',
      title: 'Trouver mes produits',
      sub: 'Boutique → fiche produit → ajouter à ma routine en mode test.',
      cta: 'Boutique',
      route: '/shop',
      ion: 'bag-handle-outline',
      ionBg: Colors.cream,
      ionColor: Colors.ink,
    };
  }

  return {
    id: 'save_recipes',
    objective: 'Économiser',
    title: 'Recettes maison',
    sub: 'DIY adapté à ton profil — moins cher et souvent plus doux pour tes longueurs.',
    cta: 'Recettes',
    route: '/recipes',
    ion: 'flask-outline',
    ionBg: Colors.sageLight,
    ionColor: Colors.sage,
  };
}
