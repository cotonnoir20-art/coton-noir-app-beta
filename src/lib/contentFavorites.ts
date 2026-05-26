import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

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

type FavoriteContentType = 'article' | 'product' | 'recipe';

async function syncFavoriteRow(args: {
  contentType: FavoriteContentType;
  contentId: string;
  active: boolean;
  label?: string;
  category?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (args.active) {
      await supabase
        .from('user_favorites')
        .upsert(
          {
            user_id: user.id,
            content_type: args.contentType,
            content_id: args.contentId,
            label: args.label ?? null,
            category: args.category ?? null,
            saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,content_type,content_id' },
        );
      return;
    }

    await supabase
      .from('user_favorites')
      .delete()
      .eq('content_type', args.contentType)
      .eq('content_id', args.contentId);
  } catch {
    // La synchro distante est best-effort : le fallback local reste prioritaire.
  }
}

function createFavoriteStore<T extends FavoriteBase>(
  storageKey: string,
  sync: {
    contentType: FavoriteContentType;
    getLabel: (item: Omit<T, 'savedAt'>) => string;
    getCategory: (item: Omit<T, 'savedAt'>) => string | undefined;
  },
) {
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
        await syncFavoriteRow({
          contentType: sync.contentType,
          contentId: item.id,
          active: false,
        });
        return false;
      }
      await writeJson(storageKey, [
        { ...item, savedAt: new Date().toISOString() } as T,
        ...list,
      ]);
      await syncFavoriteRow({
        contentType: sync.contentType,
        contentId: item.id,
        active: true,
        label: sync.getLabel(item),
        category: sync.getCategory(item),
      });
      return true;
    },
    async remove(id: string): Promise<void> {
      const list = await readJson<T>(storageKey);
      await writeJson(
        storageKey,
        list.filter(entry => entry.id !== id),
      );
      await syncFavoriteRow({
        contentType: sync.contentType,
        contentId: id,
        active: false,
      });
    },
  };
}

const articleStore = createFavoriteStore<ArticleFavorite>(ARTICLE_FAV_KEY, {
  contentType: 'article',
  getLabel: item => item.title,
  getCategory: item => item.category,
});
const productStore = createFavoriteStore<ProductFavorite>(PRODUCT_FAV_KEY, {
  contentType: 'product',
  getLabel: item => `${item.brand} ${item.name}`.trim(),
  getCategory: () => undefined,
});
const recipeStore = createFavoriteStore<RecipeFavorite>(RECIPE_FAV_KEY, {
  contentType: 'recipe',
  getLabel: item => item.name,
  getCategory: item => item.category,
});

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
