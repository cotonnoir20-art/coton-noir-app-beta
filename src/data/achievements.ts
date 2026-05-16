import type { AppState } from '../context/AppContext';

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
): AchievementStatus[] {
  return ACHIEVEMENTS.map(def => {
    const unlocked = def.predicate(state, extras);
    return {
      def,
      unlocked,
      unlockedAt: unlocked ? unlockedDates[def.id] ?? null : null,
      progress: unlocked ? 1 : def.progress ? def.progress(state, extras) : 0,
    };
  });
}
