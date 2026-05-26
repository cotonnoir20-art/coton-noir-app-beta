/**
 * Catalogue recettes naturelles — contenu vitrine (maquette produit).
 */

export type RecipeCategory = 'Masque' | 'Huile' | 'Spray' | 'Cuir chevelu';

export type CatalogRecipe = {
  id: string;
  name: string;
  description: string;
  category: RecipeCategory;
  difficulty: 'Facile' | 'Moyen' | 'Express';
  duration: number;
  prep_minutes: number;
  pose_minutes: number;
  rating: number;
  likes: number;
  ingredient_count: number;
  avg_cost_eur: number;
  thumb_emoji: string;
  thumb_bg: string;
  hair_types: string[];
  ingredients: string[];
  steps: string[];
  featured?: boolean;
  signature?: boolean;
  created_at: string;
  /** Tags admin (concern IDs) — alignés sur la table Supabase `recipes.admin_tags`. */
  admin_tags?: string[];
};

export const RECIPE_CATEGORIES: {
  id: 'Toutes' | RecipeCategory;
  label: string;
  emoji: string;
}[] = [
  { id: 'Toutes', label: 'Toutes', emoji: '✨' },
  { id: 'Masque', label: 'Masques', emoji: '🥛' },
  { id: 'Huile', label: 'Huiles', emoji: '🌿' },
  { id: 'Spray', label: 'Sprays', emoji: '💧' },
  { id: 'Cuir chevelu', label: 'Cuir chevelu', emoji: '🍃' },
];

export const RECIPES_HERO_STATS = {
  count: 24,
  avgCost: '3,50€',
  avgMinutes: 15,
};

export const CATEGORY_STYLES: Record<
  RecipeCategory,
  { bg: string; text: string; cardBg: string }
> = {
  Masque: { bg: '#E2EDD8', text: '#3A6B2A', cardBg: '#C8E6C0' },
  Huile: { bg: '#FDE8C8', text: '#7A4E0A', cardBg: '#FFE5B4' },
  Spray: { bg: '#FCE4EC', text: '#9B4D6A', cardBg: '#F5C2C7' },
  'Cuir chevelu': { bg: '#E2EDD8', text: '#3A6B2A', cardBg: '#D4EDDA' },
};

const STEPS_KARITE = [
  'Fais fondre 2 c. à soupe de beurre de karité au bain-marie.',
  'Écrase la moitié d’un avocat mûr et mélange avec 1 c. à soupe de miel.',
  'Incorpore le karité fondu. La texture doit être crémeuse.',
  'Applique sur cheveux humides en sections, des racines aux pointes.',
  'Couvre d’une charlotte 30 min, puis rince et shampouine doucement.',
];

