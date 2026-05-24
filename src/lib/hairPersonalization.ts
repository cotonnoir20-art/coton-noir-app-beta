/**
 * Personnalisation déterministe : profil capillaire + catalogue réel.
 * Les tags IA (analyse photo) ne servent qu’à affiner le tri — jamais à inventer du contenu.
 */
import type { HairProfile } from '../context/AppContext';
import { normalizeObjectiveId } from '../constants/hairObjectives';
import { normalizeProblematicLabels } from '../constants/hairProblematics';
import { resolvePorosity } from '../constants/hairProfileOptions';
import { CATALOG_ARTICLES, type CatalogArticle } from '../data/articlesCatalog';
import { PRODUCTS, type Product } from '../data/products';
import { CATALOG_RECIPES, type CatalogRecipe } from '../data/recipesCatalog';
import type { CareStyleId } from '../constants/careStyles';
import { ROUTINE_TYPES } from '../data/routines';
import { matchRecipesFromTags } from './matchRecipesFromTags';

/** Tags autorisés renvoyés par l’analyse IA (allowlist = edge function). */
export const ALLOWED_ANALYSIS_TAGS = new Set([
  'hydratation',
  'sécheresse',
  'casse',
  'protéines',
  'scellage',
  'frisottis',
  'brillance',
  'pousse',
  'scalp',
  'anti-buildup',
  'leave-in',
  'masque',
  'huile',
]);

const OBJECTIVE_KEYWORDS: Record<string, string[]> = {
  Hydratation: ['hydratation', 'hydrat', 'masque', 'leave-in', 'sécheresse'],
  Pousse: ['pousse', 'scalp', 'huile', 'compl'],
  Casse_et_chute: ['casse', 'pousse', 'scalp', 'compl', 'huile', 'masque', 'protéines'],
  Fibre: ['casse', 'protéines', 'masque', 'réparation'],
  Brillance: ['brillance', 'huile', 'style', 'leave-in'],
  Densite: ['leave-in', 'masque', 'coiffage', 'volume'],
  Cuir_chevelu: ['scalp', 'cuir chevelu', 'huile', 'sham'],
  Définition: ['définition', 'frisottis', 'coiffage', 'leave-in'],
  Dommages: ['protéines', 'masque', 'hydratation', 'réparation', 'pointes', 'huile'],
  Transition: ['hydratation', 'masque', 'routine', 'scalp', 'protéines'],
  Chute: ['pousse', 'scalp', 'compl', 'huile', 'masque'],
  Casse: ['casse', 'protéines', 'masque'],
  Epaisseur: ['leave-in', 'masque', 'coiffage', 'volume'],
  Pointes: ['pointes', 'huile', 'sérum'],
  Couleur: ['couleur', 'hydratation', 'masque'],
  Tout: ['hydratation', 'routine', 'équilibre'],
};

/** Blocages onboarding (ids) → tags catalogue. */
const BLOCKER_TO_TAGS: Record<string, string[]> = {
  consistency: ['hydratation', 'routine'],
  dont_know: ['hydratation', 'masque'],
  too_many_products: ['anti-buildup', 'shampoing'],
  no_structure: ['hydratation', 'leave-in'],
  stylist: ['scalp', 'pousse'],
  budget: ['hydratation', 'masque'],
};

const PROBLEMATIC_TO_TAGS: Record<string, string[]> = {
  Sécheresse: ['sécheresse', 'hydratation', 'masque', 'huile'],
  Casse: ['casse', 'protéines', 'masque'],
  Pellicules: ['scalp', 'cuir chevelu'],
  Frisottis: ['frisottis', 'leave-in', 'coiffage'],
  'Cheveux fins': ['leave-in', 'coiffage'],
  'Cheveux gras': ['anti-buildup', 'shampoing'],
  'Manque de brillance': ['brillance', 'huile'],
  'Nœuds fréquents': ['masque', 'huile', 'hydratation'],
  'Pousse lente': ['pousse', 'scalp', 'huile'],
  'Produits inadaptés': ['hydratation', 'masque', 'leave-in'],
  'Routine incohérente': ['hydratation', 'routine', 'leave-in'],
  'Dommages chaleur': ['protéines', 'masque', 'hydratation', 'chaleur'],
  'Dommages chimiques': ['couleur', 'protéines', 'masque', 'hydratation', 'réparation'],
  'Problèmes de cuir chevelu': ['scalp', 'cuir chevelu', 'huile'],
};

const TAG_TO_PRODUCT_CAT: Record<string, Product['cat'][]> = {
  hydratation: ['mask', 'leave', 'cond'],
  sécheresse: ['mask', 'oil', 'leave'],
  casse: ['mask', 'oil', 'leave'],
  protéines: ['mask', 'leave'],
  scellage: ['oil'],
  frisottis: ['style', 'oil', 'leave'],
  brillance: ['oil', 'style'],
  pousse: ['oil', 'compl'],
  scalp: ['oil', 'sham'],
  'anti-buildup': ['sham'],
  'leave-in': ['leave'],
  masque: ['mask'],
  huile: ['oil'],
};

