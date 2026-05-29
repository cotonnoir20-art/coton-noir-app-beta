import type { CareStyleId } from '../constants/careStyles';
import type { Product } from '../data/products';
import { displayObjective, normalizeObjectiveId } from '../constants/hairObjectives';
import { resolvePorosity } from '../constants/hairProfileOptions';
import { ROUTINE_TYPES, type RoutineStep, type RoutineType } from '../data/routines';
import { CATALOG_RECIPES } from '../data/recipesCatalog';
import { CATALOG_ARTICLES } from '../data/articlesCatalog';
import {
  buildPersonalizationContext,
  matchCatalogArticles,
  matchCatalogProducts,
  resolveRoutineComplexity,
} from './hairPersonalization';

export type DiagnosticSnapshot = {
  hairType: string;
  porosity: string;
  density: string;
  objective: string;
  region: string;
  budget: string;
  careStyle: CareStyleId | '';
  problematics?: string[];
  hairNotes?: string;
  blockers?: string[];
  resultsWeeks?: number;
  hairTypeUnsure?: boolean;
  routineConsistency?: string;
};

export type RecoRoutineStep = {
  title: string;
  duration: string;
  desc: string;
  products: string[];
};

export type RecoProduct = {
  brand: string;
  name: string;
  price: string;
  emoji: string;
  bg?: string;
  image?: string;
  cat: string;
  desc?: string;
  ingredients?: string[];
  matchReason?: string;
};

export type RecoRecipe = {
  id: string;
  name: string;
  category: string;
  duration: number;
  thumb_emoji: string;
  thumb_bg: string;
  ingredients?: string[];
  steps?: string[];
  description?: string;
  difficulty?: string;
  rating?: number;
};

export type RecoArticle = {
  id: string;
  title: string;
  subtitle: string;
  read_time: number;
  thumb_emoji: string;
  thumb_bg: string;
  tags?: string[];
};

export type OnboardingRecommendations = {
  profileSummary: string;
  morning: RecoRoutineStep[];
  evening: RecoRoutineStep[];
  weekly: RecoRoutineStep[];
  products: RecoProduct[];
  recipes: RecoRecipe[];
  articles: RecoArticle[];
  showProducts: boolean;
  showRecipes: boolean;
};

function hairTypeKeys(hairType: string): string[] {
  if (!hairType) return ['3C', '4C'];
  if (hairType === 'Locks') return ['Locks', '4C', '4B', '4A'];
  if (hairType.startsWith('4')) return [hairType, '4C', '4B', '4A'];
  if (hairType.startsWith('3')) return [hairType, '3C', '3B', '3A'];
  return [hairType];
}

function matchesHairType(recipeTypes: string[], hairType: string): boolean {
  const keys = hairTypeKeys(hairType);
  return recipeTypes.some(t => keys.includes(t));
}

function mapSteps(steps: Omit<RoutineStep, 'done'>[]): RecoRoutineStep[] {
  return steps.map(s => ({
    title: s.title,
    duration: s.duration,
    desc: s.desc,
    products: s.products,
  }));
}

function weeklyStepsForHair(hairType: string): RecoRoutineStep[] {
  const base = mapSteps(ROUTINE_TYPES.washday.steps);
  if (hairType.startsWith('4') || hairType === 'Locks') {
    return [
      { title: "Pré-poo à l'huile", duration: '30 min', desc: "Bain d'huile avant lavage pour démêler en douceur.", products: ['Huile de coco', 'Huile de ricin'] },
      { title: 'Shampoing doux', duration: '15 min', desc: 'Nettoyage cuir chevelu sans sulfates agressifs.', products: ['Shampoing sans sulfates'] },
      { title: 'Masque profond', duration: '25 min', desc: 'Hydratation intense sous charlotte.', products: ['Masque Karité'] },
      { title: 'Leave-in + scellage', duration: '10 min', desc: 'Méthode LCO sur cheveux humides.', products: ['Leave-in', 'Beurre karité'] },
    ];
  }
  if (hairType.startsWith('3')) {
    return base;
  }
  return base.slice(0, 4);
}

function customizeDailySteps(
  kind: 'daily' | 'night',
  hairType: string,
  porosity: string,
): RecoRoutineStep[] {
  const steps = mapSteps(ROUTINE_TYPES[kind].steps);
  if (porosity === 'Élevée' && kind === 'daily') {
    return steps.map(s =>
      s.title === 'Scellage'
        ? { ...s, desc: 'Huile riche ou beurre en finition pour retenir l’humidité (porosité haute).' }
        : s,
    );
  }
  if (hairType === 'Locks' && kind === 'night') {
    return [
      { title: 'Hydratation racines', duration: '5 min', desc: 'Spray léger sur longueurs et racines visibles.', products: ['Spray hydratant'] },
      { title: 'Renforcement points', duration: '5 min', desc: 'Huile sur pointes de locks sans surcharger.', products: ['Huile légère'] },
      { title: 'Protection nuit', duration: '3 min', desc: 'Bonnet satin ou foulard en soie.', products: ['Bonnet satin'] },
    ];
  }
  return steps;
}

