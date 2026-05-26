/**
 * Personnalisation déterministe : profil capillaire + catalogue réel.
 * Les tags IA (analyse photo) ne servent qu'à affiner le tri — jamais à inventer du contenu.
 *
 * Dimensions actives :
 *   hairType · porosity · objective · problematics (existant)
 *   density · budget · climate · careStyle · hairBlockers · hairConfidence · routineConsistency (nouveau)
 */
import type { HairProfile } from '../context/AppContext';
import { normalizeObjectiveId } from '../constants/hairObjectives';
import { HAIR_PROBLEMATICS, normalizeProblematicLabels } from '../constants/hairProblematics';
import { resolvePorosity } from '../constants/hairProfileOptions';
import { CATALOG_ARTICLES, type CatalogArticle } from '../data/articlesCatalog';
import { PRODUCTS, type Product } from '../data/products';
import { CATALOG_RECIPES, type CatalogRecipe } from '../data/recipesCatalog';
import type { CareStyleId } from '../constants/careStyles';
import { ROUTINE_TYPES } from '../data/routines';
import { matchRecipesFromTags } from './matchRecipesFromTags';

/** Tags autorisés renvoyés par l'analyse IA (allowlist = edge function). */
export const ALLOWED_ANALYSIS_TAGS = new Set([
  'hydratation', 'sécheresse', 'casse', 'protéines', 'scellage',
  'frisottis', 'brillance', 'pousse', 'scalp', 'anti-buildup',
  'leave-in', 'masque', 'huile',
]);

// ─── Mappings objectifs ────────────────────────────────────────────────────────
const OBJECTIVE_KEYWORDS: Record<string, string[]> = {
  Hydratation:    ['hydratation', 'hydrat', 'masque', 'leave-in', 'sécheresse'],
  Pousse:         ['pousse', 'scalp', 'huile', 'compl'],
  Casse_et_chute: ['casse', 'pousse', 'scalp', 'compl', 'huile', 'masque', 'protéines'],
  Fibre:          ['casse', 'protéines', 'masque', 'réparation'],
  Brillance:      ['brillance', 'huile', 'style', 'leave-in'],
  Densite:        ['leave-in', 'masque', 'coiffage', 'volume'],
  Cuir_chevelu:   ['scalp', 'cuir chevelu', 'huile', 'sham'],
  Définition:     ['définition', 'frisottis', 'coiffage', 'leave-in'],
  Dommages:       ['protéines', 'masque', 'hydratation', 'réparation', 'pointes', 'huile'],
  Transition:     ['hydratation', 'masque', 'routine', 'scalp', 'protéines'],
  Chute:          ['pousse', 'scalp', 'compl', 'huile', 'masque'],
  Casse:          ['casse', 'protéines', 'masque'],
  Epaisseur:      ['leave-in', 'masque', 'coiffage', 'volume'],
  Pointes:        ['pointes', 'huile', 'sérum'],
  Couleur:        ['couleur', 'hydratation', 'masque'],
  Tout:           ['hydratation', 'routine', 'équilibre'],
};

// ─── Mappings problématiques ───────────────────────────────────────────────────
const PROBLEMATIC_TO_TAGS: Record<string, string[]> = {
  Sécheresse:                  ['sécheresse', 'hydratation', 'masque', 'huile'],
  Casse:                       ['casse', 'protéines', 'masque'],
  Pellicules:                  ['scalp', 'cuir chevelu'],
  Frisottis:                   ['frisottis', 'leave-in', 'coiffage'],
  'Cheveux fins':              ['leave-in', 'coiffage'],
  'Cheveux gras':              ['anti-buildup', 'shampoing'],
  'Manque de brillance':       ['brillance', 'huile'],
  'Nœuds fréquents':           ['masque', 'huile', 'hydratation'],
  'Pousse lente':              ['pousse', 'scalp', 'huile'],
  'Produits inadaptés':        ['hydratation', 'masque', 'leave-in'],
  'Routine incohérente':       ['hydratation', 'routine', 'leave-in'],
  'Dommages chaleur':          ['protéines', 'masque', 'hydratation', 'chaleur'],
  'Dommages chimiques':        ['couleur', 'protéines', 'masque', 'hydratation', 'réparation'],
  'Problèmes de cuir chevelu': ['scalp', 'cuir chevelu', 'huile'],
};