export type PersonalizationInput = Pick<
  HairProfile,
  'hairType' | 'porosity' | 'density' | 'objective' | 'problematics' | 'careStyle'
>;

export type PersonalizationSnapshot = {
  hairType: string;
  porosity: string;
  density: string;
  objective: string;
  careStyle: CareStyleId | '';
  problematics?: string[];
  blockers?: string[];
};

export type PersonalizationContext = {
  tags: string[];
  /** Libellés profil pour affichage (« Sécheresse », « Hydratation »…) */
  profileLabels: string[];
  snapshot: PersonalizationSnapshot;
};

export type ScoredProduct = Product & { matchScore: number; matchReason: string };

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
    hairType: profile.hairType,
    porosity: profile.porosity,
    density: profile.density,
    objective: profile.objective,
    problematics: profile.problematics,
    careStyle: profile.careStyle,
  };
}

/** Tags de recherche : profil d’abord, puis tags IA validés. */
export function buildPersonalizationContext(
  profile: HairProfile | PersonalizationInput,
  analysisTags?: string[],
): PersonalizationContext {
  const input = 'careStyle' in profile && 'region' in (profile as HairProfile)
    ? inputFromProfile(profile as HairProfile)
    : (profile as PersonalizationInput);

  const extra = profile as PersonalizationInput & { blockers?: string[] };
  const snapshot: PersonalizationSnapshot = {
    hairType: input.hairType || '3C',
    porosity: resolvePorosity(input.porosity),
    density: input.density ?? 'Moyenne',
    objective: input.objective || '',
    careStyle: (input.careStyle || '') as CareStyleId,
    problematics: input.problematics,
    blockers: extra.blockers,
  };

  const tags: string[] = [];
  const profileLabels: string[] = [];

  const objective = normalizeObjectiveId(input.objective);
  if (objective && OBJECTIVE_KEYWORDS[objective]) {
    profileLabels.push(objective);
    tags.push(...OBJECTIVE_KEYWORDS[objective]);
  }

  for (const label of normalizeProblematicLabels(input.problematics)) {
    profileLabels.push(label);
    const mapped = PROBLEMATIC_TO_TAGS[label];
    if (mapped) tags.push(...mapped);
    else tags.push(label.toLowerCase());
  }

  for (const blockerId of snapshot.blockers ?? []) {
    const mapped = BLOCKER_TO_TAGS[blockerId];
    if (mapped) tags.push(...mapped);
  }

  const porosity = resolvePorosity(input.porosity);
  if (porosity === 'Élevée') tags.push('hydratation', 'scellage', 'huile');
  if (porosity === 'Faible') tags.push('anti-buildup', 'leave-in');
  if (input.hairType) tags.push(input.hairType.toLowerCase());

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

function productMatchReason(_p: Product, ctx: PersonalizationContext): string {
  if (ctx.profileLabels.length > 0) {
    return `Selon ton profil : ${ctx.profileLabels.slice(0, 2).join(', ')}`;
  }
  return 'Sélection catalogue Coton Noir';
}

function scoreProduct(p: Product, tags: string[]): number {
  let score = 0;
  const blob = `${p.name} ${p.brand} ${p.cat}`.toLowerCase();
  for (const tag of tags) {
    const cats = TAG_TO_PRODUCT_CAT[tag];
    if (cats?.includes(p.cat)) score += 3;
    if (blob.includes(tag)) score += 2;
  }
  return score;
}

/** Produits du catalogue local — jamais inventés. */
export function matchCatalogProducts(
  ctx: PersonalizationContext,
  limit = 4,
): ScoredProduct[] {
  const { tags } = ctx;
  if (tags.length === 0) {
    return PRODUCTS.slice(0, limit).map((p, i) => ({
      ...p,
      matchScore: 1 - i * 0.1,
      matchReason: 'Sélection catalogue',
    }));
  }

  return PRODUCTS.map(p => ({
    ...p,
    matchScore: scoreProduct(p, tags),
    matchReason: productMatchReason(p, ctx),
  }))
    .filter(x => x.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

export function matchCatalogRecipes(
  ctx: PersonalizationContext,
  limit = 4,
): CatalogRecipe[] {
  const hairType = ctx.snapshot.hairType || '4C';
  const fromTags = matchRecipesFromTags(ctx.tags, limit * 2);
  const byType = CATALOG_RECIPES.filter(r =>
    r.hair_types.some(t => hairType.startsWith(t.replace(/[ABCD]$/, '')) || r.hair_types.includes(hairType)),
  );
  const merged = new Map<string, CatalogRecipe>();
  for (const r of fromTags) merged.set(r.id, r);
  for (const r of byType) if (!merged.has(r.id)) merged.set(r.id, r);
  return [...merged.values()].slice(0, limit);
}

function scoreArticle(a: CatalogArticle, tags: string[]): number {
  const blob = `${a.title} ${a.subtitle} ${a.category}`.toLowerCase();
  let score = a.featured ? 1 : 0;
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

/** Vérifie que chaque produit cité dans une routine existe dans le catalogue ou ROUTINE_TYPES. */
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
