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
};

export const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'all',   label: '✨ Tous'           },
  { id: 'sham',  label: '🧴 Shampoings'     },
  { id: 'cond',  label: '💆 Après-shampoing'},
  { id: 'leave', label: '💧 Leave-in'       },
  { id: 'mask',  label: '🫧 Masques'        },
  { id: 'oil',   label: '🌿 Huiles'         },
  { id: 'style', label: '💇 Coiffage'       },
  { id: 'compl', label: '💊 Compléments'    },
];

export const PRODUCTS: Product[] = [
  { brand: 'Maison Curl', name: 'Masque Karité Profond', price: '24,90 €', old: '32,00 €', off: '-22%', rating: 4.8, count: 312, bg: '#F2C4CC', emoji: '🫧', cat: 'mask'  },
  { brand: 'Racines',     name: 'Huile Ricin Noir',      price: '18,00 €',                              rating: 4.6, count: 184, bg: '#E2EDD8', emoji: '🌿', cat: 'oil'   },
  { brand: 'Coton Noir',  name: 'Leave-in Hydrate',      price: '14,50 €',                              rating: 4.9, count: 502, bg: '#FDE8C8', emoji: '🧴', cat: 'sham'  },
  { brand: 'Ondine',      name: 'Co-wash Aloe',          price: '16,90 €', old: '21,00 €', off: '-19%', rating: 4.5, count: 96,  bg: '#F2C4CC', emoji: '🧴', cat: 'sham'  },
  { brand: 'Maison Curl', name: 'Crème Définition',      price: '22,00 €',                              rating: 4.7, count: 211, bg: '#FDE8C8', emoji: '💇', cat: 'style' },
  { brand: 'Racines',     name: 'Sérum Pointes',         price: '12,00 €',                              rating: 4.4, count: 75,  bg: '#E2EDD8', emoji: '✨', cat: 'style' },
];
