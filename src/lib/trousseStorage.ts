import AsyncStorage from '@react-native-async-storage/async-storage';

const TROUSSE_KEY = '@coton_noir_trousse';

export type TrousseCategory =
  | 'shampooing'
  | 'après-shampooing'
  | 'masque'
  | 'huile'
  | 'gel / crème'
  | 'soin sans rinçage'
  | 'autre';

export type TrousseProduct = {
  id: string;
  name: string;
  brand: string;
  category: TrousseCategory;
  rating: number; // 1-5
  memo: string;
  barcode?: string;
  addedAt: string;
};

export const TROUSSE_CATEGORIES: { id: TrousseCategory; emoji: string; label: string }[] = [
  { id: 'shampooing',        emoji: '🧴', label: 'Shampooing' },
  { id: 'après-shampooing',  emoji: '💆', label: 'Après-shampooing' },
  { id: 'masque',            emoji: '🫙', label: 'Masque' },
  { id: 'huile',             emoji: '💧', label: 'Huile' },
  { id: 'gel / crème',       emoji: '✨', label: 'Gel / Crème' },
  { id: 'soin sans rinçage', emoji: '🌿', label: 'Soin sans rinçage' },
  { id: 'autre',             emoji: '📦', label: 'Autre' },
];

async function readAll(): Promise<TrousseProduct[]> {
  try {
    const raw = await AsyncStorage.getItem(TROUSSE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: TrousseProduct[]): Promise<void> {
  await AsyncStorage.setItem(TROUSSE_KEY, JSON.stringify(items));
}

export async function listTrousse(): Promise<TrousseProduct[]> {
  return readAll();
}

export async function addToTrousse(
  product: Omit<TrousseProduct, 'id' | 'addedAt'>,
): Promise<TrousseProduct> {
  const items = await readAll();
  const newProduct: TrousseProduct = {
    ...product,
    id: `trousse_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    addedAt: new Date().toISOString(),
  };
  await writeAll([newProduct, ...items]);
  return newProduct;
}

export async function updateTrousseProduct(
  id: string,
  updates: Partial<Omit<TrousseProduct, 'id' | 'addedAt'>>,
): Promise<void> {
  const items = await readAll();
  await writeAll(items.map(p => (p.id === id ? { ...p, ...updates } : p)));
}

export async function removeFromTrousse(id: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.filter(p => p.id !== id));
}
