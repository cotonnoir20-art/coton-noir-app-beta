import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const LEGACY_KEY = '@coton_noir_community_likes';

export type ToggleLikeResult = {
  liked: boolean;
  likesCount: number;
};

/** IDs des posts likés par l'utilisatrice connectée (serveur). */
export async function fetchMyLikedPostIds(): Promise<Record<string, true>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from('community_post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (error) {
      if (__DEV__) console.warn('[communityLikes] fetch', error.message);
      return loadLegacyLocalLikes();
    }

    const map: Record<string, true> = {};
    for (const row of data ?? []) {
      if (row?.post_id) map[row.post_id as string] = true;
    }
    return map;
  } catch {
    return loadLegacyLocalLikes();
  }
}

async function loadLegacyLocalLikes(): Promise<Record<string, true>> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const map: Record<string, true> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v) map[k] = true;
    }
    return map;
  } catch {
    return {};
  }
}

/** Bascule un like via RPC ; repli local si la migration SQL n'est pas encore appliquée. */
export async function toggleCommunityPostLike(
  postId: string,
  currentLikes: number,
): Promise<ToggleLikeResult> {
  const { data, error } = await supabase.rpc('toggle_community_post_like', {
    p_post_id: postId,
  });

  if (!error && data && typeof data === 'object') {
    const row = data as { liked?: boolean; likes_count?: number };
    return {
      liked: !!row.liked,
      likesCount: typeof row.likes_count === 'number' ? row.likes_count : currentLikes,
    };
  }

  if (__DEV__ && error) {
    console.warn('[communityLikes] toggle rpc', error.message);
  }

  const legacy = await loadLegacyLocalLikes();
  const wasLiked = !!legacy[postId];
  if (wasLiked) delete legacy[postId];
  else legacy[postId] = true;
  await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

  const delta = wasLiked ? -1 : 1;
  return {
    liked: !wasLiked,
    likesCount: Math.max(0, currentLikes + delta),
  };
}
