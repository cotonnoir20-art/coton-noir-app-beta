import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const REVIEWS_KEY = '@coton_noir_recipe_reviews';

export type RecipeReviewItem = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  status?: 'pending' | 'published' | 'rejected' | 'archived' | string;
};

type LocalReviewMap = Record<string, RecipeReviewItem[]>;

type RecipeReviewRow = {
  id: string;
  recipe_id: string;
  author: string | null;
  rating: number | null;
  text: string | null;
  created_at: string | null;
  status: string | null;
};

function signatureOf(review: Pick<RecipeReviewItem, 'author' | 'rating' | 'text' | 'date'>): string {
  return [
    review.author.trim().toLowerCase(),
    String(review.rating || 0),
    review.text.trim().toLowerCase(),
    review.date.slice(0, 10),
  ].join('|');
}

function normalizeLocalMap(raw: unknown): LocalReviewMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: LocalReviewMap = {};
  for (const [recipeId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    out[recipeId] = value
      .filter((item): item is RecipeReviewItem => {
        if (!item || typeof item !== 'object') return false;
        const r = item as Record<string, unknown>;
        return typeof r.id === 'string'
          && typeof r.author === 'string'
          && typeof r.rating === 'number'
          && typeof r.text === 'string'
          && typeof r.date === 'string';
      })
      .map(item => ({ ...item }));
  }
  return out;
}

async function readLocalReviewMap(): Promise<LocalReviewMap> {
  try {
    const raw = await AsyncStorage.getItem(REVIEWS_KEY);
    if (!raw) return {};
    return normalizeLocalMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function writeLocalReviewMap(map: LocalReviewMap): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(map));
  } catch {}
}

function mapRowToItem(row: RecipeReviewRow): RecipeReviewItem {
  return {
    id: row.id,
    author: row.author?.trim() || 'Anonyme',
    rating: typeof row.rating === 'number' ? row.rating : 0,
    text: row.text?.trim() || '',
    date: row.created_at || new Date().toISOString(),
    status: row.status || 'published',
  };
}

function mergeReviewMaps(remote: Record<string, RecipeReviewItem[]>, local: Record<string, RecipeReviewItem[]>): Record<string, RecipeReviewItem[]> {
  const out: Record<string, RecipeReviewItem[]> = {};
  const recipeIds = new Set([...Object.keys(remote), ...Object.keys(local)]);

  for (const recipeId of recipeIds) {
    const base = [...(remote[recipeId] ?? [])];
    const seen = new Set(base.map(signatureOf));
    for (const review of local[recipeId] ?? []) {
      const sig = signatureOf(review);
      if (!seen.has(sig)) {
        base.push(review);
        seen.add(sig);
      }
    }
    base.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    out[recipeId] = base;
  }

  return out;
}

export async function loadRecipeReviews(): Promise<Record<string, RecipeReviewItem[]>> {
  const local = await readLocalReviewMap();

  try {
    const { data, error } = await supabase
      .from('recipe_reviews')
      .select('id, recipe_id, author, rating, text, created_at, status')
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      if (__DEV__ && error) console.warn('[recipeReviews] load', error.message);
      return local;
    }

    const remote: Record<string, RecipeReviewItem[]> = {};
    for (const row of data as RecipeReviewRow[]) {
      const recipeId = row.recipe_id;
      if (!recipeId) continue;
      const mapped = mapRowToItem(row);
      if (!remote[recipeId]) remote[recipeId] = [];
      remote[recipeId].push(mapped);
    }

    return mergeReviewMaps(remote, local);
  } catch {
    return local;
  }
}

export async function addRecipeReview(input: {
  recipeId: string;
  author: string;
  rating: number;
  text: string;
}): Promise<Record<string, RecipeReviewItem[]>> {
  const nowIso = new Date().toISOString();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('recipe_reviews')
        .insert({
          recipe_id: input.recipeId,
          user_id: user.id,
          author: input.author.trim() || 'Anonyme',
          rating: input.rating,
          text: input.text.trim(),
          status: 'pending',
          source: 'app',
        })
        .select('id, recipe_id, author, rating, text, created_at, status')
        .single();

      if (!error && data) {
        return loadRecipeReviews();
      }

      if (__DEV__ && error) console.warn('[recipeReviews] insert', error.message);
    }
  } catch {}

  const current = await readLocalReviewMap();
  const review: RecipeReviewItem = {
    id: `local-recipe-review-${Date.now()}`,
    author: input.author.trim() || 'Anonyme',
    rating: input.rating,
    text: input.text.trim(),
    date: nowIso,
    status: 'published',
  };
  const next = {
    ...current,
    [input.recipeId]: [review, ...(current[input.recipeId] ?? [])],
  };
  await writeLocalReviewMap(next);
  return next;
}
