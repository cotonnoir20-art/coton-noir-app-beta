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
  description: string | null;
  description_full: string | null;
  category: string;
  tags: string[] | null;
  price_cents: number;
  currency: string;
  old_price_cents: number | null;
  discount_label: string | null;
  emoji: string | null;
  bg_color: string | null;
  rating: number | null;
  rating_count: number;
  ingredients: string | null;
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
    desc: row.description_full ?? row.description ?? undefined,
    ingredients: row.ingredients
      ? row.ingredients.split(',').map(s => s.trim()).filter(Boolean)
      : undefined,
    admin_tags: row.tags ?? [],
    image: row.image ?? undefined,
  };
}

export async function fetchPublishedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,brand,description,description_full,category,tags,price_cents,currency,old_price_cents,discount_label,emoji,bg_color,rating,rating_count,ingredients,image')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false });

  if (error || !data?.length) return [];
  return data.map(mapRow);
}