// ─── Mappings blockers ─────────────────────────────────────────────────────────
const BLOCKER_TO_TAGS: Record<string, string[]> = {
  consistency:       ['hydratation', 'routine'],
  dont_know:         ['hydratation', 'masque'],
  too_many_products: ['anti-buildup', 'shampoing'],
  no_structure:      ['hydratation', 'leave-in'],
  stylist:           ['scalp', 'pousse'],
  budget:            ['hydratation', 'masque'],
};

/**
 * Quel type de professionnel recommander selon les blockers.
 * Utilisé pour orienter vers un salon / coach capillaire.
 */
export const BLOCKER_TO_PRO_NEED: Record<string, { label: string; reason: string }> = {
  consistency:       { label: 'Coach capillaire', reason: 'Pour t\'aider à créer une routine que tu peux vraiment tenir.' },
  dont_know:         { label: 'Diagnostic capillaire', reason: 'Un professionnel peut identifier ce qui convient vraiment à ta fibre.' },
  no_structure:      { label: 'Coach capillaire', reason: 'Pour structurer ta routine étape par étape selon tes besoins.' },
  too_many_products: { label: 'Conseiller capillaire', reason: 'Pour faire le tri et ne garder que ce qui fonctionne pour toi.' },
  stylist:           { label: 'Coiffeur spécialisé naturel', reason: 'Un coiffeur expert cheveux naturels peut soigner ton cuir chevelu et booster la pousse.' },
  budget:            { label: 'Conseiller capillaire', reason: 'Pour trouver les meilleurs produits dans ton budget sans compromis sur l\'efficacité.' },
};

// ─── Label → ID onboarding ────────────────────────────────────────────────────
/** Map libellé canonique (stocké en DB) → id onboarding (utilisé dans admin_tags). */
const LABEL_TO_PROBLEMATIC_ID: Map<string, string> = new Map(
  HAIR_PROBLEMATICS.flatMap((p): [string, string][] => {
    const pairs: [string, string][] = [[p.label, p.id]];
    if (p.onboardingLabel) pairs.push([p.onboardingLabel, p.id]);
    return pairs;
  }),
);

// ─── Mappings density ─────────────────────────────────────────────────────────
/**
 * density → tags supplémentaires.
 * Faible  : privilégier produits légers (leave-in, spray), éviter les masques lourds.
 * Épaisse : privilégier masques riches, huiles, produits pénétrants.
 */
const DENSITY_TO_TAGS: Record<string, string[]> = {
  Faible:   ['leave-in', 'légèreté', 'spray', 'volume'],
  Moyenne:  [],
  Épaisse:  ['masque', 'huile', 'scellage', 'hydratation'],
};

// ─── Mappings climate ─────────────────────────────────────────────────────────
/**
 * climate → tags supplémentaires.
 * Tropical humide / Équatorial : anti-frizz, scellage, produits humidité-résistants.
 * Méditerranéen / sec           : hydratation intense.
 * Tempéré / Varié               : standard.
 */
const CLIMATE_TO_TAGS: Record<string, string[]> = {
  'Tropical humide': ['frisottis', 'scellage', 'anti-humidité', 'style'],
  'Tropical':        ['frisottis', 'scellage', 'anti-humidité'],
  'Équatorial':      ['frisottis', 'scellage', 'anti-humidité', 'hydratation'],
  'Méditerranéen':   ['hydratation', 'sécheresse', 'huile'],
  'Tempéré':         [],
  'Varié':           [],
};

// ─── Seuils budget par produit ─────────────────────────────────────────────────
/**
 * Seuil prix max par produit unitaire selon le budget mensuel déclaré.
 * Le budget est mensuel ; on estime qu'un produit = 1/3 du budget mensuel max.
 */
const BUDGET_MAX_PRICE: Record<string, number> = {
  mini:    15,   // < 20 €/mois → produit max ~15 €
  moyen:   35,   // 20-50 €/mois → produit max ~35 €
  confort: 80,   // 50-100 €/mois → produit max ~80 €
  libre:   Infinity,
};

function parsePriceEur(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d,\.]/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/** Résout le budget id depuis la valeur DB (ex: "20 – 50 €/mois" → "moyen"). */
function resolveBudgetId(budget: string | undefined): string {
  if (!budget) return 'libre';
  const b = budget.toLowerCase();
  if (b.includes('mini') || b.includes('< 20') || b.includes('petit')) return 'mini';
  if (b.includes('moyen') || b.includes('20') || b.includes('50')) return 'moyen';
  if (b.includes('confort') || b.includes('100')) return 'confort';
  if (b.includes('libre') || b.includes('limit') || b.includes('100 €+')) return 'libre';
  return 'libre';
}

