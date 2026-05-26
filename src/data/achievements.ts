import type { AppState } from '../context/AppContext';
import { supabase } from '../lib/supabase';

/**
 * Catalogue de badges (achievements) — source de vérité unique.
 *
 * Chaque entrée est immuable et possède un `predicate` pur qui prend l'état
 * de l'app + quelques extras (calculés ailleurs : nb de recettes testées, etc.)
 * et renvoie `true` si le badge est débloqué à cet instant.
 *
 * Les dates de déblocage sont persistées séparément (AchievementsContext)
 * pour ne pas se perdre entre deux relances.
 */

export type AchievementGroup = 'starter' | 'streak' | 'growth' | 'coins' | 'community';

export type AchievementMetricKey =
  | 'has_any_validated'
  | 'recipes_liked_count'
  | 'hairstyles_liked_count'
  | 'streak_days'
  | 'growth_entries_count'
  | 'planned_soins_count'
  | 'total_earned_coins'
  | 'invites_sent_count';

export type AchievementExtras = {
  /** Nombre de recettes likées (clé AsyncStorage `@coton_noir_recipe_likes`). */
  recipesLikedCount: number;
  /** Nombre de coiffures likées (clé `@coton_noir_hairstyle_likes`). */
  hairstylesLikedCount: number;
  /** Nombre d'invitations envoyées (placeholder — 0 pour l'instant). */
  invitesSentCount: number;
};

export const EMPTY_EXTRAS: AchievementExtras = {
  recipesLikedCount: 0,
  hairstylesLikedCount: 0,
  invitesSentCount: 0,
};

export type AchievementDef = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  group: AchievementGroup;
  /** Niveau de prestige (1 → bronze, 2 → argent, 3 → or). Sert au tri / au visuel. */
  tier: 1 | 2 | 3;
  /** Renvoie true si l'utilisatrice mérite ce badge à cet instant. */
  predicate: (state: AppState, extras: AchievementExtras) => boolean;
  /** Optionnel : progression normalisée 0..1 pour les badges verrouillés. */
  progress?: (state: AppState, extras: AchievementExtras) => number;
};

export type AchievementCatalogRow = {
  achievement_key: string;
  emoji: string;
  name: string;
  description: string;
  group_key: AchievementGroup | string;
  tier: number;
  metric_key: AchievementMetricKey | string;
  target_value: number;
  sort_order?: number;
  is_active?: boolean;
};

function hasAnyValidated(state: AppState): boolean {
  return Object.values(state.validated ?? {}).some(Boolean) || state.streak > 0;
}

