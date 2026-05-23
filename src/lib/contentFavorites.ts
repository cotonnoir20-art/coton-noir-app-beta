import AsyncStorage from '@react-native-async-storage/async-storage';

const ARTICLE_FAV_KEY = '@coton_noir_fav_articles';
const PRODUCT_FAV_KEY = '@coton_noir_fav_products';
const RECIPE_FAV_KEY = '@coton_noir_fav_recipes';

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

export type RecipeFavorite = {
  id: string;
  name: string;
  category: string;
  thumbEmoji?: string;
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

type FavoriteBase = { id: string; savedAt: string };

function createFavoriteStore<T extends FavoriteBase>(storageKey: string) {
  return {
    async list(): Promise<T[]> {
      return readJson<T>(storageKey);
    },
    async isFavorite(id: string): Promise<boolean> {
      const list = await readJson<T>(storageKey);
      return list.some(item => item.id === id);
    },
    async toggle(item: Omit<T, 'savedAt'>): Promise<boolean> {
      const list = await readJson<T>(storageKey);
      const exists = list.some(entry => entry.id === item.id);
      if (exists) {
        await writeJson(
          storageKey,
          list.filter(entry => entry.id !== item.id),
        );
        return false;
      }
      await writeJson(storageKey, [
        { ...item, savedAt: new Date().toISOString() } as T,
        ...list,
      ]);
      return true;
    },
    async remove(id: string): Promise<void> {
      const list = await readJson<T>(storageKey);
      await writeJson(
        storageKey,
        list.filter(entry => entry.id !== id),
      );
    },
  };
}

const articleStore = createFavoriteStore<ArticleFavorite>(ARTICLE_FAV_KEY);
const productStore = createFavoriteStore<ProductFavorite>(PRODUCT_FAV_KEY);
const recipeStore = createFavoriteStore<RecipeFavorite>(RECIPE_FAV_KEY);

export const listArticleFavorites = articleStore.list;
export const isArticleFavorite = articleStore.isFavorite;
export const toggleArticleFavorite = articleStore.toggle;
export const removeArticleFavorite = articleStore.remove;

export const listProductFavorites = productStore.list;
export const isProductFavorite = productStore.isFavorite;
export const toggleProductFavorite = productStore.toggle;
export const removeProductFavorite = productStore.remove;

export const listRecipeFavorites = recipeStore.list;
export const isRecipeFavorite = recipeStore.isFavorite;
export const toggleRecipeFavorite = recipeStore.toggle;
export const removeRecipeFavorite = recipeStore.remove;
