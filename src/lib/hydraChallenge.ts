import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@coton_noir_hydra_challenge_v1';
export const HYDRA_SLUG = 'hydra30';
export const HYDRA_DURATION_DAYS = 30;

export type HydraChallengeState = {
  joined: boolean;
  joinedAt: string | null;
  postDays: string[];
};

const EMPTY: HydraChallengeState = {
  joined: false,
  joinedAt: null,
  postDays: [],
};

export async function loadHydraChallengeState(): Promise<HydraChallengeState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<HydraChallengeState>;
    return {
      joined: !!parsed.joined,
      joinedAt: typeof parsed.joinedAt === 'string' ? parsed.joinedAt : null,
      postDays: Array.isArray(parsed.postDays)
        ? parsed.postDays.filter((d): d is string => typeof d === 'string')
        : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

async function persist(state: HydraChallengeState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function joinHydraChallenge(syncServer = true): Promise<HydraChallengeState> {
  const today = new Date().toISOString().slice(0, 10);
  const state: HydraChallengeState = {
    joined: true,
    joinedAt: today,
    postDays: [],
  };
  await persist(state);
  if (syncServer) {
    const { joinChallengeOnServer } = await import('./hydraChallengeApi');
    void joinChallengeOnServer(HYDRA_SLUG);
  }
  return state;
}

export async function recordHydraPostDay(dateIso?: string): Promise<HydraChallengeState> {
  const state = await loadHydraChallengeState();
  if (!state.joined) return state;
  const day = dateIso ?? new Date().toISOString().slice(0, 10);
  if (state.postDays.includes(day)) return state;
  const next: HydraChallengeState = {
    ...state,
    postDays: [...state.postDays, day],
  };
  await persist(next);
  return next;
}

export function hydraDayNumber(joinedAt: string | null, today = new Date()): number {
  if (!joinedAt) return 0;
  const start = new Date(`${joinedAt}T12:00:00`);
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.min(HYDRA_DURATION_DAYS, Math.max(1, diff + 1));
}

export function hydraDaysRemaining(joinedAt: string | null, today = new Date()): number {
  const n = hydraDayNumber(joinedAt, today);
  if (!joinedAt || n <= 0) return HYDRA_DURATION_DAYS;
  return Math.max(0, HYDRA_DURATION_DAYS - n);
}