function totalEarned(state: AppState): number {
  return state.totalEarned ?? state.coins;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function metricValue(
  metric: AchievementMetricKey,
  state: AppState,
  extras: AchievementExtras,
): number {
  switch (metric) {
    case 'has_any_validated':
      return hasAnyValidated(state) ? 1 : 0;
    case 'recipes_liked_count':
      return extras.recipesLikedCount;
    case 'hairstyles_liked_count':
      return extras.hairstylesLikedCount;
    case 'streak_days':
      return state.streak ?? 0;
    case 'growth_entries_count':
      return state.growthHistory?.length ?? 0;
    case 'planned_soins_count':
      return state.plannedSoins?.length ?? 0;
    case 'total_earned_coins':
      return totalEarned(state);
    case 'invites_sent_count':
      return extras.invitesSentCount;
    default:
      return 0;
  }
}

function isAchievementGroup(value: string): value is AchievementGroup {
  return ['starter', 'streak', 'growth', 'coins', 'community'].includes(value);
}

function isMetricKey(value: string): value is AchievementMetricKey {
  return [
    'has_any_validated',
    'recipes_liked_count',
    'hairstyles_liked_count',
    'streak_days',
    'growth_entries_count',
    'planned_soins_count',
    'total_earned_coins',
    'invites_sent_count',
  ].includes(value);
}

function normalizeTier(value: number): 1 | 2 | 3 {
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 1;
}

export function buildAchievementDef(row: AchievementCatalogRow): AchievementDef | null {
  if (
    !row
    || typeof row.achievement_key !== 'string'
    || typeof row.emoji !== 'string'
    || typeof row.name !== 'string'
    || typeof row.description !== 'string'
    || !isAchievementGroup(String(row.group_key))
    || !isMetricKey(String(row.metric_key))
  ) {
    return null;
  }

  const target = Math.max(1, Number(row.target_value) || 1);
  const metric = row.metric_key as AchievementMetricKey;

  return {
    id: row.achievement_key,
    emoji: row.emoji,
    name: row.name,
    desc: row.description,
    group: row.group_key as AchievementGroup,
    tier: normalizeTier(Number(row.tier) || 1),
    predicate: (state, extras) => metricValue(metric, state, extras) >= target,
    progress: (state, extras) => clamp01(metricValue(metric, state, extras) / target),
  };
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // ── Starter
  {
    id: 'first-routine',
    emoji: '🌱',
    name: 'Première routine',
    desc: 'Termine ta toute première routine',
    group: 'starter',
    tier: 1,
    predicate: state => hasAnyValidated(state),
  },
  {
    id: 'first-recipe-tested',
    emoji: '🧪',
    name: 'Première recette testée',
    desc: 'Ajoute une recette à tes favoris',
    group: 'starter',
    tier: 1,
    predicate: (_state, extras) => extras.recipesLikedCount >= 1,
  },
  {
    id: 'first-hairstyle',
    emoji: '💇',
    name: 'Coup de cœur coiffure',
    desc: 'Like ta première coiffure',
    group: 'starter',
    tier: 1,
    predicate: (_state, extras) => extras.hairstylesLikedCount >= 1,
  },

  // ── Streak
  {
    id: 'streak-7',
    emoji: '🔥',
    name: 'Régularité',
    desc: '7 jours de streak consécutifs',
    group: 'streak',
    tier: 1,
    predicate: state => state.streak >= 7,
    progress:  state => clamp01(state.streak / 7),
  },
  {
    id: 'streak-30',
    emoji: '🔥',
    name: '1 mois sans casse',
    desc: '30 jours de routine sans interruption',
    group: 'streak',
    tier: 2,
    predicate: state => state.streak >= 30,
    progress:  state => clamp01(state.streak / 30),
  },
  {
    id: 'streak-90',
    emoji: '👑',
    name: 'Reine du naturel',
    desc: '90 jours de streak — tu es une légende',
    group: 'streak',
    tier: 3,
    predicate: state => state.streak >= 90,
    progress:  state => clamp01(state.streak / 90),
  },

  // ── Growth
  {
    id: 'first-measure',
    emoji: '📏',
    name: 'Première mesure',
    desc: 'Tu as enregistré ta première longueur',
    group: 'growth',
    tier: 1,
    predicate: state => (state.growthHistory?.length ?? 0) >= 1,
    progress:  state => clamp01((state.growthHistory?.length ?? 0) >= 1 ? 1 : 0),
  },
  {
    id: 'growth-photographer',
    emoji: '📸',
    name: 'Photographe',
    desc: '3 entrées de pousse enregistrées',
    group: 'growth',
    tier: 1,
    predicate: state => (state.growthHistory?.length ?? 0) >= 3,
    progress:  state => clamp01((state.growthHistory?.length ?? 0) / 3),
  },
  {
    id: 'growth-master',
    emoji: '📈',
    name: 'Suivi expert',
    desc: '10 mesures de pousse — tu maîtrises',
    group: 'growth',
    tier: 2,
    predicate: state => (state.growthHistory?.length ?? 0) >= 10,
    progress:  state => clamp01((state.growthHistory?.length ?? 0) / 10),
  },
  {
    id: 'wash-planner',
    emoji: '🗓️',
    name: 'Organisée',
    desc: '5 soins planifiés dans ton calendrier',
    group: 'growth',
    tier: 1,
    predicate: state => (state.plannedSoins?.length ?? 0) >= 5,
    progress:  state => clamp01((state.plannedSoins?.length ?? 0) / 5),
  },

  // ── Coins
  {
    id: 'coin-collector',
    emoji: '🪙',
    name: 'Collectionneuse',
    desc: '500 CotonCoins gagnés au total',
    group: 'coins',
    tier: 1,
    predicate: state => totalEarned(state) >= 500,
    progress:  state => clamp01(totalEarned(state) / 500),
  },
  {
    id: 'coin-master',
    emoji: '💎',
    name: 'Diamant',
    desc: '1500 CotonCoins cumulés',
    group: 'coins',
    tier: 2,
    predicate: state => totalEarned(state) >= 1500,
    progress:  state => clamp01(totalEarned(state) / 1500),
  },

  // ── Community
  {
    id: 'mentor',
    emoji: '🤝',
    name: 'Mentor',
    desc: '3 amies invitées sur Coton Noir',
    group: 'community',
    tier: 2,
    predicate: (_state, extras) => extras.invitesSentCount >= 3,
    progress:  (_state, extras) => clamp01(extras.invitesSentCount / 3),
  },
];

/** Lookup rapide id → définition. */
export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.id, a]),
);

export function buildAchievementLookup(defs: readonly AchievementDef[]): Record<string, AchievementDef> {
  return Object.fromEntries(defs.map(def => [def.id, def]));
}

export type AchievementStatus = {
  def: AchievementDef;
  unlocked: boolean;
  unlockedAt: string | null; // ISO date
  /** Progression 0..1. 1 si débloqué, valeur du predicate sinon. */
  progress: number;
};

/**
 * Évalue tous les achievements pour un état donné.
 * `unlockedDates` fournit la persistance (dates conservées entre les sessions).
 */
export function evaluateAchievements(
  state: AppState,
  extras: AchievementExtras,
  unlockedDates: Record<string, string>,
  defs: readonly AchievementDef[] = ACHIEVEMENTS,
): AchievementStatus[] {
  return defs.map(def => {
    const unlocked = def.predicate(state, extras);
    return {
      def,
      unlocked,
      unlockedAt: unlocked ? unlockedDates[def.id] ?? null : null,
      progress: unlocked ? 1 : def.progress ? def.progress(state, extras) : 0,
    };
  });
}

export async function loadAchievementCatalog(): Promise<AchievementDef[]> {
  try {
    const { data, error } = await supabase
      .from('achievement_catalog')
      .select(
        'achievement_key, emoji, name, description, group_key, tier, metric_key, target_value, sort_order, is_active',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !Array.isArray(data)) {
      if (__DEV__ && error) console.warn('[achievements] catalog', error.message);
      return [...ACHIEVEMENTS];
    }

    const defs = (data as AchievementCatalogRow[])
      .map(buildAchievementDef)
      .filter((item): item is AchievementDef => item != null);

    return defs.length > 0 ? defs : [...ACHIEVEMENTS];
  } catch (error) {
    if (__DEV__) {
      console.warn('[achievements] catalog unexpected', error);
    }
    return [...ACHIEVEMENTS];
  }
}
