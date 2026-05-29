import { supabase } from './supabase';
import type { Product } from '../data/products';

const CATEGORY_TO_CAT: Record<string, Product['cat']> = {
  masque:              'mask',
  'après-shampoing':   'cond',
  'apres-shampoing':   'cond',
  conditioner:         'cond',
  shampoing:           'sham',
  shampooing:          'sham',
  'leave-in':          'leave',
  'leave in':          'leave',
  huile:               'oil',
  coiffage:            'style',
  styling:             'style',
  'complément':        'compl',
  complement:          'compl',
  supplement:          'compl',
};

function mapCategory(cat: string): Product['cat'] {
  return CATEGORY_TO_CAT[cat.toLowerCase().trim()] ?? 'mask';
}

function formatPrice(cents: number, currency = 'EUR'): string {
  const euros = cents / 100;
  return `${euros.toFixed(2).replace('.', ',')} ${currency === 'EUR' ? '€' : currency}`;
}

type SupabaseProductRow = {
  id: string;
  name: string;
  brand: string;
  tagline: string | null;
  description: string | null;
  description_full: string | null;
  category: string;
  tags: string[] | null;
  admin_tags: string[] | null;
  price_cents: number;
  currency: string;
  old_price_cents: number | null;
  discount_label: string | null;
  emoji: string | null;
  bg_color: string | null;
  rating: number | null;
  rating_count: number;
  key_ingredients: string[] | null;
  ingredients: string | string[] | null;
  image: string | null;
};

function mapRow(row: SupabaseProductRow): Product {
  return {
    brand: row.brand,
    name: row.name,
    price: formatPrice(row.price_cents, row.currency),
    old: row.old_price_cents ? formatPrice(row.old_price_cents, row.currency) : undefined,
    off: row.discount_label ?? undefined,
    rating: Number(row.rating) || 0,
    count: row.rating_count,
    bg: row.bg_color ?? '#FDE8C8',
    emoji: row.emoji ?? '🧴',
    cat: mapCategory(row.category),
    // tagline = fonction courte du produit (carte reco) ; fallback sur description
    desc: row.tagline ?? row.description ?? undefined,
    // key_ingredients = chips ingrédients clés ; fallback sur ingredients si key_ingredients absent
    ingredients: row.key_ingredients?.length
      ? row.key_ingredients
      : row.ingredients
        ? (Array.isArray(row.ingredients)
            ? (row.ingredients as string[]).filter(Boolean)
            : (row.ingredients as string).split(',').map((s: string) => s.trim()).filter(Boolean))
        : undefined,
    admin_tags: row.admin_tags ?? row.tags ?? [],
    image: row.image ?? undefined,
  };
}

export async function fetchPublishedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('rating', { ascending: false });

  if (error) {
    if (__DEV__) console.error('[supabaseProducts] fetch error:', error.message, error.code, error.details);
    // Retry sans filtre status ni order au cas où la colonne manque
    const fallback = await supabase.from('products').select('*');
    if (__DEV__) console.warn('[supabaseProducts] fallback result:', fallback.data?.length ?? 0, 'rows, error:', fallback.error?.message);
    if (fallback.error || !fallback.data?.length) return [];
    return fallback.data.map(mapRow);
  }

  if (__DEV__) console.log('[supabaseProducts] fetched', data?.length ?? 0, 'published products');
  if (!data?.length) return [];
  return data.map(mapRow);
}
