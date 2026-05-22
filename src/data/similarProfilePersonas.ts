/** Personas communauté (maquette) — matching local en attendant agrégat Supabase. */
export type SimilarProfilePersona = {
  id: string;
  displayName: string;
  hairType: string;
  porosity: string;
  objective: string;
  productBrand: string;
  productName: string;
  outcome: string;
};

export const SIMILAR_PROFILE_PERSONAS: SimilarProfilePersona[] = [
  {
    id: 'p1',
    displayName: 'Aminata · 3C',
    hairType: '3C',
    porosity: 'Élevée',
    objective: 'Hydratation',
    productBrand: 'Shea Moisture',
    productName: 'Masque intensif',
    outcome: 'Longueurs moins rêches après 2 wash days',
  },
  {
    id: 'p2',
    displayName: 'Léa · 4A',
    hairType: '4A',
    porosity: 'Élevée',
    objective: 'Définition',
    productBrand: 'Cantu',
    productName: 'Leave-in crémeux',
    outcome: 'Boucles plus nettes, moins de frisottis',
  },
  {
    id: 'p3',
    displayName: 'Maya · 3B',
    hairType: '3B',
    porosity: 'Moyenne',
    objective: 'Pousse',
    productBrand: 'As I Am',
    productName: 'Co-wash hydratant',
    outcome: 'Cuir chevelu apaisé, moins de casse',
  },
  {
    id: 'p4',
    displayName: 'Sarah · 4B',
    hairType: '4B',
    porosity: 'Élevée',
    objective: 'Sécheresse',
    productBrand: 'Mielle',
    productName: 'Bain d\'huile pré-poo',
    outcome: 'Hydratation qui tient 4 jours',
  },
  {
    id: 'p5',
    displayName: 'Chloé · 3C',
    hairType: '3C',
    porosity: 'Moyenne',
    objective: 'Brillance',
    productBrand: 'Camille Rose',
    productName: 'Gelée définissante',
    outcome: 'Brillance sans crunch',
  },
  {
    id: 'p6',
    displayName: 'Inès · 4A',
    hairType: '4A',
    porosity: 'Faible',
    objective: 'Volume',
    productBrand: 'Afro Love',
    productName: 'Mousse légère',
    outcome: 'Volume racines, boucles souples',
  },
  {
    id: 'p7',
    displayName: 'Zoé · 3B',
    hairType: '3B',
    porosity: 'Élevée',
    objective: 'Frisottis',
    productBrand: 'Kinky Curly',
    productName: 'Knot Today',
    outcome: 'Frisottis réduits sur longueurs',
  },
  {
    id: 'p8',
    displayName: 'Nadia · 4C',
    hairType: '4C',
    porosity: 'Élevée',
    objective: 'Casse',
    productBrand: 'TGIN',
    productName: 'Masque protéines',
    outcome: 'Moins de casse au démêlage',
  },
];
