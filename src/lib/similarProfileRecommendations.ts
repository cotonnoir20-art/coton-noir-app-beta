import type { HairProfile } from '../context/AppContext';
import { displayObjective, normalizeObjectiveId } from '../constants/hairObjectives';
import { SIMILAR_PROFILE_PERSONAS, type SimilarProfilePersona } from '../data/similarProfilePersonas';
import { supabase } from './supabase';

export type SimilarProductReco = {
  id: string;
  displayName: string;
  hairType: string;
  porosity: string;
  productBrand: string;
  productName: string;
  outcome: string;
  source: 'routine_plan' | 'community' | 'persona';
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function scoreMatch(
  profile: Pick<HairProfile, 'hairType' | 'porosity' | 'objective'>,
  persona: SimilarProfilePersona,
  excludeProduct?: string,
): number {
  const ex = excludeProduct ? norm(excludeProduct) : '';
  const productKey = norm(`${persona.productBrand} ${persona.productName}`);
  if (ex && productKey.includes(ex)) return -1;

  let score = 0;
  if (profile.hairType && norm(persona.hairType).includes(norm(profile.hairType).slice(0, 2))) {
    score += 3;
  }
  if (profile.porosity && norm(persona.porosity) === norm(profile.porosity)) score += 2;
  const objLabel = displayObjective(normalizeObjectiveId(profile.objective ?? ''));
  if (objLabel && norm(persona.objective).includes(norm(objLabel).slice(0, 5))) {
    score += 1;
  }
  return score;
}

function personaToReco(p: SimilarProfilePersona): SimilarProductReco {
  return {
    id: p.id,
    displayName: p.displayName,
    hairType: p.hairType,
    porosity: p.porosity,
    productBrand: p.productBrand,
    productName: p.productName,
    outcome: p.outcome,
    source: 'persona',
  };
}

/** Recos locales à partir du catalogue personas. */
export function findSimilarProfilesLocal(
  profile: Pick<HairProfile, 'hairType' | 'porosity' | 'objective'>,
  testedProduct?: { brand: string; name: string },
  limit = 3,
): SimilarProductReco[] {
  const exclude = testedProduct
    ? `${testedProduct.brand} ${testedProduct.name}`
    : undefined;

  return SIMILAR_PROFILE_PERSONAS.map(p => ({ p, score: scoreMatch(profile, p, exclude) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => personaToReco(x.p));
}

type RemoteSignal = {
  hair_type: string | null;
  porosity: string | null;
  product_brand: string | null;
  product_name: string | null;
};

type RoutinePlanRpcRow = {
  product_brand: string | null;
  product_name: string | null;
  hair_type: string | null;
  porosity: string | null;
  outcome_snippet: string | null;
  plan_kind: string | null;
};

/** Produits testés via user_routine_plans (RPC — exécuter similar-routine-recos.sql). */
export async function fetchSimilarRoutinePlanProducts(
  profile: Pick<HairProfile, 'hairType' | 'porosity' | 'objective'>,
  testedProduct?: { brand: string; name: string },
  limit = 3,
): Promise<SimilarProductReco[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('fetch_similar_routine_plan_products', {
      match_hair_type: profile.hairType?.trim() || null,
      match_porosity: profile.porosity?.trim() || null,
      result_limit: limit + 2,
    });

    if (error || !data?.length) return [];

    const exclude = testedProduct
      ? norm(`${testedProduct.brand} ${testedProduct.name}`)
      : '';

    const seen = new Set<string>();
    const out: SimilarProductReco[] = [];

    for (const row of data as RoutinePlanRpcRow[]) {
      const brand = row.product_brand?.trim() ?? '';
      const name = row.product_name?.trim() ?? '';
      const key = norm(`${brand} ${name}`);
      if (!key || seen.has(key) || (exclude && key.includes(exclude))) continue;
      seen.add(key);

      out.push({
        id: `plan-${key}`,
        displayName: `Profil ${row.hair_type ?? profile.hairType ?? 'afro'}`,
        hairType: row.hair_type ?? '—',
        porosity: row.porosity ?? '—',
        productBrand: brand,
        productName: name,
        outcome:
          row.outcome_snippet?.trim() ||
          `Routine ${row.plan_kind ?? 'daily'} validée par une profil similaire`,
        source: 'routine_plan',
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Agrégat communauté product_test_signals (best-effort). */
export async function fetchSimilarProfilesRemote(
  profile: Pick<HairProfile, 'hairType' | 'porosity' | 'objective'>,
  testedProduct?: { brand: string; name: string },
  limit = 3,
): Promise<SimilarProductReco[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let q = supabase
      .from('product_test_signals')
      .select('hair_type, porosity, product_brand, product_name')
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40);

    if (profile.hairType?.trim()) {
      q = q.ilike('hair_type', `%${profile.hairType.trim().slice(0, 2)}%`);
    }

    const { data, error } = await q;
    if (error || !data?.length) return [];

    const exclude = testedProduct
      ? norm(`${testedProduct.brand} ${testedProduct.name}`)
      : '';

    const seen = new Set<string>();
    const out: SimilarProductReco[] = [];

    for (const row of data as RemoteSignal[]) {
      const brand = row.product_brand?.trim() ?? '';
      const name = row.product_name?.trim() ?? '';
      if (!brand && !name) continue;
      const key = norm(`${brand} ${name}`);
      if (seen.has(key) || (exclude && key.includes(exclude))) continue;
      seen.add(key);

      let score = 1;
      if (profile.porosity && row.porosity && norm(row.porosity) === norm(profile.porosity)) {
        score += 2;
      }

      out.push({
        id: `remote-${key}`,
        displayName: `Profil ${profile.hairType || 'afro'} · ${row.porosity ?? '—'}`,
        hairType: row.hair_type ?? profile.hairType ?? '—',
        porosity: row.porosity ?? '—',
        productBrand: brand,
        productName: name,
        outcome: 'Testé par une profil similaire sur Coton Noir',
        source: 'community',
      });

      if (out.length >= limit) break;
    }

    return out.slice(0, limit);
  } catch {
    return [];
  }
}

function mergeRecos(
  lists: SimilarProductReco[][],
  limit: number,
): SimilarProductReco[] {
  const merged: SimilarProductReco[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const r of list) {
      const key = norm(`${r.productBrand} ${r.productName}`);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
      if (merged.length >= limit) return merged;
    }
  }
  return merged;
}

export async function findSimilarProductRecommendations(
  profile: Pick<HairProfile, 'hairType' | 'porosity' | 'objective'>,
  testedProduct?: { brand: string; name: string },
  limit = 3,
): Promise<SimilarProductReco[]> {
  const [fromPlans, fromSignals, local] = await Promise.all([
    fetchSimilarRoutinePlanProducts(profile, testedProduct, limit),
    fetchSimilarProfilesRemote(profile, testedProduct, limit),
    Promise.resolve(findSimilarProfilesLocal(profile, testedProduct, limit)),
  ]);
  return mergeRecos([fromPlans, fromSignals, local], limit);
}
