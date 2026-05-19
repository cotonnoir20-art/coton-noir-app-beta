import type { IonName } from '../components/AppIconBox';
import type { RoutineType } from '../data/routines';
import { Colors } from '../theme/colors';

export type StepIconVisual = {
  ion: IonName;
  ionBg: string;
  ionColor: string;
  /** Fond dégradé des bulles accueil */
  gradient: [string, string];
};

const MORNING_DEFAULT: StepIconVisual = {
  ion: 'sparkles-outline',
  ionBg: Colors.amberLight,
  ionColor: Colors.amberDark,
  gradient: [Colors.amberPowder, Colors.amber],
};

const EVENING_DEFAULT: StepIconVisual = {
  ion: 'moon-outline',
  ionBg: Colors.growthLight,
  ionColor: Colors.growth,
  gradient: [Colors.growthLight, Colors.sageLight],
};

const WASHDAY_DEFAULT: StepIconVisual = {
  ion: 'water-outline',
  ionBg: Colors.sageLight,
  ionColor: Colors.sageDark,
  gradient: [Colors.sageLight, Colors.growthLight],
};

function matchTitle(title: string, needles: string[]): boolean {
  const t = title.toLowerCase();
  return needles.some(n => t.includes(n));
}

/** Icône Ionicons pour une étape matin / soir (charte : orange · sage · ardoise). */
export function getRoutineStepIcon(title: string, kind: Extract<RoutineType, 'daily' | 'night'>): StepIconVisual {
  if (kind === 'daily') {
    if (matchTitle(title, ['humid', 'vapor', 'spray', 'eau']))
      return {
        ion: 'water-outline',
        ionBg: Colors.sageLight,
        ionColor: Colors.sageDark,
        gradient: [Colors.sageLight, Colors.amberPowder],
      };
    if (matchTitle(title, ['leave', 'crème', 'creme']))
      return {
        ion: 'leaf-outline',
        ionBg: Colors.sageLight,
        ionColor: Colors.sageDark,
        gradient: [Colors.sageBright, Colors.amberLight],
      };
    if (matchTitle(title, ['scell', 'huile', 'beurre', 'lco', 'loc']))
      return {
        ion: 'sparkles-outline',
        ionBg: Colors.amberLight,
        ionColor: Colors.amberDark,
        gradient: [Colors.amberLight, Colors.amber],
      };
    if (matchTitle(title, ['coiff', 'style', 'défin', 'defin', 'gel']))
      return {
        ion: 'color-wand-outline',
        ionBg: Colors.amberPowder,
        ionColor: Colors.amberInk,
        gradient: [Colors.amberPowder, Colors.amberDark],
      };
    return MORNING_DEFAULT;
  }

  if (matchTitle(title, ['démêl', 'demel', 'peign', 'bross']))
    return {
      ion: 'brush-outline',
      ionBg: Colors.growthLight,
      ionColor: Colors.growth,
      gradient: [Colors.growthLight, Colors.cream],
    };
  if (matchTitle(title, ['hydrat', 'leave', 'nuit', 'nocturn']))
    return {
      ion: 'water-outline',
      ionBg: Colors.sageLight,
      ionColor: Colors.sageDark,
      gradient: [Colors.sageLight, Colors.growthLight],
    };
  if (matchTitle(title, ['tress', 'vanille', 'protect', 'natt']))
    return {
      ion: 'ribbon-outline',
      ionBg: Colors.blush,
      ionColor: Colors.rose,
      gradient: [Colors.blush, Colors.growthLight],
    };
  if (matchTitle(title, ['bonnet', 'satin', 'foulard', 'soie', 'dormir']))
    return {
      ion: 'bed-outline',
      ionBg: Colors.growthLight,
      ionColor: Colors.inkSoft,
      gradient: [Colors.growthLight, Colors.sageLight],
    };
  if (matchTitle(title, ['renforc', 'point', 'racine']))
    return {
      ion: 'fitness-outline',
      ionBg: Colors.amberPowder,
      ionColor: Colors.amberInk,
      gradient: [Colors.amberPowder, Colors.sageLight],
    };
  return EVENING_DEFAULT;
}

/** Icône pour une étape wash day. */
export function getWashdayStepIcon(title: string): StepIconVisual {
  if (matchTitle(title, ['pré-poo', 'pre-poo', 'prepoo', 'huile']))
    return {
      ion: 'flask-outline',
      ionBg: Colors.sageLight,
      ionColor: Colors.sageDark,
      gradient: [Colors.sageLight, Colors.amberPowder],
    };
  if (matchTitle(title, ['co-wash', 'cowash', 'shampoing', 'lavage']))
    return {
      ion: 'water-outline',
      ionBg: Colors.growthLight,
      ionColor: Colors.growth,
      gradient: [Colors.growthLight, Colors.sageBright],
    };
  if (matchTitle(title, ['masque', 'soin', 'hydrat']))
    return {
      ion: 'sparkles-outline',
      ionBg: Colors.sageLight,
      ionColor: Colors.sageDark,
      gradient: [Colors.sageBright, Colors.sageLight],
    };
  if (matchTitle(title, ['leave', 'lco', 'loc', 'scell']))
    return {
      ion: 'leaf-outline',
      ionBg: Colors.amberLight,
      ionColor: Colors.amberDark,
      gradient: [Colors.amberLight, Colors.amberPowder],
    };
  if (matchTitle(title, ['protection', 'bonnet', 'nuit', 'satin']))
    return {
      ion: 'bed-outline',
      ionBg: Colors.growthLight,
      ionColor: Colors.inkSoft,
      gradient: [Colors.growthLight, Colors.sageLight],
    };
  if (matchTitle(title, ['démêl', 'demel']))
    return {
      ion: 'brush-outline',
      ionBg: Colors.cream,
      ionColor: Colors.warmGray,
      gradient: [Colors.cream, Colors.growthLight],
    };
  return WASHDAY_DEFAULT;
}

export function getPeriodIcon(kind: Extract<RoutineType, 'daily' | 'night'>): Pick<StepIconVisual, 'ion' | 'ionBg' | 'ionColor'> {
  if (kind === 'daily') {
    return { ion: 'sunny-outline', ionBg: Colors.amberPowder, ionColor: Colors.amberDark };
  }
  return { ion: 'moon-outline', ionBg: Colors.growthLight, ionColor: Colors.growth };
}
