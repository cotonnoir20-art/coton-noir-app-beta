import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProductReview = {
  id: string;
  produit: string;
  marque: string;
  categorie: string;
  note: number;
  commentaire: string;
  date: string;
  emoji: string;
  createdAt: string;
};

const KEY = '@coton_noir_user_product_reviews';

const CATEGORY_EMOJI: Record<string, string> = {
  Shampoing: '🧴',
  'Après-shampoing': '💧',
  Masque: '🫧',
  Huile: '🥥',
  'Crème coiffante': '🧴',
  Sérum: '✨',
  Spray: '💦',
  Autre: '⭐',
};

export async function loadUserProductReviews(): Promise<UserProductReview[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is UserProductReview =>
        r &&
        typeof r.id === 'string' &&
        typeof r.produit === 'string' &&
        typeof r.note === 'number',
    );
  } catch {
    return [];
  }
}

export async function addUserProductReview(input: {
  produit: string;
  marque: string;
  categorie: string;
  note: number;
  commentaire: string;
}): Promise<UserProductReview[]> {
  const today = new Date();
  const label = today.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const cat = input.categorie || 'Autre';
  const entry: UserProductReview = {
    id: `rev-${Date.now()}`,
    produit: input.produit.trim(),
    marque: input.marque.trim(),
    categorie: cat,
    note: input.note,
    commentaire: input.commentaire.trim(),
    date: label,
    emoji: CATEGORY_EMOJI[cat] ?? '⭐',
    createdAt: today.toISOString(),
  };
  const prev = await loadUserProductReviews();
  const next = [entry, ...prev].slice(0, 200);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function averageReviewNote(reviews: UserProductReview[]): number {
  if (!reviews.length) return 0;
  return +(reviews.reduce((s, r) => s + r.note, 0) / reviews.length).toFixed(1);
}
