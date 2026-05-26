import type { HairProfile } from '../context/AppContext';
import { ARTICLE_EXPERTS, CATALOG_ARTICLES, type CatalogArticle } from '../data/articlesCatalog';
import { PRODUCTS, type Product } from '../data/products';
import { CATALOG_RECIPES, type CatalogRecipe } from '../data/recipesCatalog';
import { displayObjective, normalizeObjectiveId } from '../constants/hairObjectives';
import { normalizeProblematicLabels } from '../constants/hairProblematics';
import { resolvePorosity } from '../constants/hairProfileOptions';
import {
  buildPersonalizationContext,
  matchCatalogArticles,
  matchCatalogProducts,
  matchCatalogRecipes,
  matchProRecommendations,
} from './hairPersonalization';
import type { RecoProduct } from './onboardingRecommendations';

export type ForYouItemType =
  | 'product'
  | 'recipe'
  | 'article'
  | 'salon'
  | 'pro'
  | 'expert';

export type ForYouFilter = ForYouItemType;

export type ForYouItem = {
  id: string;
  type: ForYouItemType;
  title: string;
  /** Marque, auteur ou lieu */
  subtitle: string;
  /** Accroche courte sous le titre */
  description: string;
  /** Libellé pill (ex. Leave-In, Masque) */
  categoryLabel: string;
  /** Badge optionnel au-dessus des pills (ex. Pour toi) */
  highlightBadge?: string;
  thumbEmoji: string;
  thumbBg: string;
  score: number;
  route: { pathname: string; params?: Record<string, string> };
};

export type ForYouDiscoverFeed = {
  profileSummary: string;
  objectiveLabel: string;
  problematics: string[];
  items: ForYouItem[];
  hasPersonalization: boolean;
};

type CuratedPlace = {
  id: string;
  type: 'salon' | 'pro' | 'expert';
  title: string;
  subtitle: string;
  thumbEmoji: string;
  thumbBg: string;
  tags: string[];
  route: { pathname: string; params?: Record<string, string> };
};

const CURATED_PLACES: CuratedPlace[] = [
  {
    id: 'place-salon-nappy',
    type: 'salon',
    title: 'Nappy Paris',
    subtitle: 'Salon · Coiffure 4A-4C · Paris',
    thumbEmoji: '✂️',
    thumbBg: '#3a2010',
    tags: ['définition', 'coiffage', '4c', 'boucle', 'paris'],
    route: { pathname: '/partners' },
  },
  {
    id: 'place-salon-lyon',
    type: 'salon',
    title: 'Curls & Co Lyon',
    subtitle: 'Salon · Wash day & soins profonds',
    thumbEmoji: '💇🏾‍♀️',
    thumbBg: '#2a1810',
    tags: ['hydrat', 'masque', 'sécher', 'wash'],
    route: { pathname: '/partners' },
  },
  {
    id: 'place-pro-color',
    type: 'pro',
    title: 'Studio Color Textures',
    subtitle: 'Pro · Coloriste cheveux texturés',
    thumbEmoji: '✨',
    thumbBg: '#1a2a2a',
    tags: ['couleur', 'coloration', 'réparation', 'dommages'],
    route: { pathname: '/partners' },
  },
  {
    id: 'place-pro-trim',
    type: 'pro',
    title: 'Micro-trim & soins pointes',
    subtitle: 'Pro · Coupe & entretien longueurs',
    thumbEmoji: '✂️',
    thumbBg: '#FCE4EC',
    tags: ['pointe', 'casse', 'fourchue', 'trim'],
    route: { pathname: '/partners' },
  },
  {
    id: 'place-expert-sow',
    type: 'expert',
    title: 'Dr. Amélie Sow',
    subtitle: 'Trichologue · Porosité & cuir chevelu',
    thumbEmoji: '🔬',
    thumbBg: '#4A306D',
    tags: ['porosité', 'scalp', 'pellicule', 'science', 'hydrat'],
    route: { pathname: '/articles', params: { openId: 'cat-featured-porosity' } },
  },
  {
    id: 'place-expert-bertrand',
    type: 'expert',
    title: 'Dr. Léa Bertrand',
    subtitle: 'Dermatologue · Cuir chevelu sensible',
    thumbEmoji: '🩺',
    thumbBg: '#79B7A1',
    tags: ['cuir', 'scalp', 'pellicule', 'sensible', 'sécher'],
    route: { pathname: '/articles', params: { openId: 'cat-scalp-sensitive' } },
  },
  {
    id: 'place-expert-diallo',
    type: 'expert',
    title: 'Mariama Diallo',
    subtitle: 'Coiffeuse experte · LCO & définition 4C',
    thumbEmoji: '💧',
    thumbBg: '#FDE8C8',
    tags: ['définition', 'lco', '4c', 'coiffage', 'frisottis'],
    route: { pathname: '/articles', params: { openId: 'cat-lco-loc' } },
  },
];