const STEP_LIMITS: Record<string, { daily: number; night: number; weekly: number }> = {
  simple:   { daily: 3, night: 2, weekly: 3 },
  standard: { daily: 99, night: 99, weekly: 99 },
  advanced: { daily: 99, night: 99, weekly: 99 },
};

export function buildOnboardingRecommendations(input: DiagnosticSnapshot, overrideProducts?: Product[]): OnboardingRecommendations {
  const objective = normalizeObjectiveId(input.objective);
  const careStyle = input.careStyle || 'mix';
  const complexity = resolveRoutineComplexity(input.routineConsistency);
  const limits = STEP_LIMITS[complexity];

  const showProducts = careStyle === 'shop' || careStyle === 'mix';
  const showRecipes = careStyle === 'diy' || careStyle === 'mix';

  function mapRecipe(r: (typeof CATALOG_RECIPES)[number]): RecoRecipe {
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      duration: r.duration,
      thumb_emoji: r.thumb_emoji,
      thumb_bg: r.thumb_bg,
      ingredients: r.ingredients,
      steps: r.steps,
      description: r.description,
      difficulty: r.difficulty,
      rating: r.rating,
    };
  }

  const recipes = CATALOG_RECIPES.filter(r => matchesHairType(r.hair_types, input.hairType))
    .slice(0, 3)
    .map(mapRecipe);

  const fallbackRecipes = CATALOG_RECIPES.slice(0, 3).map(mapRecipe);

  const persoCtx = buildPersonalizationContext(input);
  const catalogArticles = matchCatalogArticles(persoCtx, 3);
  const articles = catalogArticles.map(a => ({
    id: a.id,
    title: a.title,
    subtitle: a.subtitle,
    read_time: a.read_time,
    thumb_emoji: a.thumb_emoji,
    thumb_bg: a.thumb_bg,
    tags: a.tags,
  }));

  const profileSummary = [
    input.hairType || '3C',
    input.porosity ? `porosité ${input.porosity.toLowerCase()}` : null,
    objective ? displayObjective(objective) : null,
    input.region ? `région ${input.region}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    profileSummary,
    morning: customizeDailySteps('daily', input.hairType, input.porosity).slice(0, limits.daily),
    evening: customizeDailySteps('night', input.hairType, input.porosity).slice(0, limits.night),
    weekly: weeklyStepsForHair(input.hairType).slice(0, limits.weekly),
    products: matchCatalogProducts(persoCtx, 4, overrideProducts).map(p => ({
      brand: p.brand,
      name: p.name,
      price: p.price,
      emoji: p.emoji,
      bg: p.bg,
      image: p.image,
      cat: p.cat,
      desc: p.desc,
      ingredients: p.ingredients,
      matchReason: p.matchReason,
    })),
    recipes: recipes.length > 0 ? recipes : fallbackRecipes,
    articles,
    showProducts,
    showRecipes,
  };
}

/** Convertit les étapes recommandées en étapes routine (onglet Routine + accueil). */
export function recoStepsToRoutineSteps(
  steps: RecoRoutineStep[],
  previous?: RoutineStep[],
): RoutineStep[] {
  return steps.map((s, i) => {
    const prev = previous?.find(p => p.title.trim() === s.title.trim());
    return {
      id: i + 1,
      title: s.title,
      duration: s.duration,
      desc: s.desc,
      products: [...s.products],
      done: prev?.done ?? false,
    };
  });
}

export function routineStepsMatchCatalog(steps: RoutineStep[], kind: RoutineType): boolean {
  const catalog = ROUTINE_TYPES[kind].steps;
  if (steps.length !== catalog.length) return false;
  return steps.every((s, i) => s.title.trim() === catalog[i].title.trim());
}

/** Reconstruit le diagnostic à partir du profil sync (accueil post-inscription). */
export function diagnosticSnapshotFromProfile(p: {
  hairType: string;
  porosity: string;
  density: string;
  objective: string;
  region?: string;
  budget?: string;
  careStyle?: string;
  problematics?: string[];
  routineConsistency?: string;
}): DiagnosticSnapshot {
  return {
    hairType: p.hairType || '3C',
    porosity: resolvePorosity(p.porosity),
    density: p.density || 'Moyenne',
    objective: p.objective || '',
    region: p.region ?? '',
    budget: p.budget ?? '',
    careStyle: (p.careStyle || '') as CareStyleId,
    problematics: p.problematics,
    routineConsistency: p.routineConsistency,
  };
}

/** Libellés des contenus débloqués sur l’accueil après inscription. */
export function buildHomeAwaitingTeaser(reco: OnboardingRecommendations): string {
  const items: string[] = [];
  if (reco.evening.length > 1) items.push('suite de ta routine du soir');
  items.push('routine hebdomadaire');
  if (reco.showProducts) items.push('produits recommandés');
  if (reco.showRecipes) items.push('recettes DIY');
  items.push('articles pour toi');
  return items.join(', ');
}