export const CATALOG_RECIPES: CatalogRecipe[] = [
  {
    id: 'cat-karite-avocat',
    featured: true,
    signature: true,
    name: 'Masque Karité-Avocat profond',
    description:
      'La recette signature pour les cheveux 3C/4A asséchés. 80 % des testeuses notent une transformation dès la première pose.',
    category: 'Masque',
    difficulty: 'Facile',
    duration: 45,
    prep_minutes: 15,
    pose_minutes: 30,
    rating: 4.9,
    likes: 1200,
    ingredient_count: 4,
    avg_cost_eur: 2.5,
    thumb_emoji: '🥑',
    thumb_bg: '#79B7A1',
    hair_types: ['3C', '4A', '4B', '4C'],
    ingredients: [
      '2 c. à soupe de beurre de karité',
      '½ avocat mûr',
      '1 c. à soupe de miel',
      '1 c. à café d’huile d’olive',
    ],
    steps: STEPS_KARITE,
    created_at: '2026-05-12T10:00:00.000Z',
    admin_tags: ['dry_brittle', 'tangles', 'Hydratation'],
  },
  {
    id: 'cat-avocat-miel',
    name: 'Masque Avocat-Miel',
    description: 'Hydratation intense pour longueurs rêches.',
    category: 'Masque',
    difficulty: 'Facile',
    duration: 20,
    prep_minutes: 10,
    pose_minutes: 10,
    rating: 4.7,
    likes: 890,
    ingredient_count: 4,
    avg_cost_eur: 2.2,
    thumb_emoji: '🥑',
    thumb_bg: '#C8E6C0',
    hair_types: ['3B', '3C', '4A', '4B'],
    ingredients: ['1 avocat', '2 c. à soupe de miel', '1 c. à soupe d’huile de coco', 'Yaourt nature'],
    steps: [
      'Mixe l’avocat et le miel jusqu’à texture lisse.',
      'Ajoute l’huile de coco fondue.',
      'Applique 15 min puis rince.',
    ],
    created_at: '2026-05-11T09:00:00.000Z',
    admin_tags: ['dry_brittle', 'Hydratation'],
  },
  {
    id: 'cat-coco-ricin',
    name: 'Bain d’huile Coco+Ricin',
    description: 'Pré-poo nourrissant avant shampoing.',
    category: 'Huile',
    difficulty: 'Facile',
    duration: 45,
    prep_minutes: 5,
    pose_minutes: 40,
    rating: 4.8,
    likes: 1020,
    ingredient_count: 3,
    avg_cost_eur: 3.8,
    thumb_emoji: '🌰',
    thumb_bg: '#FFE5B4',
    hair_types: ['4A', '4B', '4C'],
    ingredients: ['Huile de coco', 'Huile de ricin', 'Miel'],
    steps: [
      'Mélange les huiles tièdes.',
      'Masse le cuir chevelu et les longueurs.',
      'Laisse poser 40 min sous charlotte.',
    ],
    created_at: '2026-05-10T14:00:00.000Z',
    admin_tags: ['breakage', 'Pousse', 'dry_brittle'],
  },
  {
    id: 'cat-hibiscus-aloe',
    name: 'Spray Hibiscus-Aloe',
    description: 'Brume hydratante quotidienne sans rinçage.',
    category: 'Spray',
    difficulty: 'Facile',
    duration: 10,
    prep_minutes: 8,
    pose_minutes: 0,
    rating: 4.6,
    likes: 640,
    ingredient_count: 5,
    avg_cost_eur: 2.0,
    thumb_emoji: '🌺',
    thumb_bg: '#F5C2C7',
    hair_types: ['3A', '3B', '3C', '4A'],
    ingredients: ['Infusion hibiscus', 'Gel d’aloe vera', 'Glycérine', 'Eau distillée', 'HE lavande'],
    steps: [
      'Infuse l’hibiscus 10 min, filtre.',
      'Mélange avec l’aloe et la glycérine.',
      'Remplis un vaporisateur, conserve au frais 5 jours.',
    ],
    created_at: '2026-05-09T11:00:00.000Z',
    admin_tags: ['dry_brittle', 'frizz', 'curl_loss', 'Hydratation'],
  },
  {
    id: 'cat-banane-yaourt',
    name: 'Masque Banane-Yaourt',
    description: 'Douceur et brillance sur cheveux ternes.',
    category: 'Masque',
    difficulty: 'Facile',
    duration: 25,
    prep_minutes: 10,
    pose_minutes: 15,
    rating: 4.5,
    likes: 520,
    ingredient_count: 4,
    avg_cost_eur: 1.8,
    thumb_emoji: '🍌',
    thumb_bg: '#FFE5B4',
    hair_types: ['3C', '4A', '4B'],
    ingredients: ['1 banane mûre', 'Yaourt nature', 'Miel', 'Huile d’amande douce'],
    steps: [
      'Écrase la banane finement (sans grumeaux).',
      'Mélange avec yaourt et miel.',
      'Pose 15 min, rince abondamment.',
    ],
    created_at: '2026-05-08T16:00:00.000Z',
    admin_tags: ['dry_brittle', 'dull', 'Brillance'],
  },
  {
    id: 'cat-romarin',
    name: 'Infusion Romarin cuir chevelu',
    description: 'Stimule la circulation et apaise les démangeaisons.',
    category: 'Cuir chevelu',
    difficulty: 'Moyen',
    duration: 30,
    prep_minutes: 15,
    pose_minutes: 15,
    rating: 4.7,
    likes: 710,
    ingredient_count: 3,
    avg_cost_eur: 1.2,
    thumb_emoji: '🍃',
    thumb_bg: '#D4EDDA',
    hair_types: ['3A', '3B', '3C', '4A', '4B', '4C'],
    ingredients: ['Romarin frais', 'Eau filtrée', 'Vinaigre de cidre (goutte)'],
    steps: [
      'Fais infuser le romarin 15 min.',
      'Laisse refroidir, ajoute une goutte de vinaigre.',
      'Applique sur cuir chevelu avec un coton.',
    ],
    created_at: '2026-05-07T10:00:00.000Z',
    admin_tags: ['dandruff', 'Cuir_chevelu', 'Pousse'],
  },
  {
    id: 'cat-pre-poo-coco',
    name: 'Pré-poo Coco-Argan',
    description: 'Barrière protectrice avant shampoing clarifiant.',
    category: 'Huile',
    difficulty: 'Facile',
    duration: 40,
    prep_minutes: 5,
    pose_minutes: 35,
    rating: 4.9,
    likes: 980,
    ingredient_count: 3,
    avg_cost_eur: 4.2,
    thumb_emoji: '🥥',
    thumb_bg: '#FFE5B4',
    hair_types: ['4A', '4B', '4C'],
    ingredients: ['Huile de coco', 'Huile d’argan', 'Beurre de karité'],
    steps: [
      'Mélange les huiles tièdes.',
      'Applique généreusement avant shampoing.',
      'Laisse poser 35 min minimum.',
    ],
    created_at: '2026-05-06T08:00:00.000Z',
    admin_tags: ['dry_brittle', 'breakage', 'Hydratation'],
  },
  {
    id: "cat-oeuf-mayo",
    name: "Masque protéiné œuf-mayo",
    description: "Reconstruction légère pour cheveux cassants.",
    category: "Masque",
    difficulty: "Moyen",
    duration: 30,
    prep_minutes: 10,
    pose_minutes: 20,
    rating: 4.4,
    likes: 430,
    ingredient_count: 4,
    avg_cost_eur: 2.0,
    thumb_emoji: "🥚",
    thumb_bg: "#FCE4EC",
    hair_types: ["3B", "3C", "4A"],
    ingredients: ["1 oeuf", "Mayonnaise", "Huile d’olive", "Miel"],
    steps: [
      "Bat l’oeuf avec une cuillere de mayo.",
      "Applique sur longueurs uniquement.",
      "Rince a l’eau tiede (pas brulante).",
    ],
    created_at: "2026-05-05T12:00:00.000Z",
    admin_tags: ["breakage", "damaged", "transition", "Fibre"],
  },
  {
    id: "cat-lavande-spray",
    name: "Spray fraicheur lavande",
    description: "Reveil de boucles entre deux wash days.",
    category: "Spray",
    difficulty: "Express",
    duration: 5,
    prep_minutes: 5,
    pose_minutes: 0,
    rating: 4.6,
    likes: 380,
    ingredient_count: 3,
    avg_cost_eur: 1.5,
    thumb_emoji: "💜",
    thumb_bg: "#F5C2C7",
    hair_types: ["2C", "3A", "3B", "3C"],
    ingredients: ["Eau", "Gel d’aloe vera", "Hydrolat lavande"],
    steps: [
      "Melange dans un spray 200 ml.",
      "Secoue avant usage sur cheveux secs ou humides.",
    ],
    created_at: "2026-05-04T15:00:00.000Z",
    admin_tags: ["frizz", "curl_loss", "Définition"],
  },
];

export function formatRecipeLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

export const DIFFICULTY_STYLES: Record<
  CatalogRecipe['difficulty'],
  { bg: string; text: string }
> = {
  Facile: { bg: '#E2EDD8', text: '#3A6B2A' },
  Moyen: { bg: '#FDE8C8', text: '#7A4E0A' },
  Express: { bg: '#FCE4EC', text: '#9B4D6A' },
};
