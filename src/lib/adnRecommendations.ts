/**
 * Moteur de recommandation ADN — alimente recettes, washday, routine, produits.
 * Source de vérité : profil capillaire (hairType, porosity, density, objective, problematics).
 */
import type { HairProfile } from '../context/AppContext';
import { normalizeObjectiveId } from '../constants/hairObjectives';
import { resolvePorosity } from '../constants/hairProfileOptions';
import { CATALOG_RECIPES, type CatalogRecipe } from '../data/recipesCatalog';

// ─── Tags objectif → mots-clés admin_tags recettes ───────────────────────────
const OBJECTIVE_TO_RECIPE_TAGS: Record<string, string[]> = {
  Hydratation:    ['hydratation', 'hydrat', 'masque', 'aloe', 'leave-in'],
  Pousse:         ['pousse', 'scalp', 'huile', 'cuir'],
  Casse_et_chute: ['casse', 'protéines', 'masque', 'huile', 'scalp'],
  Casse:          ['casse', 'protéines', 'masque'],
  Fibre:          ['casse', 'protéines', 'masque', 'réparation'],
  Définition:     ['définition', 'frisottis', 'gel', 'spray', 'leave-in'],
  Brillance:      ['brillance', 'huile', 'spray'],
  Dommages:       ['protéines', 'masque', 'huile', 'réparation'],
  Cuir_chevelu:   ['scalp', 'cuir', 'huile'],
  Pointes:        ['pointes', 'huile', 'sérum'],
  Transition:     ['hydratation', 'masque', 'protéines', 'scalp'],
  Chute:          ['pousse', 'scalp', 'huile'],
  Couleur:        ['hydratation', 'masque'],
  Densite:        ['masque', 'leave-in'],
  Epaisseur:      ['masque', 'leave-in'],
  Tout:           ['hydratation', 'masque'],
};

// ─── Problématiques → mots-clés admin_tags recettes ──────────────────────────
const PROBLEMATIC_TO_RECIPE_TAGS: Record<string, string[]> = {
  'Cheveux secs et cassants':         ['hydratation', 'masque', 'huile'],
  'Casse':                            ['casse', 'protéines', 'masque'],
  'Frisottis':                        ['frisottis', 'spray', 'gel', 'leave-in'],
  'Fourches et pointes abîmées':      ['pointes', 'huile', 'masque'],
  'Manque de brillance':              ['brillance', 'huile', 'spray'],
  'Noeuds fréquents':                 ['masque', 'huile', 'démêlant'],
  'Pellicules':                       ['scalp', 'cuir'],
  'Problèmes de cuir chevelu':        ['scalp', 'cuir', 'huile'],
  'Chute de cheveux':                 ['pousse', 'scalp', 'huile'],
  'Alopécie de traction':             ['scalp', 'pousse', 'huile'],
  'Perte de définition des boucles':  ['définition', 'frisottis', 'gel', 'leave-in'],
};

// ─── Normalise la porosité pour matcher les champs recettes (Basse vs Faible) ─
function porosityToRecipeField(p: string): string {
  if (p === 'Faible') return 'Basse';
  return p; // Moyenne, Élevée
}

// ─── Score d'une recette pour un profil ──────────────────────────────────────
export function scoreRecipeForProfile(recipe: CatalogRecipe, profile: HairProfile): number {
  let score = recipe.featured ? 1 : 0;

  const hairType  = profile.hairType?.trim() || '';
  const porosity  = resolvePorosity(profile.porosity);
  const objective = normalizeObjectiveId(profile.objective ?? '');
  const problematics = profile.problematics ?? [];

  // hair_types match (+3)
  if (hairType && recipe.hair_types.length > 0) {
    if (recipe.hair_types.includes(hairType) || recipe.hair_types.includes('ALL')) {
      score += 3;
    } else {
      // Bonus partiel si même famille (4A/4B/4C → 4x)
      const prefix = hairType[0];
      if (recipe.hair_types.some(t => t.startsWith(prefix))) score += 1;
    }
  }

  // porosity match (+2)
  if (porosity && recipe.porosity && recipe.porosity.length > 0) {
    if (recipe.porosity.includes(porosityToRecipeField(porosity))) score += 2;
  }

  // admin_tags vs objectif (+1 par tag)
  const objTags = OBJECTIVE_TO_RECIPE_TAGS[objective] ?? [];
  for (const tag of (recipe.admin_tags ?? [])) {
    const t = tag.toLowerCase();
    if (objTags.some(k => t.includes(k) || k.includes(t))) score += 1;
  }

  // admin_tags vs problématiques (+0.5 par match)
  for (const prob of problematics) {
    const probTags = PROBLEMATIC_TO_RECIPE_TAGS[prob] ?? [];
    for (const tag of (recipe.admin_tags ?? [])) {
      const t = tag.toLowerCase();
      if (probTags.some(k => t.includes(k) || k.includes(t))) score += 0.5;
    }
  }

  return score;
}

