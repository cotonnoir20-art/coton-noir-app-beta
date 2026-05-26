export type ProductCategory =
  | 'all'
  | 'sham'    // shampoing
  | 'cond'    // après-shampoing
  | 'leave'   // leave-in
  | 'mask'    // masque
  | 'oil'     // huile
  | 'style'   // coiffage / gel / crème de définition
  | 'compl';  // complément

export type Product = {
  brand: string;
  name: string;
  price: string;
  old?: string;
  off?: string;
  rating: number;
  count: number;
  bg: string;
  emoji: string;
  cat: Exclude<ProductCategory, 'all'>;
  desc?: string;
  ingredients?: string[];
};

export const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'all',   label: '✨ Tous'            },
  { id: 'sham',  label: '🧴 Shampoings'      },
  { id: 'cond',  label: '💆 Après-shampoing' },
  { id: 'leave', label: '💧 Leave-in'        },
  { id: 'mask',  label: '🫧 Masques'         },
  { id: 'oil',   label: '🌿 Huiles'          },
  { id: 'style', label: '💇 Coiffage'        },
  { id: 'compl', label: '💊 Compléments'     },
];

export const PRODUCTS: Product[] = [
  {
    brand: 'Maison Curl',
    name: 'Masque Karité Profond',
    price: '24,90 €',
    old: '32,00 €',
    off: '-22%',
    rating: 4.8,
    count: 312,
    bg: '#F2C4CC',
    emoji: '🫧',
    cat: 'mask',
    desc: "Nourrit en profondeur et restaure la fibre capillaire asséchée.",
    ingredients: ['Beurre de karité', 'Huile de coco', 'Panthénol'],
  },
  {
    brand: 'Racines',
    name: 'Huile Ricin Noir',
    price: '18,00 €',
    rating: 4.6,
    count: 184,
    bg: '#E2EDD8',
    emoji: '🌿',
    cat: 'oil',
    desc: "Stimule la pousse et renforce les racines dès les premières applications.",
    ingredients: ['Ricin bio', 'Vitamine E', 'Huile de jojoba'],
  },
  {
    brand: 'Coton Noir',
    name: 'Leave-in Hydrate',
    price: '14,50 €',
    rating: 4.9,
    count: 502,
    bg: '#FDE8C8',
    emoji: '🧴',
    cat: 'leave',
    desc: "Hydrate sans alourdir et facilite le démêlage sur cheveux texturés.",
    ingredients: ['Aloe vera', 'Glycérine végétale', 'Huile de jojoba'],
  },
  {
    brand: 'Ondine',
    name: 'Co-wash Aloe',
    price: '16,90 €',
    old: '21,00 €',
    off: '-19%',
    rating: 4.5,
    count: 96,
    bg: '#F2C4CC',
    emoji: '🧴',
    cat: 'sham',
    desc: "Nettoie en douceur tout en apportant hydratation et souplesse.",
    ingredients: ['Aloe vera', 'Glycérine végétale', 'Huile de jojoba'],
  },
  {
    brand: 'Maison Curl',
    name: 'Crème Définition',
    price: '22,00 €',
    rating: 4.7,
    count: 211,
    bg: '#FDE8C8',
    emoji: '💇',
    cat: 'style',
    desc: "Définit les boucles et réduit les frisottis sans effet cartonneux.",
    ingredients: ['Beurre de mangue', 'Huile de tournesol', 'Extrait de coton'],
  },
  {
    brand: 'Racines',
    name: 'Sérum Pointes',
    price: '12,00 €',
    rating: 4.4,
    count: 75,
    bg: '#E2EDD8',
    emoji: '✨',
    cat: 'style',
    desc: "Répare les pointes abîmées et scelle l'hydratation durablement.",
    ingredients: ['Huile de ricin', 'Kératine végétale', 'Vitamine E'],
  },
];