// ─── TAG → catégorie produit ───────────────────────────────────────────────────
const TAG_TO_PRODUCT_CAT: Record<string, Product['cat'][]> = {
  hydratation:      ['mask', 'leave', 'cond'],
  sécheresse:       ['mask', 'oil', 'leave'],
  casse:            ['mask', 'oil', 'leave'],
  protéines:        ['mask', 'leave'],
  scellage:         ['oil'],
  frisottis:        ['style', 'oil', 'leave'],
  'anti-humidité':  ['style', 'leave'],
  brillance:        ['oil', 'style'],
  pousse:           ['oil', 'compl'],
  scalp:            ['oil', 'sham'],
  'anti-buildup':   ['sham'],
  'leave-in':       ['leave'],
  légèreté:         ['leave', 'style'],
  volume:           ['leave', 'style'],
  masque:           ['mask'],
  huile:            ['oil'],
  spray:            ['leave', 'style'],
};

// ─── Types exportés ───────────────────────────────────────────────────────────
export type PersonalizationInput = Pick<
  HairProfile,
  'hairType' | 'porosity' | 'density' | 'objective' | 'problematics' | 'careStyle'
> & {
  budget?: string;
  climate?: string;
  hairBlockers?: string[];
  hairConfidence?: string;
  routineConsistency?: string;
};

export type PersonalizationSnapshot = {
  hairType:          string;
  porosity:          string;
  density:           string;
  objective:         string;
  careStyle:         CareStyleId | '';
  budget:            string;
  climate:           string;
  problematics?:     string[];
  blockers?:         string[];
  hairConfidence?:   string;
  routineConsistency?: string;
};

export type PersonalizationContext = {
  tags:          string[];
  profileLabels: string[];
  snapshot:      PersonalizationSnapshot;
};

export type ScoredProduct = Product & { matchScore: number; matchReason: string };

// ─── Salon / professionnel recommandé ─────────────────────────────────────────
export type ProRecommendation = {
  label:  string;
  reason: string;
};

