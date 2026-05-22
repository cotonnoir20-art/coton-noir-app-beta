import AsyncStorage from '@react-native-async-storage/async-storage';

const ARTICLE_FAV_KEY = '@coton_noir_fav_articles';
const PRODUCT_FAV_KEY = '@coton_noir_fav_products';

export type ArticleFavorite = {
  id: string;
  title: string;
  category: string;
  savedAt: string;
};

export type ProductFavorite = {
  id: string;
  brand: string;
  name: string;
  savedAt: string;
};

async function readJson<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJson<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function listArticleFavorites(): Promise<ArticleFavorite[]> {
  return readJson<ArticleFavorite>(ARTICLE_FAV_KEY);
}

export async function isArticleFavorite(id: string): Promise<boolean> {
  const list = await listArticleFavorites();
  return list.some(a => a.id === id);
}

export async function toggleArticleFavorite(article: Omit<ArticleFavorite, 'savedAt'>): Promise<boolean> {
  const list = await listArticleFavorites();
  const exists = list.some(a => a.id === article.id);
  if (exists) {
    await writeJson(
      ARTICLE_FAV_KEY,
      list.filter(a => a.id !== article.id),
    );
    return false;
  }
  await writeJson(ARTICLE_FAV_KEY, [
    { ...article, savedAt: new Date().toISOString() },
    ...list,
  ]);
  return true;
}

export async function removeArticleFavorite(id: string): Promise<void> {
  const list = await listArticleFavorites();
  await writeJson(ARTICLE_FAV_KEY, list.filter(a => a.id !== id));
}

export async function listProductFavorites(): Promise<ProductFavorite[]> {
  return readJson<ProductFavorite>(PRODUCT_FAV_KEY);
}

export async function isProductFavorite(id: string): Promise<boolean> {
  const list = await listProductFavorites();
  return list.some(p => p.id === id);
}

export async function toggleProductFavorite(product: Omit<ProductFavorite, 'savedAt'>): Promise<boolean> {
  const list = await listProductFavorites();
  const exists = list.some(p => p.id === product.id);
  if (exists) {
    await writeJson(
      PRODUCT_FAV_KEY,
      list.filter(p => p.id !== product.id),
    );
    return false;
  }
  await writeJson(PRODUCT_FAV_KEY, [
    { ...product, savedAt: new Date().toISOString() },
    ...list,
  ]);
  return true;
}

export async function removeProductFavorite(id: string): Promise<void> {
  const list = await listProductFavorites();
  await writeJson(PRODUCT_FAV_KEY, list.filter(p => p.id !== id));
}