const EXPERT_ARTICLE_BY_INITIALS: Record<string, string> = {
  AS: 'cat-featured-porosity',
  LB: 'cat-scalp-sensitive',
  MD: 'cat-lco-loc',
  NT: 'cat-scalp-sensitive',
};

function blobScore(blob: string, tags: string[]): number {
  const lower = blob.toLowerCase();
  let score = 0;
  for (const tag of tags) {
    if (lower.includes(tag)) score += 2;
  }
  return score;
}

const PRODUCT_CAT_LABEL: Record<Product['cat'], string> = {
  sham: 'Shampoing',
  cond: 'Après-shampoing',
  leave: 'Leave-In',
  mask: 'Masque',
  oil: 'Huile',
  style: 'Coiffage',
  compl: 'Complément',
};

function productToItem(
  p: RecoProduct,
  catalog: Product | undefined,
  score: number,
  reason: string,
): ForYouItem {
  const cat = catalog?.cat ?? 'leave';
  return {
    id: `product-${p.brand}-${p.name}`,
    type: 'product',
    title: p.name,
    subtitle: p.brand,
    description: `${reason} · ${p.price}`,
    categoryLabel: PRODUCT_CAT_LABEL[cat],
    highlightBadge: '✦ Pour toi',
    thumbEmoji: p.emoji || '🧴',
    thumbBg: catalog?.bg ?? '#FDE8C8',
    score,
    route: {
      pathname: '/product',
      params: {
        brand: p.brand,
        name: p.name,
        emoji: p.emoji || '🧴',
        price: p.price,
        rating: '4.6',
        count: '120',
        bg: '#FDE8C8',
        accent: '#F49423',
      },
    },
  };
}

function recipeToItem(r: CatalogRecipe, score: number): ForYouItem {
  return {
    id: `recipe-${r.id}`,
    type: 'recipe',
    title: r.name,
    subtitle: `Recette maison · ${r.duration} min`,
    description: r.description,
    categoryLabel: r.category,
    highlightBadge: r.featured ? '✦ Coup de cœur' : '✦ Pour toi',
    thumbEmoji: r.thumb_emoji,
    thumbBg: r.thumb_bg,
    score,
    route: { pathname: '/recipes', params: { openId: r.id, openName: r.name } },
  };
}

function articleToItem(a: CatalogArticle, score: number): ForYouItem {
  return {
    id: `article-${a.id}`,
    type: 'article',
    title: a.title,
    subtitle: a.author_name,
    description: a.subtitle,
    categoryLabel: a.category,
    highlightBadge: a.featured ? '✦ À lire' : undefined,
    thumbEmoji: a.thumb_emoji,
    thumbBg: a.thumb_bg,
    score,
    route: { pathname: '/articles', params: { openId: a.id, openTitle: a.title } },
  };
}

function placeToItem(p: CuratedPlace, score: number): ForYouItem {
  const typeLabel =
    p.type === 'salon' ? 'Salon' : p.type === 'pro' ? 'Service pro' : 'Expert';
  return {
    id: p.id,
    type: p.type,
    title: p.title,
    subtitle: p.subtitle.split('·')[0]?.trim() ?? p.subtitle,
    description: p.subtitle,
    categoryLabel: typeLabel,
    highlightBadge: '✦ Recommandé',
    thumbEmoji: p.thumbEmoji,
    thumbBg: p.thumbBg,
    score,
    route: p.route,
  };
}

function expertCatalogItems(tags: string[]): ForYouItem[] {
  return ARTICLE_EXPERTS.map(ex => {
    const articleId = EXPERT_ARTICLE_BY_INITIALS[ex.initials] ?? 'cat-featured-porosity';
    const article = CATALOG_ARTICLES.find(a => a.id === articleId);
    const blob = `${ex.name} ${ex.role} ${article?.title ?? ''}`;
    const score = blobScore(blob, tags) + 1;
    return {
      id: `expert-${ex.id}`,
      type: 'expert' as const,
      title: ex.name,
      subtitle: ex.role,
      description: article?.subtitle ?? 'Conseils personnalisés pour cheveux texturés.',
      categoryLabel: 'Expert',
      highlightBadge: '✦ Pour toi',
      thumbEmoji: '👩🏾‍⚕️',
      thumbBg: ex.color,
      score,
      route: {
        pathname: '/articles',
        params: { openId: articleId, openTitle: article?.title ?? ex.name },
      },
    };
  });
}

