import type { CoinHistoryEntry } from '../context/AppContext';
import type { RoutineType } from '../data/routines';
import { supabase } from './supabase';

export type EconomySnapshot = {
  coins: number;
  totalEarned: number;
  streak: number;
  lastRoutineDate: string | null;
  coinHistory: CoinHistoryEntry[];
  validated: { washday: boolean; daily: boolean; night: boolean };
};

export type EconomyRpcResult = {
  ok: boolean;
  error?: string;
  alreadyDone?: boolean;
  snapshot?: EconomySnapshot;
};

type RpcWallet = {
  ok?: boolean;
  error?: string;
  already_done?: boolean;
  coins?: number;
  total_earned?: number;
  streak?: number;
  last_routine_date?: string | null;
  validated_today?: { washday?: boolean; daily?: boolean; night?: boolean };
};

function mapValidated(v: RpcWallet['validated_today']) {
  return {
    washday: !!v?.washday,
    daily:   !!v?.daily,
    night:   !!v?.night,
  };
}

async function fetchCoinHistory(userId: string): Promise<CoinHistoryEntry[]> {
  const { data, error } = await supabase
    .from('coin_history')
    .select('id, label, amount, date')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map(row => ({
    id: row.id,
    label: row.label,
    amount: row.amount,
    date: row.date,
  }));
}

async function buildSnapshotFromRpc(
  userId: string,
  row: RpcWallet,
): Promise<EconomySnapshot> {
  const coinHistory = await fetchCoinHistory(userId);
  return {
    coins: Number(row.coins) || 0,
    totalEarned: Number(row.total_earned) || 0,
    streak: Number(row.streak) || 0,
    lastRoutineDate: row.last_routine_date ?? null,
    coinHistory,
    validated: mapValidated(row.validated_today),
  };
}

