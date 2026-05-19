/**
 * Catalogue éditorial Articles — contenu vitrine (maquette produit).
 * Sera remplacé / complété par Supabase quand l’admin CRUD sera en place.
 */

export type ArticleCategory = 'Science' | 'Soins' | 'Coiffage';

export type ArticleExpert = {
  id: string;
  initials: string;
  name: string;
  role: string;
  color: string;
};

export type CatalogArticle = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  category: ArticleCategory;
  read_time: number;
  views: number;
  likes: number;
  author_name: string;
  author_role: string;
  author_initials: string;
  author_contact: string;
  thumb_emoji: string;
  thumb_bg: string;
  featured?: boolean;
  is_sponsored?: boolean;
  sponsor_brand?: string | null;
  created_at: string;
};

export const ARTICLE_CATEGORIES: {
  id: 'Tout' | ArticleCategory;
  label: string;
  emoji: string;
  count: number;
}[] = [
  { id: 'Tout', label: 'Tout', emoji: '', count: 84 },
  { id: 'Science', label: 'Science', emoji: '🔬', count: 22 },
  { id: 'Soins', label: 'Soins', emoji: '💧', count: 28 },
  { id: 'Coiffage', label: 'Coiffage', emoji: '✂️', count: 18 },
];

export const ARTICLE_EXPERTS: ArticleExpert[] = [
  { id: 'sow', initials: 'AS', name: 'Dr. Sow', role: 'Trichologue', color: '#D4748C' },
  { id: 'bertrand', initials: 'LB', name: 'Dr. Bertrand', role: 'Dermato', color: '#79B7A1' },
  { id: 'diallo', initials: 'MD', name: 'Mariama', role: 'Coiffeuse', color: '#F49423' },
  { id: 'tazi', initials: 'NT', name: 'Naïma', role: 'Aromath.', color: '#9B4D6A' },
];

const BODY_POROSITY =
  "La porosité décrit la capacité de ta fibre à absorber et retenir l’humidité. Comprendre ce paramètre change tout : choix des huiles, ordre LCO/LOC, fréquence des masques.\n\n" +
  "**Le test du verre d’eau.** Dépose une mèche propre dans un verre d’eau tiède. Si elle coule → porosité haute ; si elle flotte longtemps → basse ; entre les deux → moyenne.\n\n" +
  "**Indices visuels.** Cheveux qui sèchent très vite, frisottis en permanence : souvent haute porosité. Cheveux qui mettent des heures à sécher, produits qui « glissent » : plutôt basse.\n\n" +
  "**Routine adaptée.** Haute porosité : protéines légères + leave-in épais + huile scellante. Basse : hydratation en couches fines, éviter les protéines trop fréquentes.\n\n" +
  "Prends une photo avant/après chaque changement de routine pendant 3 semaines — c’est la seule preuve qui compte.";