const TYPE_LIMITS: Record<ForYouItemType, number> = {
  product: 6,
  recipe: 5,
  article: 5,
  salon: 3,
  pro: 3,
  expert: 3,
};

export function buildForYouDiscoverFeed(profile: HairProfile, overrideProducts?: Product[]): ForYouDiscoverFeed {
  const ctx = buildPersonalizationContext(profile);
  const tags = ctx.tags;
  const hasPersonalization = Boolean(
    normalizeObjectiveId(profile.objective) || (profile.problematics?.length ?? 0) > 0,
  );

  const productItems: ForYouItem[] = matchCatalogProducts(ctx, 8, overrideProducts).map(p =>
    productToItem(
      { brand: p.brand, name: p.name, price: p.price, emoji: p.emoji, cat: p.cat, desc: p.desc, ingredients: p.ingredients, matchReason: p.matchReason },
      p,
      p.matchScore,
      p.matchReason,
    ),
  );

  const recipeItems = matchCatalogRecipes(ctx, 8).map(r =>
    recipeToItem(r, blobScore(`${r.name} ${r.description}`, tags) + (r.featured ? 1 : 0)),
  );

  const articleItems = matchCatalogArticles(ctx, 6).map((a, i) =>
    articleToItem(a, 6 - i),
  );

  const proRecos = matchProRecommendations(ctx).map((reco, i): ForYouItem => ({
    id: `pro-reco-${i}`,
    type: 'pro',
    title: reco.label,
    subtitle: 'Recommandé selon ton profil',
    description: reco.reason,
    categoryLabel: 'Service pro',
    highlightBadge: '✦ Pour toi',
    thumbEmoji: '💆🏾‍♀️',
    thumbBg: '#4A306D',
    score: 10,
    route: { pathname: '/partners' },
  }));

  const placeItems = [
    ...proRecos,
    ...CURATED_PLACES.map(p => ({
      p,
      score: blobScore(`${p.title} ${p.subtitle} ${p.tags.join(' ')}`, tags),
    }))
      .filter(x => x.score > 0 || !hasPersonalization)
      .sort((a, b) => b.score - a.score)
      .map(({ p, score }) => placeToItem(p, score + (hasPersonalization ? 0 : 1))),
  ];

  const expertItems = expertCatalogItems(tags);

  const merged = new Map<string, ForYouItem>();
  const add = (item: ForYouItem) => {
    if (!merged.has(item.id)) merged.set(item.id, item);
  };

  for (const list of [productItems, recipeItems, articleItems, placeItems, expertItems]) {
    for (const item of list) add(item);
  }

  const byType = (type: ForYouItemType) =>
    [...merged.values()]
      .filter(i => i.type === type)
      .sort((a, b) => b.score - a.score)
      .slice(0, TYPE_LIMITS[type]);

  const items: ForYouItem[] = [];
  const order: ForYouItemType[] = ['product', 'recipe', 'article', 'salon', 'pro', 'expert'];
  for (const type of order) {
    items.push(...byType(type));
  }

  const objectiveLabel = profile.objective
    ? displayObjective(profile.objective)
    : 'Complète ton profil capillaire';
  const problematics = normalizeProblematicLabels(profile.problematics);

  const profileParts = [
    profile.hairType || null,
    profile.porosity ? `porosité ${resolvePorosity(profile.porosity).toLowerCase()}` : null,
    objectiveLabel !== '—' ? objectiveLabel : null,
  ].filter(Boolean);

  return {
    profileSummary: profileParts.join(' · ') || 'Personnalise ta routine pour des suggestions sur mesure',
    objectiveLabel,
    problematics,
    items: items.sort((a, b) => b.score - a.score),
    hasPersonalization,
  };
}

export const FOR_YOU_FILTER_LABELS: { id: ForYouFilter; label: string }[] = [
  { id: 'product', label: 'Produits' },
  { id: 'recipe', label: 'Recettes' },
  { id: 'salon', label: 'Salons' },
  { id: 'pro', label: 'Pros' },
  { id: 'expert', label: 'Experts' },
  { id: 'article', label: 'Articles' },
];

export const FOR_YOU_TYPE_META: Record<
  ForYouItemType,
  { label: string; ion: 'bag-handle-outline' | 'flask-outline' | 'newspaper-outline' | 'cut-outline' | 'sparkles-outline' | 'medkit-outline' }
> = {
  product: { label: 'Produit', ion: 'bag-handle-outline' },
  recipe: { label: 'Recette', ion: 'flask-outline' },
  article: { label: 'Article', ion: 'newspaper-outline' },
  salon: { label: 'Salon', ion: 'cut-outline' },
  pro: { label: 'Pro', ion: 'sparkles-outline' },
  expert: { label: 'Expert', ion: 'medkit-outline' },
};