export async function refreshEconomyFromServer(userId: string): Promise<EconomySnapshot> {
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: profile, error: profileErr },
    coinHistory,
    { data: todayLogs, error: logsErr },
  ] = await Promise.all([
    supabase.from('profiles').select('coins, total_earned, streak, last_routine_date').eq('id', userId).single(),
    fetchCoinHistory(userId),
    supabase
      .from('routine_logs')
      .select('routine_type')
      .eq('user_id', userId)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`),
  ]);

  if (profileErr) throw new Error(profileErr.message);
  if (logsErr) throw new Error(logsErr.message);

  const validatedToday = (todayLogs ?? []).map(r => r.routine_type as RoutineType);

  return {
    coins: Number(profile?.coins) || 0,
    totalEarned: Number(profile?.total_earned) || 0,
    streak: Number(profile?.streak) || 0,
    lastRoutineDate: profile?.last_routine_date ?? null,
    coinHistory,
    validated: {
      washday: validatedToday.includes('washday'),
      daily:   validatedToday.includes('daily'),
      night:   validatedToday.includes('night'),
    },
  };
}

export async function validateRoutineOnServer(
  routineType: RoutineType,
): Promise<EconomyRpcResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { data, error } = await supabase.rpc('validate_routine', {
    p_routine_type: routineType,
  });

  if (error) return { ok: false, error: error.message };
  const row = (data ?? {}) as RpcWallet;
  if (!row.ok) return { ok: false, error: row.error ?? 'rpc_failed' };

  const snapshot = await buildSnapshotFromRpc(user.id, row);
  return { ok: true, alreadyDone: !!row.already_done, snapshot };
}

export async function grantCoinsOnServer(args: {
  amount: number;
  label: string;
  points?: number;
  idempotencyKey?: string;
}): Promise<EconomyRpcResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { data, error } = await supabase.rpc('grant_coins', {
    p_amount: args.amount,
    p_label: args.label,
    p_points: args.points ?? null,
    p_idempotency_key: args.idempotencyKey ?? null,
  });

  if (error) return { ok: false, error: error.message };
  const row = (data ?? {}) as RpcWallet;
  if (!row.ok) return { ok: false, error: row.error ?? 'rpc_failed' };

  const snapshot = await buildSnapshotFromRpc(user.id, row);
  return { ok: true, alreadyDone: !!row.already_done, snapshot };
}

export async function spendCoinsOnServer(
  amount: number,
  label: string,
): Promise<EconomyRpcResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { data, error } = await supabase.rpc('spend_coins', {
    p_amount: amount,
    p_label: label,
  });

  if (error) return { ok: false, error: error.message };
  const row = (data ?? {}) as RpcWallet;
  if (!row.ok) return { ok: false, error: row.error ?? 'rpc_failed' };

  const snapshot = await buildSnapshotFromRpc(user.id, row);
  return { ok: true, snapshot };
}

export async function grantJournalEntryOnServer(args: {
  kind: 'soin' | 'routine';
  label: string;
  entryDate?: string;
}): Promise<EconomyRpcResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { data, error } = await supabase.rpc('grant_journal_entry', {
    p_kind: args.kind,
    p_label: args.label,
    p_entry_date: args.entryDate ?? null,
  });

  if (error) return { ok: false, error: error.message };
  const row = (data ?? {}) as RpcWallet;
  if (!row.ok) return { ok: false, error: row.error ?? 'rpc_failed' };

  const snapshot = await buildSnapshotFromRpc(user.id, row);
  return { ok: true, alreadyDone: !!row.already_done, snapshot };
}

export async function applyReferralCodeOnServer(code: string): Promise<EconomyRpcResult & {
  referralError?: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { data, error } = await supabase.rpc('apply_referral_code', { p_code: code.trim() });

  if (error) return { ok: false, error: error.message };
  const row = (data ?? {}) as RpcWallet & { error?: string };
  if (!row.ok) {
    return { ok: false, referralError: row.error ?? 'rpc_failed', error: row.error };
  }

  const snapshot = await buildSnapshotFromRpc(user.id, row);
  return { ok: true, alreadyDone: !!row.already_done, snapshot };
}

export async function fetchMyReferralCode(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code, name')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  if (data.referral_code) return data.referral_code as string;

  return null;
}

export async function fetchReferrerUsedCode(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referee_id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data.referral_code as string;
}

export type ReferralDashboardStats = {
  referralsCount: number;
  coinsEarnedAsReferrer: number;
  refereeCodeUsed: string | null;
};

/** Stats parrainage : source de vérité serveur (`public.referrals`). */
export async function fetchReferralDashboardStats(): Promise<ReferralDashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { referralsCount: 0, coinsEarnedAsReferrer: 0, refereeCodeUsed: null };
  }

  const [asReferrer, asReferee] = await Promise.all([
    supabase
      .from('referrals')
      .select('reward_cc')
      .eq('referrer_id', user.id),
    supabase
      .from('referrals')
      .select('referral_code')
      .eq('referee_id', user.id)
      .maybeSingle(),
  ]);

  const rows = asReferrer.data ?? [];
  const coinsEarnedAsReferrer = rows.reduce(
    (sum, r) => sum + (Number(r.reward_cc) || 0),
    0,
  );

  return {
    referralsCount: rows.length,
    coinsEarnedAsReferrer,
    refereeCodeUsed: (asReferee.data?.referral_code as string | undefined) ?? null,
  };
}

export async function claimOnboardingGiftOnServer(): Promise<EconomyRpcResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { data, error } = await supabase.rpc('claim_onboarding_gift');

  if (error) return { ok: false, error: error.message };
  const row = (data ?? {}) as RpcWallet & { granted?: boolean };
  if (!row.ok) return { ok: false, error: row.error ?? 'rpc_failed' };

  const snapshot = await refreshEconomyFromServer(user.id);
  return { ok: true, alreadyDone: !!row.already_done, snapshot };
}