export const CATALOG_ARTICLES: CatalogArticle[] = [
  {
    id: 'cat-featured-porosity',
    featured: true,
    title: 'Comprendre la porosité — guide complet par une trichologue',
    subtitle:
      'Test du verre d’eau, indices visuels, routines adaptées. La méthode scientifique pour identifier ta porosité en 5 minutes.',
    body: BODY_POROSITY,
    category: 'Science',
    read_time: 8,
    views: 2100,
    likes: 412,
    author_name: 'Dr. Amélie Sow',
    author_role: 'Trichologue · 12 ans d’exp.',
    author_initials: 'AS',
    author_contact: 'amelie.sow@cotonnoir.app',
    thumb_emoji: '🔬',
    thumb_bg: '#4A306D',
    created_at: '2026-05-10T10:00:00.000Z',
  },
  {
    id: 'cat-lco-loc',
    title: 'Méthode LCO vs LOC : quelle séquence pour ton type ?',
    subtitle: 'Liquide, crème, huile — l’ordre change tout sur cheveux 3C à 4C.',
    body:
      "LCO et LOC ne sont pas des modes : ce sont des stratégies d’hydratation selon ta porosité.\n\n" +
      "**LOC (Liquide → Huile → Crème)** convient souvent aux porosités basses : l’huile scelle avant la crème.\n\n" +
      "**LCO (Liquide → Crème → Huile)** fonctionne mieux sur porosité haute : la crème entre en premier, l’huile scelle en dernier.\n\n" +
      "Teste chaque méthode pendant 2 wash days et note la rétention d’hydratation à J+2.",
    category: 'Soins',
    read_time: 6,
    views: 1840,
    likes: 256,
    author_name: 'Mariama Diallo',
    author_role: 'Coiffeuse experte 4A-4C',
    author_initials: 'MD',
    author_contact: '@mariama.coiffure',
    thumb_emoji: '💧',
    thumb_bg: '#FDE8C8',
    created_at: '2026-05-09T14:00:00.000Z',
  },
  {
    id: 'cat-trim-science',
    title: '« Ne pas trimer = casse garantie » — les preuves scientifiques',
    subtitle: 'Ce que disent vraiment les études sur les pointes fourchues et la casse.',
    body:
      "Sans coupe régulière, les pointes s’abîment et la casse remonte visuellement sur la longueur.\n\n" +
      "Les trichologues recommandent un micro-trim toutes les 10 à 12 semaines pour les textures sèches, même en mode protecteur.\n\n" +
      "Un bon trim ne ralentit pas la pousse : il préserve la longueur utile.",
    category: 'Science',
    read_time: 5,
    views: 1620,
    likes: 198,
    author_name: 'Dr. Léa Bertrand',
    author_role: 'Dermatologue cuir chevelu',
    author_initials: 'LB',
    author_contact: 'lea.bertrand@cotonnoir.app',
    thumb_emoji: '✂️',
    thumb_bg: '#FCE4EC',
    created_at: '2026-05-08T09:00:00.000Z',
  },
  {
    id: 'cat-scalp-sensitive',
    title: 'Cuir chevelu sensible : 7 ingrédients à éviter absolument',
    subtitle: 'Sulfates agressifs, alcool dénaturé, parfums synthétiques…',
    body:
      "Un cuir chevelu qui tiraille ou démange n’est pas « normal » sur cheveux texturés.\n\n" +
      "Évite les sulfates forts en shampoing quotidien, les silicones non solubles en excès, et les huiles essentielles non diluées.\n\n" +
      "Privilégie des nettoyants doux et des masques cuir chevelu 1×/semaine.",
    category: 'Soins',
    read_time: 4,
    views: 1430,
    likes: 167,
    author_name: 'Naïma Tazi',
    author_role: 'Aromathérapeute certifiée',
    author_initials: 'NT',
    author_contact: '@naima.aroma',
    thumb_emoji: '🌿',
    thumb_bg: '#E2EDD8',
    created_at: '2026-05-07T16:00:00.000Z',
  },
  {
    id: 'cat-twist-out',
    title: 'Twist-out parfait sur cheveux fins : la technique pro',
    subtitle: 'Sections fines, tension modérée, séchage sans frisottis.',
    body:
      "Sur cheveux fins, le twist-out réussit avec des sections plus petites et un leave-in léger.\n\n" +
      "Twiste sur cheveux humides à 80 % sec, laisse sécher complètement avant de défaire.\n\n" +
      "Sépare les twists avec un peu d’huile sur les doigts pour éviter le coton.",
    category: 'Coiffage',
    read_time: 7,
    views: 1280,
    likes: 221,
    author_name: 'Esther Coulibaly',
    author_role: 'Hairstylist — Paris',
    author_initials: 'EC',
    author_contact: '@esther.hair',
    thumb_emoji: '💇🏾‍♀️',
    thumb_bg: '#FCE4EC',
    created_at: '2026-05-06T11:00:00.000Z',
  },
  {
    id: 'cat-growth-medical',
    title: 'Pourquoi mes cheveux ne poussent plus ? 5 causes médicales',
    subtitle: 'Carences, stress, thyroïde, traction, choc post-partum.',
    body:
      "La pousse peut ralentir pour des raisons internes, pas seulement à cause des produits.\n\n" +
      "Consulte si tu observes des plaques dégarnies, une chute brutale ou des cycles irréguliers.\n\n" +
      "Un bilan (ferritine, vitamine D, thyroïde) éclaire souvent la situation en une prise de sang.",
    category: 'Science',
    read_time: 9,
    views: 2450,
    likes: 389,
    author_name: 'Dr. Amélie Sow',
    author_role: 'Trichologue',
    author_initials: 'AS',
    author_contact: 'amelie.sow@cotonnoir.app',
    thumb_emoji: '📉',
    thumb_bg: '#FDE8C8',
    created_at: '2026-05-05T08:00:00.000Z',
  },
];

export function formatArticleViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

export const CATEGORY_STYLES: Record<
  ArticleCategory,
  { bg: string; text: string }
> = {
  Science: { bg: '#FCE4EC', text: '#9B4D6A' },
  Soins: { bg: '#E2EDD8', text: '#3A6B2A' },
  Coiffage: { bg: '#FDE8C8', text: '#7A4E0A' },
};
