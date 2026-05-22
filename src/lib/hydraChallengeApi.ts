import { supabase } from './supabase';
import { HYDRA_SLUG } from './hydraChallenge';

export type HydraLeaderboardRow = {
  rank_num: number;
  user_id: string;
  display_name: string;
  active_days: number;
  post_count: number;
  is_me: boolean;
};

export type HydraServerStats = {
  joined_at: string | null;
  active_days: number;
  post_count: number;
};

export async function joinChallengeOnServer(slug: string = HYDRA_SLUG): Promise<boolean> {
  const { error } = await supabase.rpc('join_challenge', { p_slug: slug });
  if (error && __DEV__) {
    console.warn('[hydraChallengeApi] join', error.message);
  }
  return !error;
}

export async function fetchHydraServerStats(): Promise<HydraServerStats | null> {
  const { data, error } = await supabase.rpc('get_hydra_my_stats');
  if (error || !data || typeof data !== 'object') {
    if (__DEV__ && error) console.warn('[hydraChallengeApi] stats', error.message);
    return null;
  }
  const row = data as {
    joined_at?: string | null;
    active_days?: number;
    post_count?: number;
  };
  return {
    joined_at: typeof row.joined_at === 'string' ? row.joined_at : null,
    active_days: typeof row.active_days === 'number' ? row.active_days : 0,
    post_count: typeof row.post_count === 'number' ? row.post_count : 0,
  };
}

export async function fetchHydraLeaderboard(limit = 30): Promise<HydraLeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_hydra_leaderboard', { p_limit: limit });
  if (error || !Array.isArray(data)) {
    if (__DEV__ && error) console.warn('[hydraChallengeApi] leaderboard', error.message);
    return [];
  }
  return data.map((row: Record<string, unknown>) => ({
    rank_num: Number(row.rank_num) || 0,
    user_id: String(row.user_id ?? ''),
    display_name: String(row.display_name ?? 'Membre'),
    active_days: Number(row.active_days) || 0,
    post_count: Number(row.post_count) || 0,
    is_me: !!row.is_me,
  }));
}

export async function fetchHydraParticipantCount(): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_hydra_participant_count');
  if (error) {
    if (__DEV__) console.warn('[hydraChallengeApi] participants', error.message);
    return null;
  }
  return typeof data === 'number' ? data : null;
}