/**
 * Retourne les N recettes du catalogue les mieux scorées pour le profil.
 * Si le profil est vide → retourne les recettes featured.
 */
export function getPersonalizedRecipes(profile: HairProfile, limit = 4): CatalogRecipe[] {
  const hasProfile = !!(profile.hairType || profile.objective || (profile.problematics?.length ?? 0) > 0);
  if (!hasProfile) return CATALOG_RECIPES.filter(r => r.featured).slice(0, limit);

  return [...CATALOG_RECIPES]
    .map(r => ({ r, score: scoreRecipeForProfile(r, profile) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.r)
    .slice(0, limit);
}

// ─── Fréquence wash day ───────────────────────────────────────────────────────

export type WashdayReco = {
  frequencyDays: number;
  label: string;
  rangeLabel: string;
  tip: string;
};

function baseWashdayDays(hairType: string): number {
  if (hairType === 'Locks') return 18;
  if (hairType.startsWith('4')) return 12;
  if (hairType.startsWith('3')) return 9;
  return 10;
}

/**
 * Fréquence de wash day recommandée basée sur le type, la densité et la porosité.
 */
export function getWashdayReco(profile: HairProfile): WashdayReco | null {
  const hairType = profile.hairType?.trim() || '';
  const porosity  = resolvePorosity(profile.porosity);
  const density   = profile.density?.trim() || '';

  if (!hairType && !porosity && !density) return null;

  let days = baseWashdayDays(hairType);

  // Densité
  if (density === 'Fine')    days -= 2;
  if (density === 'Épaisse') days += 2;

  // Porosité
  if (porosity === 'Élevée') days -= 1;
  if (porosity === 'Faible') days += 2;

  days = Math.max(5, Math.min(21, days));

  const rangeLabel =
    days <= 7  ? '5–7 jours' :
    days <= 10 ? '7–10 jours' :
    days <= 14 ? '10–14 jours' :
                 '14–21 jours';

  const TIPS: Record<string, string> = {
    Élevée: "Ta porosité élevée perd l'eau vite et accumule les résidus rapidement — maintiens une fréquence régulière.",
    Faible: "Ta cuticule fermée retient bien les produits. Laver trop souvent décape sans bénéfice réel.",
    Moyenne: "Ta porosité équilibrée tolère une fréquence régulière. Adapte selon le ressenti après quelques cycles.",
  };

  return {
    frequencyDays: days,
    label: `Tous les ${days} jours`,
    rangeLabel,
    tip: TIPS[porosity] ?? TIPS.Moyenne,
  };
}

// ─── Conseil ADN pour la routine ─────────────────────────────────────────────

export type RoutineADNTip = {
  method: 'LOC' | 'LCO';
  title: string;
  tip: string;
};

/**
 * Conseil de méthode LOC/LCO personnalisé pour l'écran Routine.
 * Retourne null si le profil ne contient pas assez d'infos.
 */
export function getRoutineADNTip(profile: HairProfile): RoutineADNTip | null {
  if (!profile.hairType && !profile.porosity) return null;
  const porosity = resolvePorosity(profile.porosity);

  if (porosity === 'Faible') {
    return {
      method: 'LCO',
      title: 'Méthode LCO · Porosité faible',
      tip: "Ta cuticule fermée résiste à l'eau. Commence par le liquide hydratant, puis la crème pour faire pénétrer, et termine par une huile légère (jojoba, pépins de raisin).",
    };
  }
  if (porosity === 'Élevée') {
    return {
      method: 'LOC',
      title: "Méthode LOC · Scelle l’humidité",
      tip: "Ta cuticule très ouverte laisse s'échapper l'eau rapidement. Applique l'huile lourde (coco, ricin) juste après le liquide pour sceller, puis la crème protectrice.",
    };
  }
  return {
    method: 'LOC',
    title: 'Méthode LOC · Ta routine type',
    tip: "Ta porosité équilibrée tolère bien la méthode LOC. Liquide → Huile légère → Crème hydratante pour maintenir l'hydratation toute la semaine.",
  };
}
