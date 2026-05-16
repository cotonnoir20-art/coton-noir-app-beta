import { supabase } from './supabase';
import type { MomentCard } from '../data/homeHighlights';
import { FALLBACK_HOME_HIGHLIGHTS } from '../data/homeHighlights';

type HighlightRow = {
  id: string;
  badge: string;
  title: string;
  sub: string;
  footer_left: string;
  variant: string;
  route: string | null;
  sort_order: number | null;
};

function normalizeVariant(v: string): MomentCard['variant'] {
  if (v === 'live' || v === 'premium' || v === 'neutral') return v;
  return 'neutral';
}

function mapRow(r: HighlightRow): MomentCard | null {
  const id = r?.id != null ? String(r.id) : '';
  const title = typeof r?.title === 'string' ? r.title.trim() : '';
  if (!id || !title) return null;
  return {
    id,
    badge: typeof r.badge === 'string' ? r.badge : '',
    title,
    sub: typeof r.sub === 'string' ? r.sub : '',
    footerLeft: typeof r.footer_left === 'string' ? r.footer_left : '',
    variant: normalizeVariant(typeof r.variant === 'string' ? r.variant : ''),
    route: r.route != null && String(r.route).trim() ? String(r.route).trim() : undefined,
  };
}

/** Routes déjà couvertes par l’API (évite doublons hydra/box si graines UUID + fallback local). */
function routeKey(route: string | undefined): string | null {
  if (route == null || !String(route).trim()) return null;
  return String(route).trim().toLowerCase();
}

/**
 * Complète la liste serveur avec les cartes locales dont la route n’existe pas encore
 * (ex. base à 2 lignes, fallback à 5 entrées).
 */
function mergeHighlightsWithFallback(db: MomentCard[]): MomentCard[] {
  const seen = new Set<string>();
  for (const x of db) {
    const k = routeKey(x.route);
    if (k) seen.add(k);
  }
  const out = [...db];
  for (const f of FALLBACK_HOME_HIGHLIGHTS) {
    const k = routeKey(f.route);
    if (k == null) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(f);
  }
  return out;
}

/**
 * Charge les cartes « Moments forts » depuis Supabase (`highlights` publiées).
 * Fenêtre temporelle gérée côté RLS SQL. Repli sur `FALLBACK_HOME_HIGHLIGHTS`.
 */
export async function fetchHomeHighlights(): Promise<MomentCard[]> {
  const fb = FALLBACK_HOME_HIGHLIGHTS;
  try {
    const { data, error } = await supabase
      .from('highlights')
      .select('id,badge,title,sub,footer_left,variant,route,sort_order')
      .order('sort_order', { ascending: true });

    if (error && __DEV__) console.warn('[highlights]', error.message);

    const rows = Array.isArray(data) ? (data as HighlightRow[]) : [];
    if (rows.length === 0) return fb;

    const list = rows.map(mapRow).filter((c): c is MomentCard => c != null);
    if (list.length === 0) return fb;
    return mergeHighlightsWithFallback(list);
  } catch (e) {
    if (__DEV__) console.warn('[highlights]', e);
    return fb;
  }
}