export function sanitizeAnalysisTags(tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.toLowerCase().trim();
    if (ALLOWED_ANALYSIS_TAGS.has(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

function inputFromProfile(profile: HairProfile): PersonalizationInput {
  return {
    hairType:          profile.hairType,
    porosity:          profile.porosity,
    density:           profile.density,
    objective:         profile.objective,
    problematics:      profile.problematics,
    careStyle:         profile.careStyle,
    budget:            profile.budget,
    climate:           profile.climate,
    hairBlockers:      profile.hairBlockers,
    hairConfidence:    profile.hairConfidence,
    routineConsistency: profile.routineConsistency,
  };
}

/**
 * Construit le contexte de personnalisation complet.
 * Prend en compte les 7 nouvelles dimensions en plus des existantes.
 */
export function buildPersonalizationContext(
  profile: HairProfile | PersonalizationInput,
  analysisTags?: string[],
): PersonalizationContext {
  const input = 'careStyle' in profile && 'region' in (profile as HairProfile)
    ? inputFromProfile(profile as HairProfile)
    : (profile as PersonalizationInput);

  const snapshot: PersonalizationSnapshot = {
    hairType:           input.hairType || '3C',
    porosity:           resolvePorosity(input.porosity),
    density:            input.density ?? 'Moyenne',
    objective:          input.objective || '',
    careStyle:          (input.careStyle || '') as CareStyleId,
    budget:             input.budget ?? '',
    climate:            input.climate ?? '',
    problematics:       input.problematics,
    blockers:           input.hairBlockers,
    hairConfidence:     input.hairConfidence,
    routineConsistency: input.routineConsistency,
  };

  const tags: string[] = [];
  const profileLabels: string[] = [];

  // 1. Objectif
  const objective = normalizeObjectiveId(input.objective);
  if (objective && OBJECTIVE_KEYWORDS[objective]) {
    profileLabels.push(objective);
    tags.push(...OBJECTIVE_KEYWORDS[objective]);
  }

  // 2. Problématiques
  for (const label of normalizeProblematicLabels(input.problematics)) {
    profileLabels.push(label);
    const mapped = PROBLEMATIC_TO_TAGS[label];
    if (mapped) tags.push(...mapped);
    else tags.push(label.toLowerCase());
  }

  // 3. Blockers
  for (const blockerId of snapshot.blockers ?? []) {
    const mapped = BLOCKER_TO_TAGS[blockerId];
    if (mapped) tags.push(...mapped);
  }

  // 4. Porosité
  const porosity = resolvePorosity(input.porosity);
  if (porosity === 'Élevée') tags.push('hydratation', 'scellage', 'huile');
  if (porosity === 'Faible') tags.push('anti-buildup', 'leave-in');

  // 5. Type de cheveux
  if (input.hairType) tags.push(input.hairType.toLowerCase());

  // 6. DENSITY — produits légers vs riches
  const densityTags = DENSITY_TO_TAGS[snapshot.density] ?? [];
  tags.push(...densityTags);

  // 7. CLIMATE — anti-humidité, hydratation intense selon climat
  const climateTags = CLIMATE_TO_TAGS[snapshot.climate] ?? [];
  tags.push(...climateTags);

  // 8. Tags IA validés (photo analyse)
  const safeAnalysis = sanitizeAnalysisTags(analysisTags);
  for (const t of safeAnalysis) {
    if (!tags.includes(t)) tags.push(t);
  }

  return {
    tags: [...new Set(tags.filter(Boolean))],
    profileLabels,
    snapshot,
  };
}

/**
 * Résout les IDs onboarding du profil : problematic IDs + objectif ID.
 * Correspond directement aux `admin_tags` des produits/recettes — pas de mapping intermédiaire.
 */
export function resolveProfileOnboardingIds(ctx: PersonalizationContext): string[] {
  const ids = new Set<string>();

  for (const label of normalizeProblematicLabels(ctx.snapshot.problematics)) {
    const id = LABEL_TO_PROBLEMATIC_ID.get(label);
    if (id) ids.add(id);
  }

  const obj = normalizeObjectiveId(ctx.snapshot.objective);
  if (obj) ids.add(obj);

  return [...ids];
}

// ─── Raisons de matching produit ──────────────────────────────────────────────
function productMatchReason(p: Product, ctx: PersonalizationContext): string {
  const { porosity, objective, problematics = [], hairType, density, climate } = ctx.snapshot;
  const prob = problematics ?? [];
  const obj  = normalizeObjectiveId(objective);
  const has  = (label: string) => prob.some(pr => pr === label);

  // Climate-specific reasons
  const isHumidClimate = ['Tropical humide', 'Tropical', 'Équatorial'].includes(climate);
  const isDryClimate   = climate === 'Méditerranéen';

  if (p.cat === 'mask') {
    if (has('Casse') || has('Dommages chaleur') || has('Dommages chimiques'))
      return "Tes cheveux fragilisés ont besoin de protéines pour renforcer la structure de la fibre.";
    if (has('Sécheresse') || porosity === 'Élevée' || isDryClimate)
      return "Parfait pour tes cheveux à haute porosité qui ont besoin d'hydratation sans être asséchés.";
    if (has('Nœuds fréquents'))
      return "Assouplit la fibre et facilite le démêlage pour réduire la casse lors du brossage.";
    if (density === 'Épaisse')
      return "Pénètre en profondeur dans ta fibre dense pour une hydratation durable et un toucher doux.";
    if (obj === 'Hydratation')
      return "Au cœur de ta routine hydratation, ce masque nourrit en profondeur sans alourdir.";
    return "Soin profond pour restaurer et renforcer ta fibre capillaire.";
  }

  if (p.cat === 'oil') {
    if (porosity === 'Élevée' || isHumidClimate)
      return isHumidClimate
        ? "Scelle l'hydratation et crée un bouclier contre l'humidité ambiante de ton climat."
        : "Idéale pour sceller l'hydratation et éviter que tes cheveux la perdent trop vite.";
    if (has('Pousse lente') || obj === 'Pousse' || obj === 'Chute' || obj === 'Casse_et_chute')
      return "Stimule la circulation au cuir chevelu et favorise une pousse saine dès les premières semaines.";
    if (has('Manque de brillance') || obj === 'Brillance')
      return "Apporte brillance et souplesse à ta fibre sans alourdir tes longueurs.";
    if (density === 'Faible')
      return "Légère et non graisseuse, elle nourrit sans alourdir tes cheveux fins.";
    return "Nourrit et protège ta fibre pour des cheveux souples et brillants.";
  }

  if (p.cat === 'leave') {
    if (isHumidClimate)
      return "Formule scellante qui garde tes boucles définies même par forte humidité.";
    if (porosity === 'Faible')
      return "Formulé léger pour hydrater tes cheveux sans obstruer leurs cuticules naturellement fermées.";
    if (has('Sécheresse') || porosity === 'Élevée' || isDryClimate)
      return "Hydrate tes longueurs au quotidien sans rinçage pour combattre la sécheresse persistante.";
    if (has('Frisottis'))
      return "Apprivoise les frisottis et garde tes boucles définies tout au long de la journée.";
    if (density === 'Faible')
      return "Texture aérienne idéale pour tes cheveux fins — hydrate sans peser sur la fibre.";
    if (hairType?.startsWith('4') || hairType === 'Locks')
      return "Pénètre la fibre dense pour une hydratation durable sur cheveux très texturés.";
    return "Maintient l'hydratation entre les lavages et facilite le coiffage au quotidien.";
  }

  if (p.cat === 'sham') {
    if (has('Pellicules') || has('Problèmes de cuir chevelu'))
      return "Nettoie en douceur et apaise le cuir chevelu irrité pour éliminer les démangeaisons.";
    if (has('Cheveux gras'))
      return "Élimine l'excès de sébum sans décaper ni déséquilibrer ton cuir chevelu.";
    if (hairType?.startsWith('4') || hairType === 'Locks')
      return "Nettoie sans sulfates agressifs qui fragilisent les cheveux texturés et très bouclés.";
    return "Purifie le cuir chevelu tout en préservant l'hydratation naturelle de tes cheveux.";
  }

  if (p.cat === 'cond') {
    if (has('Nœuds fréquents') || has('Casse'))
      return "Détend les nœuds et renforce la fibre après chaque lavage pour réduire la casse.";
    if (porosity === 'Élevée')
      return "Referme les cuticules ouvertes pour retenir l'humidité et apporter de la brillance.";
    return "Apporte souplesse et brillance à ta fibre après chaque shampoing.";
  }

  if (p.cat === 'style') {
    if (isHumidClimate)
      return "Tient les boucles définies même sous l'humidité de ton climat tropical.";
    if (has('Frisottis') || obj === 'Définition')
      return "Définit tes boucles et élimine les frisottis pour un résultat net qui dure toute la journée.";
    if (density === 'Faible')
      return "Apporte de la définition et du volume sans alourdir les cheveux fins.";
    return "Coiffe et protège tes boucles tout en conservant un toucher naturel et léger.";
  }

  if (p.cat === 'compl') {
    if (has('Pousse lente') || obj === 'Pousse' || obj === 'Casse_et_chute')
      return "Apporte les nutriments essentiels à l'intérieur pour une pousse accélérée et des cheveux plus forts.";
    return "Renforce ta fibre de l'intérieur pour des cheveux plus denses et moins cassants.";
  }

  return "Sélectionné pour correspondre à ton profil capillaire personnalisé.";
}

function scoreProduct(p: Product, tags: string[], profileOnboardingIds?: Set<string>): number {
  let score = 0;
  const blob = `${p.name} ${p.brand} ${p.cat}`.toLowerCase();
  for (const tag of tags) {
    const cats = TAG_TO_PRODUCT_CAT[tag];
    if (cats?.includes(p.cat)) score += 3;
    if (blob.includes(tag)) score += 2;
  }
  if (profileOnboardingIds?.size && p.admin_tags?.length) {
    for (const adminTag of p.admin_tags) {
      if (profileOnboardingIds.has(adminTag)) score += 4;
    }
  }
  return score;
}

/**
 * Pénalité budget : réduit le score si le produit dépasse le seuil prix du profil.
 * Ne filtre pas complètement pour éviter les résultats vides.
 */
function budgetPenalty(p: Product, budgetId: string): number {
  const max  = BUDGET_MAX_PRICE[budgetId] ?? Infinity;
  const price = parsePriceEur(p.price);
  if (price === 0 || price <= max) return 0;
  if (price <= max * 1.5) return -1; // légèrement au-dessus → pénalité douce
  return -3;                          // bien au-dessus → pénalité forte
}

// ─── Fonctions de matching exportées ──────────────────────────────────────────

/** Produits du catalogue — triés par score + budget + filtre care_style.
 *  Si `overrideProducts` est fourni (ex: produits Supabase), ils remplacent le catalogue local. */
export function matchCatalogProducts(
  ctx: PersonalizationContext,
  limit = 4,
  overrideProducts?: Product[],
): ScoredProduct[] {
  const { tags, snapshot } = ctx;
  const { careStyle, budget } = snapshot;

  // care_style = diy → ne pas suggérer de produits commerce
  if (careStyle === 'diy') return [];

  const usingSupabase = overrideProducts != null && overrideProducts.length > 0;
  const catalog = usingSupabase ? overrideProducts : PRODUCTS;
  const budgetId = resolveBudgetId(budget);
  const profileConcernIds = new Set(resolveProfileOnboardingIds(ctx));

  if (tags.length === 0) {
    return catalog.slice(0, limit).map((p, i) => ({
      ...p,
      matchScore: 1 - i * 0.1,
      matchReason: 'Sélection catalogue',
    }));
  }

  const scored = catalog
    .map(p => ({
      ...p,
      matchScore: scoreProduct(p, tags, profileConcernIds) + budgetPenalty(p, budgetId),
      matchReason: productMatchReason(p, ctx),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  // Avec le catalogue local on filtre à score > 0 ; avec Supabase on affiche
  // toujours les N meilleurs pour ne jamais cacher un produit admin.
  const filtered = usingSupabase ? scored : scored.filter(x => x.matchScore > 0);
  return filtered.slice(0, limit);
}

/** Recettes du catalogue — filtrées par hair_type + tags + care_style. */
export function matchCatalogRecipes(
  ctx: PersonalizationContext,
  limit = 4,
): CatalogRecipe[] {
  const { snapshot } = ctx;
  const hairType = snapshot.hairType || '4C';

  // care_style = shop → ne pas suggérer de recettes DIY
  if (snapshot.careStyle === 'shop') return [];

  // Density : favoriser les recettes riches (masques profonds) pour cheveux épais
  const tagsForRecipes = [...ctx.tags];
  if (snapshot.density === 'Épaisse') tagsForRecipes.push('masque', 'huile');
  if (snapshot.density === 'Faible')  tagsForRecipes.push('spray', 'légèreté');

  const profileConcernIds = new Set(resolveProfileOnboardingIds(ctx));

  const fromTags = matchRecipesFromTags(tagsForRecipes, limit * 2);
  const byType   = CATALOG_RECIPES.filter(r =>
    r.hair_types.some(t =>
      hairType.startsWith(t.replace(/[ABCD]$/, '')) || r.hair_types.includes(hairType),
    ),
  );

  const merged = new Map<string, CatalogRecipe>();
  for (const r of fromTags) merged.set(r.id, r);
  for (const r of byType) if (!merged.has(r.id)) merged.set(r.id, r);

  function recipeScore(r: CatalogRecipe): number {
    if (!profileConcernIds.size || !r.admin_tags?.length) return 0;
    return r.admin_tags.filter(ct => profileConcernIds.has(ct)).length;
  }

  return [...merged.values()]
    .sort((a, b) => recipeScore(b) - recipeScore(a))
    .slice(0, limit);
}

/** Articles — pinning porosité + scoring tags. */
function scoreArticle(a: CatalogArticle, tags: string[]): number {
  const blob = `${a.title} ${a.subtitle} ${a.category}`.toLowerCase();
  let score  = a.featured ? 1 : 0;
  for (const tag of tags) {
    if (blob.includes(tag)) score += 2;
  }
  return score;
}

export function matchCatalogArticles(
  ctx: PersonalizationContext,
  limit = 3,
): CatalogArticle[] {
  const porosity = ctx.snapshot.porosity;
  const pinned =
    porosity === 'Élevée'
      ? CATALOG_ARTICLES.find(a => a.id === 'cat-featured-porosity')
      : CATALOG_ARTICLES.find(a => a.id === 'cat-lco-loc');

  const scored = CATALOG_ARTICLES.map(a => ({ a, score: scoreArticle(a, ctx.tags) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const out: CatalogArticle[] = [];
  if (pinned) out.push(pinned);
  for (const { a } of scored) {
    if (out.length >= limit) break;
    if (!out.some(x => x.id === a.id)) out.push(a);
  }
  return out.slice(0, limit);
}

// ─── Recommandations salon / professionnel ────────────────────────────────────

/**
 * Retourne les types de professionnels recommandés selon les blockers du profil.
 * Si aucun blocker → retourne un conseil générique basé sur l'objectif.
 */
export function matchProRecommendations(
  ctx: PersonalizationContext,
): ProRecommendation[] {
  const blockers = ctx.snapshot.blockers ?? [];
  const obj      = normalizeObjectiveId(ctx.snapshot.objective);

  const recs: ProRecommendation[] = [];
  const seen = new Set<string>();

  for (const b of blockers) {
    const pro = BLOCKER_TO_PRO_NEED[b];
    if (pro && !seen.has(pro.label)) {
      recs.push(pro);
      seen.add(pro.label);
    }
  }

  // Fallback sur l'objectif si aucun blocker mappé
  if (recs.length === 0) {
    if (obj === 'Pousse' || obj === 'Casse_et_chute' || obj === 'Cuir_chevelu') {
      recs.push({
        label:  'Trichologue / coiffeur spécialisé',
        reason: 'Un expert peut établir un bilan cuir chevelu et un protocole de pousse personnalisé.',
      });
    } else if (obj === 'Transition') {
      recs.push({
        label:  'Coach transition naturelle',
        reason: 'Une coach capillaire spécialisée en transition t\'accompagnera étape par étape.',
      });
    } else {
      recs.push({
        label:  'Conseiller capillaire',
        reason: 'Un conseiller peut valider ta routine et t\'orienter vers les bons produits.',
      });
    }
  }

  return recs;
}

// ─── Ton du coach selon hair_confidence ───────────────────────────────────────

export type CoachTone = 'encouraging' | 'reassuring' | 'guiding';

/**
 * Détermine le ton du coach IA selon la confiance capillaire déclarée.
 * - getting_there → encourageant (tu avances bien)
 * - frustrated     → rassurant (tu n'es pas seule)
 * - overwhelmed    → guidant (étape par étape)
 */
export function resolveCoachTone(hairConfidence: string | undefined): CoachTone {
  switch (hairConfidence) {
    case 'frustrated':   return 'reassuring';
    case 'overwhelmed':  return 'guiding';
    case 'getting_there':
    default:             return 'encouraging';
  }
}

export const COACH_TONE_HINTS: Record<CoachTone, string> = {
  encouraging: 'Tu avances bien — continue sur cette lancée.',
  reassuring:  'Tu n\'es pas seule, beaucoup vivent la même chose. On y va ensemble.',
  guiding:     'Pas de pression. On commence par une seule chose à la fois.',
};

// ─── Complexité de routine selon routine_consistency ─────────────────────────

export type RoutineComplexity = 'simple' | 'standard' | 'advanced';

/**
 * Détermine la complexité de routine à recommander.
 * - none / variable  → simple (2-3 étapes max)
 * - somewhat          → standard (routine complète mais flexible)
 * - very_consistent  → advanced (protocoles approfondis)
 */
export function resolveRoutineComplexity(
  routineConsistency: string | undefined,
): RoutineComplexity {
  switch (routineConsistency) {
    case 'very_consistent': return 'advanced';
    case 'somewhat':        return 'standard';
    case 'variable':
    case 'none':
    default:                return 'simple';
  }
}

export const ROUTINE_COMPLEXITY_HINTS: Record<RoutineComplexity, string> = {
  simple:   'Routine express : 2-3 étapes essentielles, moins de 15 min.',
  standard: 'Routine complète avec wash day, démêlage et hydratation.',
  advanced: 'Protocole approfondi : pré-poo, masques protéinés, LCO/LOC.',
};

// ─── Validation catalogue ─────────────────────────────────────────────────────

export function routineProductLabelsAreCatalogBacked(labels: string[]): boolean {
  const catalogNames = new Set<string>();
  for (const p of PRODUCTS) {
    catalogNames.add(p.name.toLowerCase());
    catalogNames.add(`${p.brand} ${p.name}`.toLowerCase());
  }
  for (const rt of Object.values(ROUTINE_TYPES)) {
    for (const step of rt.steps) {
      for (const pl of step.products) catalogNames.add(pl.toLowerCase());
    }
  }
  return labels.every(l => {
    const t = l.trim().toLowerCase();
    if (!t) return true;
    return [...catalogNames].some(c => c.includes(t) || t.includes(c));
  });
}

export const PERSONALIZATION_RECO_DISCLAIMER =
  'Sélection issue du catalogue Coton Noir, basée sur ton profil capillaire (objectifs et problématiques).';
